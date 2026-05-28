import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Redis } from 'ioredis';
import { AUCTION_REDIS } from './redis/redis.module';
import { AUCTION_QUEUE_NAME } from './auction.constants';
import {
  AuctionStateService,
  auctionClosingLockKey,
} from './auction-state.service';
import { AuctionService } from './auction.service';
import { AuctionNotificationService } from './auction-notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionBidEntity } from './auction_bid.entity';

type AuctionJobData = { auctionId: number };

@Processor(AUCTION_QUEUE_NAME)
export class AuctionJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionJobsProcessor.name);

  constructor(
    @Inject(AUCTION_REDIS) private readonly redis: Redis,
    private readonly auctionService: AuctionService,
    private readonly stateService: AuctionStateService,
    private readonly notificationService: AuctionNotificationService,
    @InjectRepository(AuctionBidEntity)
    private readonly bidRepo: Repository<AuctionBidEntity>,
  ) {
    super();
  }

  async process(job: Job<AuctionJobData>): Promise<unknown> {
    if (job.name === 'start') {
      return this.handleStart(job.data.auctionId);
    }
    if (job.name === 'finalize') {
      return this.handleFinalize(job.data.auctionId);
    }
    this.logger.warn(`Unknown job ${job.name}`);
    return null;
  }

  async handleStart(auctionId: number) {
    const auction = await this.auctionService.markActive(auctionId);
    if (!auction) return { skipped: true, reason: 'NOT_FOUND' };
    await this.stateService.publishUpdate(auctionId, 'AUCTION_STARTED', {
      auctionId: auction.auctionId,
      shareToken: auction.shareToken,
    });
    void this.notificationService.notifyAuctionStarted(auction);
    return { ok: true };
  }

  async handleFinalize(auctionId: number) {
    const raw = await this.stateService.getRawState(auctionId);
    if (!raw) return { skipped: true, reason: 'NO_STATE' };

    const nowMs = Date.now();
    const endMs = Number(raw.current_end_time_ms);
    if (Number.isFinite(endMs) && nowMs < endMs) {
      // 이미 연장된 경우 — 새 finalize 잡이 별도로 등록되어 있음
      return { skipped: true, reason: 'NOT_YET' };
    }

    if (raw.status === 'ENDED' || raw.status === 'CANCELED') {
      return { skipped: true, reason: 'ALREADY_TERMINAL' };
    }

    // 원자적 closing lock — 멀티 노드/중복 잡 방지
    const lockKey = auctionClosingLockKey(auctionId);
    const got = await this.redis.set(lockKey, '1', 'PX', 60_000, 'NX');
    if (got !== 'OK') return { skipped: true, reason: 'ALREADY_CLOSING' };

    const highestBid = Number(raw.highest_bid || '0');
    const winnerId = raw.highest_bidder_id || '';

    // bid id 조회 (winning bid를 auction_bids에서 찾아 winner_bid_id로 저장)
    let winnerBidId: number | undefined;
    if (winnerId && highestBid > 0) {
      const winningBid = await this.bidRepo.findOne({
        where: {
          auctionId,
          bidderUserId: winnerId,
          amount: highestBid,
        },
        order: { serverTsMs: 'DESC' },
      });
      winnerBidId = winningBid?.id;
    }

    const winner =
      winnerId && highestBid > 0
        ? { userId: winnerId, price: highestBid, bidId: winnerBidId }
        : null;

    const auction = await this.auctionService.markEnded(
      auctionId,
      winner,
      endMs || nowMs,
    );
    if (!auction) {
      await this.redis.del(lockKey);
      return { skipped: true, reason: 'NOT_FOUND' };
    }

    await this.stateService.setStatus(auction.id, auction.status);
    await this.stateService.setFinalResult(auction.id, winner);

    await this.stateService.publishUpdate(auctionId, 'AUCTION_ENDED', {
      auctionId: auction.auctionId,
      shareToken: auction.shareToken,
      winner: winner ? { userId: winner.userId, price: winner.price } : null,
    });

    void this.notificationService.notifyAuctionEnded(auction, winner);

    await this.redis.del(lockKey);

    return { ok: true, winner };
  }
}
