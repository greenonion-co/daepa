import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { AUCTION_REDIS } from './redis/redis.module';
import {
  AUCTION_BID_QUEUE_NAME,
  AUCTION_BID_RATE_LIMIT_MAX,
  AUCTION_BID_RATE_LIMIT_WINDOW_MS,
  AUCTION_QUEUE_NAME,
  RECENT_BIDS_KEEP,
} from './auction.constants';
import {
  AuctionStateService,
  auctionBidsKey,
  auctionStateKey,
} from './auction-state.service';

export type PlaceBidInput = {
  auctionId: number;
  auctionShareToken: string;
  userId: string;
  nickname: string;
  amount: number;
};

export type BidSuccess = {
  success: true;
  amount: number;
  bidderId: string;
  bidderNickname: string;
  newEndTimeMs: number;
  extended: boolean;
  tsMs: number;
};

export type BidFailure = {
  success: false;
  code: string;
  requiredMin?: number;
};

export type BidResult = BidSuccess | BidFailure;

@Injectable()
export class BidService {
  private readonly logger = new Logger(BidService.name);
  private readonly luaScript: string;

  constructor(
    @Inject(AUCTION_REDIS) private readonly redis: Redis,
    private readonly stateService: AuctionStateService,
    @InjectQueue(AUCTION_BID_QUEUE_NAME) private readonly bidQueue: Queue,
    @InjectQueue(AUCTION_QUEUE_NAME) private readonly auctionQueue: Queue,
  ) {
    const luaPath = path.join(__dirname, 'lua', 'place-bid.lua');
    if (fs.existsSync(luaPath)) {
      this.luaScript = fs.readFileSync(luaPath, 'utf8');
    } else {
      // dist 빌드 시 lua 파일이 함께 복사되지 않을 수 있어 src 경로 fallback
      const fallback = path.resolve(
        process.cwd(),
        'src/auction/lua/place-bid.lua',
      );
      this.luaScript = fs.readFileSync(fallback, 'utf8');
    }
  }

  /** 사용자별 입찰 rate limit (1초 내 N회 초과 시 reject) */
  private async checkRateLimit(
    auctionId: number,
    userId: string,
  ): Promise<boolean> {
    const key = `bid:rl:${auctionId}:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.pexpire(key, AUCTION_BID_RATE_LIMIT_WINDOW_MS);
    }
    return count <= AUCTION_BID_RATE_LIMIT_MAX;
  }

  async placeBid(input: PlaceBidInput): Promise<BidResult> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { success: false, code: 'BAD_AMOUNT' };
    }

    const okRate = await this.checkRateLimit(input.auctionId, input.userId);
    if (!okRate) {
      return { success: false, code: 'RATE_LIMITED' };
    }

    const nowMs = Date.now();

    let result: unknown;
    try {
      result = await this.redis.eval(
        this.luaScript,
        2,
        auctionStateKey(input.auctionId),
        auctionBidsKey(input.auctionId),
        String(input.amount),
        input.userId,
        input.nickname || '',
        String(nowMs),
        String(RECENT_BIDS_KEEP),
      );
    } catch (err) {
      this.logger.error('Lua eval failed', err);
      return { success: false, code: 'INTERNAL' };
    }

    if (!Array.isArray(result)) {
      return { success: false, code: 'INTERNAL' };
    }

    const arr = result as Array<string | number>;
    const ok = Number(arr[0]);
    const code = String(arr[1]);

    if (ok !== 1) {
      const requiredMin = arr[2] ? Number(arr[2]) : undefined;
      return { success: false, code, requiredMin };
    }

    const amount = Number(arr[2]);
    const bidderId = String(arr[3]);
    const newEndTimeMs = Number(arr[4]);
    const extended = String(arr[5]) === '1';
    const tsMs = Number(arr[6]);

    const payload: BidSuccess = {
      success: true,
      amount,
      bidderId,
      bidderNickname: input.nickname,
      newEndTimeMs,
      extended,
      tsMs,
    };

    // 1) 모든 노드에 broadcast
    await this.stateService.publishUpdate(input.auctionId, 'BID_ACCEPTED', {
      auctionId: input.auctionId,
      shareToken: input.auctionShareToken,
      bidderId,
      nickname: input.nickname,
      amount,
      newEndTimeMs,
      extended,
      tsMs,
    });

    // 2) MySQL 영속화 — BullMQ로 비동기
    try {
      await this.bidQueue.add(
        'persist',
        {
          auctionId: input.auctionId,
          bidderUserId: bidderId,
          amount,
          serverTsMs: tsMs,
          triggeredExtension: extended ? 1 : 0,
        },
        {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 5,
          backoff: { type: 'exponential', delay: 500 },
        },
      );
    } catch (err) {
      this.logger.warn('bid persist enqueue failed', err);
    }

    // 3) 연장됐다면 종료 잡 재스케줄
    if (extended) {
      try {
        const finalizeJobId = `auction:${input.auctionId}:finalize`;
        const delay = Math.max(0, newEndTimeMs - Date.now());
        // remove existing job (if any) then add — same jobId replaces it
        await this.auctionQueue.remove(finalizeJobId).catch(() => undefined);
        await this.auctionQueue.add(
          'finalize',
          { auctionId: input.auctionId },
          {
            jobId: finalizeJobId,
            delay,
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        );
      } catch (err) {
        this.logger.warn('finalize reschedule failed', err);
      }
    }

    return payload;
  }
}
