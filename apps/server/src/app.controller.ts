import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from './auth/auth.decorator';
import { AppService } from './app.service';
import { Redis } from 'ioredis';
import { AUCTION_REDIS } from './auction/redis/redis.module';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(AUCTION_REDIS) private readonly redis: Redis,
    private readonly dataSource: DataSource,
  ) {}

  @Get('/health')
  @Public()
  async health(): Promise<{
    ok: boolean;
    redis: boolean;
    db: boolean;
  }> {
    let redisOk = false;
    let dbOk = false;
    try {
      const pong = await this.redis.ping();
      redisOk = pong === 'PONG';
    } catch {
      redisOk = false;
    }
    try {
      await this.dataSource.query('SELECT 1');
      dbOk = true;
    } catch {
      dbOk = false;
    }
    return { ok: redisOk && dbOk, redis: redisOk, db: dbOk };
  }
}
