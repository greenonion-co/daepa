import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
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
  constructor(
    @Inject(AUCTION_REDIS) private readonly redis: Redis,
    @Inject(AUCTION_REDIS_SUB) private readonly redisSub: Redis,
    @Inject(AUCTION_REDIS_BULL) private readonly redisBull: Redis,
  ) {}

  // graceful shutdown — 명시적 quit() 없이는 ioredis 연결이 정리되지 않아
  // 프로세스 종료 지연 / SUB 리스너 좀비화 발생.
  async onModuleDestroy() {
    await Promise.allSettled([
      this.redis.quit(),
      this.redisSub.quit(),
      this.redisBull.quit(),
    ]);
  }
}
