import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AUCTION_REDIS } from './redis/redis.module';
import { AuctionEntity } from './auction.entity';
import { AUCTION_STATUS } from './auction.constants';
import { AuctionBidDto, AuctionStateDto } from './auction.dto';

const ACTIVE_KEY = 'auction:active';
const ENDED_TTL_SECONDS = 24 * 60 * 60;

export const auctionStateKey = (id: number) => `auction:${id}:state`;
export const auctionBidsKey = (id: number) => `auction:${id}:bids`;
export const auctionUpdatesChannel = (id: number) => `auction:${id}:updates`;
export const auctionClosingLockKey = (id: number) => `auction:${id}:closing`;

@Injectable()
export class AuctionStateService {
  private readonly logger = new Logger(AuctionStateService.name);

  constructor(@Inject(AUCTION_REDIS) private readonly redis: Redis) {}

  async hydrate(auction: AuctionEntity): Promise<void> {
    const startMs = auction.startTime.getTime();
    const origEndMs = auction.originalEndTime.getTime();
    const curEndMs = auction.currentEndTime.getTime();
    const winMs = auction.extensionMinutes * 60 * 1000;

    const key = auctionStateKey(auction.id);
    const pipe = this.redis.multi();

    pipe.hset(key, {
      auction_id: auction.auctionId,
      pet_id: auction.petId,
      host_user_id: auction.hostUserId,
      share_token: auction.shareToken,
      status: auction.status,
      highest_bid: '0',
      highest_bidder_id: '',
      highest_bidder_nickname: '',
      starting_price: String(auction.startingPrice),
      min_increment: String(auction.minIncrement),
      extension_minutes: String(auction.extensionMinutes),
      extension_window_ms: String(winMs),
      start_time_ms: String(startMs),
      original_end_time_ms: String(origEndMs),
      current_end_time_ms: String(curEndMs),
      last_bid_ts_ms: '0',
    });

    pipe.del(auctionBidsKey(auction.id));

    if (
      auction.status === AUCTION_STATUS.ACTIVE ||
      auction.status === AUCTION_STATUS.PENDING
    ) {
      pipe.sadd(ACTIVE_KEY, String(auction.id));
    }

    await pipe.exec();
  }

  async setStatus(auctionId: number, status: AUCTION_STATUS): Promise<void> {
    const key = auctionStateKey(auctionId);
    if (status === AUCTION_STATUS.ENDED || status === AUCTION_STATUS.CANCELED) {
      const pipe = this.redis.multi();
      pipe.hset(key, 'status', status);
      pipe.srem(ACTIVE_KEY, String(auctionId));
      pipe.expire(key, ENDED_TTL_SECONDS);
      pipe.expire(auctionBidsKey(auctionId), ENDED_TTL_SECONDS);
      await pipe.exec();
    } else {
      await this.redis.hset(key, 'status', status);
    }
  }

  async setFinalResult(
    auctionId: number,
    winner: { userId: string; price: number } | null,
  ): Promise<void> {
    const key = auctionStateKey(auctionId);
    const pipe = this.redis.multi();
    if (winner) {
      pipe.hset(key, {
        final_price: String(winner.price),
        winner_user_id: winner.userId,
      });
    } else {
      pipe.hset(key, {
        final_price: '',
        winner_user_id: '',
      });
    }
    await pipe.exec();
  }

  async getActiveIds(): Promise<number[]> {
    const ids = await this.redis.smembers(ACTIVE_KEY);
    return ids.map((s) => Number(s)).filter((n) => Number.isFinite(n));
  }

  async getCurrentEndTimeMs(auctionId: number): Promise<number | null> {
    const v = await this.redis.hget(
      auctionStateKey(auctionId),
      'current_end_time_ms',
    );
    return v ? Number(v) : null;
  }

  async getRawState(auctionId: number): Promise<Record<string, string> | null> {
    const data = await this.redis.hgetall(auctionStateKey(auctionId));
    if (!data || Object.keys(data).length === 0) return null;
    return data;
  }

  async getRecentBids(auctionId: number, limit = 50): Promise<AuctionBidDto[]> {
    const items = await this.redis.lrange(
      auctionBidsKey(auctionId),
      0,
      limit - 1,
    );
    const out: AuctionBidDto[] = [];
    for (const it of items) {
      try {
        const obj = JSON.parse(it) as {
          bidderId?: string;
          nickname?: string;
          amount?: number;
          ts?: number;
          ext?: number;
        };
        if (typeof obj.amount !== 'number' || typeof obj.ts !== 'number')
          continue;
        out.push({
          bidderUserId: obj.bidderId ?? '',
          bidderNickname: obj.nickname ?? null,
          amount: obj.amount,
          serverTsMs: obj.ts,
          triggeredExtension: obj.ext === 1,
        });
      } catch {
        // skip malformed
      }
    }
    return out;
  }

  async toLiveStateDto(auction: AuctionEntity): Promise<AuctionStateDto> {
    const raw = await this.getRawState(auction.id);
    const recentBids = await this.getRecentBids(auction.id);
    const nowMs = Date.now();

    const highestBid = raw ? Number(raw.highest_bid || 0) : 0;
    const highestBidderId = raw?.highest_bidder_id || '';
    const highestBidderNick = raw?.highest_bidder_nickname || '';

    const status = (raw?.status as AUCTION_STATUS) ?? auction.status;

    return {
      auctionId: auction.auctionId,
      shareToken: auction.shareToken,
      petId: auction.petId,
      hostUserId: auction.hostUserId,
      status,
      startingPrice: Number(auction.startingPrice),
      minIncrement: Number(auction.minIncrement),
      extensionMinutes: auction.extensionMinutes,
      startTimeMs: auction.startTime.getTime(),
      originalEndTimeMs: auction.originalEndTime.getTime(),
      currentEndTimeMs: raw?.current_end_time_ms
        ? Number(raw.current_end_time_ms)
        : auction.currentEndTime.getTime(),
      highestBid,
      highestBidder: highestBidderId
        ? { userId: highestBidderId, nickname: highestBidderNick || null }
        : null,
      recentBids,
      serverNowMs: nowMs,
      finalPrice: auction.finalPrice ? Number(auction.finalPrice) : null,
      winnerUserId: auction.winnerUserId,
    };
  }

  async publishUpdate(
    auctionId: number,
    type: string,
    payload: unknown,
  ): Promise<void> {
    try {
      await this.redis.publish(
        auctionUpdatesChannel(auctionId),
        JSON.stringify({ type, payload }),
      );
    } catch (err) {
      this.logger.warn(`publish failed ${auctionId} ${type}`, err);
    }
  }
}
