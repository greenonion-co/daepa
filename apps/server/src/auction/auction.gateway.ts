import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Redis } from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { AUCTION_REDIS_SUB } from './redis/redis.module';
import { AuctionService } from './auction.service';
import { BidService } from './bid.service';
import { AuctionStateService } from './auction-state.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/user.entity';

interface AuthSocketData {
  userId?: string;
  nickname?: string;
}

type AuthSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  AuthSocketData
>;

const SERVER_TIME_INTERVAL_MS = 30_000;

@Injectable()
@WebSocketGateway({
  namespace: '/auction',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class AuctionGateway
  implements OnGatewayInit, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(AuctionGateway.name);

  @WebSocketServer()
  server: Server;

  private serverTimeTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(AUCTION_REDIS_SUB) private readonly redisSub: Redis,
    private readonly auctionService: AuctionService,
    private readonly bidService: BidService,
    private readonly stateService: AuctionStateService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async afterInit() {
    await this.redisSub.psubscribe('auction:*:updates');
    this.redisSub.on('pmessage', (_pattern, channel, message) => {
      try {
        const m = /^auction:(\d+):updates$/.exec(channel);
        if (!m) return;
        const auctionId = Number(m[1]);
        const event = JSON.parse(message) as { type: string; payload: unknown };
        const room = `auction:${auctionId}`;
        const eventName = this.mapEventName(event.type);
        this.server.to(room).emit(eventName, event.payload);
      } catch (err) {
        this.logger.warn('pmessage handle failed', err);
      }
    });

    // 30초마다 server_time broadcast
    this.serverTimeTimer = setInterval(() => {
      try {
        this.server.emit('auction:server_time', { serverNowMs: Date.now() });
      } catch {
        // ignore
      }
    }, SERVER_TIME_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.serverTimeTimer) clearInterval(this.serverTimeTimer);
    try {
      await this.redisSub.punsubscribe('auction:*:updates');
    } catch {
      // ignore
    }
  }

  handleDisconnect(client: AuthSocket) {
    void client;
  }

  private mapEventName(type: string): string {
    switch (type) {
      case 'BID_ACCEPTED':
        return 'auction:bid_accepted';
      case 'AUCTION_ENDED':
        return 'auction:ended';
      case 'AUCTION_CANCELED':
        return 'auction:cancelled';
      case 'AUCTION_STARTED':
        return 'auction:started';
      default:
        return 'auction:event';
    }
  }

  private async authenticateClient(client: AuthSocket): Promise<void> {
    if (client.data?.userId) return; // 이미 인증됨

    const token =
      (client.handshake.auth as { token?: string } | undefined)?.token ||
      (client.handshake.query?.token as string | undefined);
    if (!token) return;

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET ?? '',
      });
      const user = await this.dataSource.getRepository(UserEntity).findOne({
        where: { userId: payload.sub },
        select: ['userId', 'name'],
      });
      if (user) {
        client.data.userId = user.userId;
        client.data.nickname = user.name;
      }
    } catch (err) {
      // 토큰 invalid — 무인증 read-only로 진행
      void err;
    }
  }

  @SubscribeMessage('auction:join')
  async onJoin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { shareToken: string; token?: string },
  ) {
    if (body?.token && !client.data?.userId) {
      // join에서 옵셔널 토큰 받기 (auth handshake 미사용 시)
      try {
        const payload = this.jwtService.verify<JwtPayload>(body.token, {
          secret: process.env.JWT_SECRET ?? '',
        });
        const user = await this.dataSource.getRepository(UserEntity).findOne({
          where: { userId: payload.sub },
          select: ['userId', 'name'],
        });
        if (user) {
          client.data.userId = user.userId;
          client.data.nickname = user.name;
        }
      } catch {
        // ignore
      }
    } else {
      await this.authenticateClient(client);
    }

    if (!body?.shareToken) {
      throw new WsException('SHARE_TOKEN_REQUIRED');
    }

    const auction = await this.auctionService.findByShareTokenOrThrow(
      body.shareToken,
    );

    await client.join(`auction:${auction.id}`);
    const state = await this.auctionService.getLiveState(auction);
    client.emit('auction:state', state);

    return { ok: true };
  }

  @SubscribeMessage('auction:leave')
  async onLeave(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { shareToken: string },
  ) {
    if (!body?.shareToken) return { ok: false };
    const auction = await this.auctionService
      .findByShareTokenOrThrow(body.shareToken)
      .catch(() => null);
    if (auction) {
      await client.leave(`auction:${auction.id}`);
    }
    return { ok: true };
  }

  @SubscribeMessage('auction:bid')
  async onBid(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { shareToken: string; amount: number; token?: string },
  ) {
    if (body?.token && !client.data?.userId) {
      // join 없이 바로 bid 호출 시 토큰 인증
      try {
        const payload = this.jwtService.verify<JwtPayload>(body.token, {
          secret: process.env.JWT_SECRET ?? '',
        });
        const user = await this.dataSource.getRepository(UserEntity).findOne({
          where: { userId: payload.sub },
          select: ['userId', 'name'],
        });
        if (user) {
          client.data.userId = user.userId;
          client.data.nickname = user.name;
        }
      } catch {
        // ignore
      }
    } else {
      await this.authenticateClient(client);
    }

    if (!client.data?.userId) {
      client.emit('auction:bid_rejected', { code: 'UNAUTHENTICATED' });
      return { ok: false };
    }

    if (!body?.shareToken || typeof body.amount !== 'number') {
      client.emit('auction:bid_rejected', { code: 'BAD_INPUT' });
      return { ok: false };
    }

    const auction = await this.auctionService.findByShareTokenOrThrow(
      body.shareToken,
    );

    if (auction.hostUserId === client.data.userId) {
      client.emit('auction:bid_rejected', { code: 'OWN_PET' });
      return { ok: false };
    }

    const result = await this.bidService.placeBid({
      auctionId: auction.id,
      auctionExternalId: auction.auctionId,
      auctionShareToken: auction.shareToken,
      userId: client.data.userId,
      nickname: client.data.nickname ?? '',
      amount: body.amount,
    });

    if (!result.success) {
      client.emit('auction:bid_rejected', {
        code: result.code,
        requiredMin: result.requiredMin,
      });
      return { ok: false };
    }

    return { ok: true };
  }
}
