import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AUCTION_BID_QUEUE_NAME } from './auction.constants';
import { AuctionBidEntity } from './auction_bid.entity';
import { AuctionParticipantEntity } from './auction_participant.entity';

type BidPersistData = {
  auctionId: number;
  bidderUserId: string;
  amount: number;
  serverTsMs: number;
  triggeredExtension: number;
};

@Processor(AUCTION_BID_QUEUE_NAME)
export class BidPersistProcessor extends WorkerHost {
  private readonly logger = new Logger(BidPersistProcessor.name);

  constructor(
    @InjectRepository(AuctionBidEntity)
    private readonly bidRepo: Repository<AuctionBidEntity>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<BidPersistData>): Promise<unknown> {
    if (job.name !== 'persist') return null;

    const data = job.data;

    await this.dataSource.transaction(async (em) => {
      const bid = new AuctionBidEntity();
      bid.auctionId = data.auctionId;
      bid.bidderUserId = data.bidderUserId;
      bid.amount = data.amount;
      bid.serverTsMs = data.serverTsMs;
      bid.triggeredExtension = data.triggeredExtension;
      await em.save(AuctionBidEntity, bid);

      // participant upsert
      const existing = await em.findOne(AuctionParticipantEntity, {
        where: {
          auctionId: data.auctionId,
          userId: data.bidderUserId,
        },
      });
      if (existing) {
        existing.bidCount += 1;
        await em.save(AuctionParticipantEntity, existing);
      } else {
        const p = new AuctionParticipantEntity();
        p.auctionId = data.auctionId;
        p.userId = data.bidderUserId;
        p.bidCount = 1;
        await em.save(AuctionParticipantEntity, p);
      }
    });

    return { ok: true };
  }
}
