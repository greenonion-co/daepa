import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AuctionEntity } from './auction.entity';
import { AuctionBidEntity } from './auction_bid.entity';
import { AuctionParticipantEntity } from './auction_participant.entity';
import { AuctionRedisModule, AUCTION_REDIS_BULL } from './redis/redis.module';
import {
  AUCTION_BID_QUEUE_NAME,
  AUCTION_QUEUE_NAME,
} from './auction.constants';
import { AuctionService } from './auction.service';
import { BidService } from './bid.service';
import { AuctionStateService } from './auction-state.service';
import { AuctionSchedulerService } from './auction-scheduler.service';
import { AuctionJobsProcessor } from './auction-jobs.processor';
import { BidPersistProcessor } from './bid-persist.processor';
import { AuctionNotificationService } from './auction-notification.service';
import { AuctionGateway } from './auction.gateway';
import { AuctionController, MyAuctionController } from './auction.controller';
import { FcmModule } from '../fcm/fcm.module';
import { Redis } from 'ioredis';

@Module({
  imports: [
    AuctionRedisModule,
    ScheduleModule.forRoot(),
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? '',
    }),
    TypeOrmModule.forFeature([
      AuctionEntity,
      AuctionBidEntity,
      AuctionParticipantEntity,
    ]),
    BullModule.forRootAsync({
      imports: [AuctionRedisModule],
      inject: [AUCTION_REDIS_BULL],
      useFactory: (redis: Redis) => ({
        connection: redis,
      }),
    }),
    BullModule.registerQueue(
      { name: AUCTION_QUEUE_NAME },
      { name: AUCTION_BID_QUEUE_NAME },
    ),
    FcmModule,
  ],
  controllers: [AuctionController, MyAuctionController],
  providers: [
    AuctionService,
    BidService,
    AuctionStateService,
    AuctionSchedulerService,
    AuctionJobsProcessor,
    BidPersistProcessor,
    AuctionNotificationService,
    AuctionGateway,
  ],
  exports: [AuctionService],
})
export class AuctionModule {}
