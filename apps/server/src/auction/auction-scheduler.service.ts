import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AUCTION_QUEUE_NAME } from './auction.constants';
import { AuctionStateService } from './auction-state.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionEntity } from './auction.entity';
import { AUCTION_STATUS } from './auction.constants';

@Injectable()
export class AuctionSchedulerService {
  private readonly logger = new Logger(AuctionSchedulerService.name);

  constructor(
    @InjectQueue(AUCTION_QUEUE_NAME) private readonly auctionQueue: Queue,
    @InjectRepository(AuctionEntity)
    private readonly auctionRepo: Repository<AuctionEntity>,
    private readonly stateService: AuctionStateService,
  ) {}

  /** 신규 경매 생성 시 호출 — start/finalize 잡 등록 */
  async scheduleAuction(auction: AuctionEntity): Promise<void> {
    const startDelay = Math.max(0, auction.startTime.getTime() - Date.now());
    const endDelay = Math.max(0, auction.currentEndTime.getTime() - Date.now());

    await this.auctionQueue.add(
      'start',
      { auctionId: auction.id },
      {
        jobId: `auction:${auction.id}:start`,
        delay: startDelay,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );

    await this.auctionQueue.add(
      'finalize',
      { auctionId: auction.id },
      {
        jobId: `auction:${auction.id}:finalize`,
        delay: endDelay,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }

  /** 30초마다 — 누락 잡 안전망 */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async watchdog() {
    try {
      const ids = await this.stateService.getActiveIds();
      const nowMs = Date.now();

      for (const id of ids) {
        const raw = await this.stateService.getRawState(id);
        if (!raw) continue;

        // PENDING이면서 시작 시각이 지났는데 status가 PENDING인 경우 → start 잡 재시도
        const startMs = Number(raw.start_time_ms);
        const endMs = Number(raw.current_end_time_ms);

        if (
          raw.status === 'PENDING' &&
          Number.isFinite(startMs) &&
          nowMs >= startMs
        ) {
          await this.auctionQueue.add(
            'start',
            { auctionId: id },
            {
              jobId: `auction:${id}:start:wd:${Date.now()}`,
              removeOnComplete: 1000,
              removeOnFail: 5000,
            },
          );
        }

        if (
          (raw.status === 'ACTIVE' || raw.status === 'PENDING') &&
          Number.isFinite(endMs) &&
          nowMs >= endMs
        ) {
          await this.auctionQueue.add(
            'finalize',
            { auctionId: id },
            {
              jobId: `auction:${id}:finalize:wd:${Date.now()}`,
              removeOnComplete: 1000,
              removeOnFail: 5000,
            },
          );
        }
      }
    } catch (err) {
      this.logger.warn('watchdog tick failed', err);
    }
  }

  /** 5분마다 — DB 기준 fallback (Redis flush 등으로 active set이 비었을 때 대비) */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async dbFallbackWatchdog() {
    try {
      const nowMs = Date.now();
      const overdue = await this.auctionRepo.find({
        where: [
          { status: AUCTION_STATUS.ACTIVE },
          { status: AUCTION_STATUS.PENDING },
        ],
        take: 200,
      });
      for (const a of overdue) {
        if (a.currentEndTime.getTime() <= nowMs) {
          await this.auctionQueue.add(
            'finalize',
            { auctionId: a.id },
            {
              jobId: `auction:${a.id}:finalize:dbwd:${Date.now()}`,
              removeOnComplete: 1000,
              removeOnFail: 5000,
            },
          );
        } else if (
          a.status === AUCTION_STATUS.PENDING &&
          a.startTime.getTime() <= nowMs
        ) {
          await this.auctionQueue.add(
            'start',
            { auctionId: a.id },
            {
              jobId: `auction:${a.id}:start:dbwd:${Date.now()}`,
              removeOnComplete: 1000,
              removeOnFail: 5000,
            },
          );
        }
      }
    } catch (err) {
      this.logger.warn('db fallback watchdog failed', err);
    }
  }
}
