import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisCache } from 'cache-manager-redis-yet';

/** null 결과를 캐시에 저장할 때 사용하는 sentinel 값 */
const NULL_SENTINEL = '__NULL__';

/** null 결과 캐시 TTL: 30초 */
const NULL_TTL = 30 * 1000;

/** SCAN 한 번에 가져올 키 수 */
const SCAN_COUNT = 100;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  /**
   * Singleflight: 같은 키에 대한 동시 DB 호출을 하나로 합침.
   * 캐시 만료 직후 동시 요청 50개가 들어와도 DB는 1번만 호출.
   */
  private readonly inflightMap = new Map<string, Promise<any>>();

  constructor(@Inject(CACHE_MANAGER) private cache: RedisCache) {}

  /**
   * 캐시에 있으면 반환, 없으면 fallback 실행 후 캐시에 저장.
   * - Singleflight로 동시 요청 보호 (cache stampede 방지)
   * - null 결과도 짧은 TTL로 캐싱 (cache penetration 방지)
   *
   * @example
   * return this.cacheService.wrap(
   *   CACHE.pet.key(petId),
   *   () => this.petRepo.findOne({ where: { petId } }),
   *   CACHE.pet.ttl,
   * );
   */
  async wrap<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number,
  ): Promise<T> {
    // 1. 캐시 조회
    try {
      const cached = await this.cache.get<T | string>(key);
      if (cached === NULL_SENTINEL) {
        return null as T;
      }
      if (cached !== undefined && cached !== null) {
        return cached as T;
      }
    } catch (err) {
      this.logger.warn(`Cache GET failed for key=${key}`, err);
    }

    // 2. Singleflight: 이미 같은 키로 DB 호출 중이면 그 결과를 기다림
    const inflight = this.inflightMap.get(key);
    if (inflight) {
      return inflight as Promise<T>;
    }

    // 3. DB 호출 + 캐시 저장
    const promise = this.fetchAndCache<T>(key, fallback, ttl);
    this.inflightMap.set(key, promise);

    try {
      return await promise;
    } finally {
      this.inflightMap.delete(key);
    }
  }

  /** 단일 키 조회 */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cache.get<T | string>(key);
      if (cached === NULL_SENTINEL) {
        return null;
      }
      if (cached !== undefined && cached !== null) {
        return cached as T;
      }
      return null;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key=${key}`, err);
      return null;
    }
  }

  /** 단일 키 저장 */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (err) {
      this.logger.warn(`Cache SET failed for key=${key}`, err);
    }
  }

  /** 단일 키 삭제 */
  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL failed for key=${key}`, err);
    }
  }

  /** 패턴으로 일괄 삭제 — SCAN 기반 (비블로킹) */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const client = this.cache.store.client;
      let cursor = 0;

      do {
        const result = await client.scan(cursor, {
          MATCH: pattern,
          COUNT: SCAN_COUNT,
        });
        cursor = result.cursor;
        const keys: string[] = result.keys;

        if (keys.length > 0) {
          await client.del(keys);
        }
      } while (cursor !== 0);
    } catch (err) {
      this.logger.warn(`Cache DEL pattern failed for pattern=${pattern}`, err);
    }
  }

  private async fetchAndCache<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number,
  ): Promise<T> {
    const fresh = await fallback();

    try {
      if (fresh === undefined || fresh === null) {
        // null 결과도 짧은 TTL로 캐싱 (cache penetration 방지)
        await this.cache.set(key, NULL_SENTINEL, NULL_TTL);
      } else {
        await this.cache.set(key, fresh, ttl);
      }
    } catch (err) {
      this.logger.warn(`Cache SET failed for key=${key}`, err);
    }

    return fresh;
  }
}
