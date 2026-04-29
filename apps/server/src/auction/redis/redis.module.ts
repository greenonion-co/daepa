import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';

export const AUCTION_REDIS = 'AUCTION_REDIS';
export const AUCTION_REDIS_SUB = 'AUCTION_REDIS_SUB';
export const AUCTION_REDIS_BULL = 'AUCTION_REDIS_BULL';

function buildRedisOptions() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

const redisProvider = {
  provide: AUCTION_REDIS,
  useFactory: (): Redis => new IORedis(buildRedisOptions()),
};

const redisSubProvider = {
  provide: AUCTION_REDIS_SUB,
  useFactory: (): Redis => new IORedis(buildRedisOptions()),
};

const redisBullProvider = {
  provide: AUCTION_REDIS_BULL,
  useFactory: (): Redis => new IORedis(buildRedisOptions()),
};

@Global()
@Module({
  providers: [redisProvider, redisSubProvider, redisBullProvider],
  exports: [AUCTION_REDIS, AUCTION_REDIS_SUB, AUCTION_REDIS_BULL],
})
export class AuctionRedisModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy() {
    // 프로세스 종료 시 클라이언트 정리는 NestJS lifecycle이 처리
  }
}
