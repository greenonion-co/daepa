/**
 * Lua 스크립트 동작 검증 — 실제 Redis가 필요합니다.
 *
 * REDIS_HOST, REDIS_PORT 환경변수가 설정되어야 실행됨.
 * `LIVE_REDIS_TEST=1` 환경변수가 없으면 자동 skip.
 *
 * 실행 예: LIVE_REDIS_TEST=1 pnpm test place-bid.lua.spec
 */
import IORedis, { Redis } from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

const SHOULD_RUN = process.env.LIVE_REDIS_TEST === '1';
const describeIfRedis = SHOULD_RUN ? describe : describe.skip;

describeIfRedis('place-bid.lua', () => {
  let redis: Redis;
  let lua: string;
  const auctionId = 999_999_999;
  const stateKey = `auction:${auctionId}:state`;
  const bidsKey = `auction:${auctionId}:bids`;

  beforeAll(() => {
    redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    lua = fs.readFileSync(
      path.join(__dirname, '..', 'lua', 'place-bid.lua'),
      'utf8',
    );
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.del(stateKey);
    await redis.del(bidsKey);
    await redis.hset(stateKey, {
      status: 'ACTIVE',
      highest_bid: '0',
      highest_bidder_id: '',
      starting_price: '10000',
      min_increment: '1000',
      start_time_ms: String(Date.now() - 60_000),
      current_end_time_ms: String(Date.now() + 60_000),
      extension_window_ms: String(5 * 60 * 1000),
    });
  });

  const place = async (amount: number, userId: string, ts = Date.now()) =>
    redis.eval(
      lua,
      2,
      stateKey,
      bidsKey,
      String(amount),
      userId,
      `nick-${userId}`,
      String(ts),
      '50',
    );

  test('NOT_FOUND when state missing', async () => {
    await redis.del(stateKey);
    const r = (await place(10_000, 'u1')) as [number, string];
    expect(r[0]).toBe(0);
    expect(r[1]).toBe('NOT_FOUND');
  });

  test('NOT_ACTIVE', async () => {
    await redis.hset(stateKey, 'status', 'PENDING');
    const r = (await place(10_000, 'u1')) as [number, string];
    expect(r).toEqual([0, 'NOT_ACTIVE']);
  });

  test('NOT_STARTED', async () => {
    await redis.hset(stateKey, 'start_time_ms', String(Date.now() + 60_000));
    const r = (await place(10_000, 'u1')) as [number, string];
    expect(r).toEqual([0, 'NOT_STARTED']);
  });

  test('ALREADY_ENDED', async () => {
    await redis.hset(
      stateKey,
      'current_end_time_ms',
      String(Date.now() - 1000),
    );
    const r = (await place(10_000, 'u1')) as [number, string];
    expect(r).toEqual([0, 'ALREADY_ENDED']);
  });

  test('BID_TOO_LOW: 첫 입찰은 시작가 이상이어야', async () => {
    const r = (await place(9_999, 'u1')) as [number, string, string];
    expect(r[0]).toBe(0);
    expect(r[1]).toBe('BID_TOO_LOW');
    expect(r[2]).toBe('10000'); // requiredMin = startingPrice
  });

  test('BID_TOO_LOW: 두 번째 입찰은 highest+inc 이상', async () => {
    const r1 = (await place(10_000, 'u1')) as [number, string];
    expect(r1[0]).toBe(1);
    const r2 = (await place(10_500, 'u2')) as [number, string, string];
    expect(r2[0]).toBe(0);
    expect(r2[1]).toBe('BID_TOO_LOW');
    expect(r2[2]).toBe('11000'); // 10000 + 1000
  });

  test('성공 입찰 OK + 상태 갱신', async () => {
    const r = (await place(10_000, 'u1')) as [number, string, string, string];
    expect(r[0]).toBe(1);
    expect(r[1]).toBe('OK');
    const state = await redis.hgetall(stateKey);
    expect(state.highest_bid).toBe('10000');
    expect(state.highest_bidder_id).toBe('u1');
  });

  test('연장 트리거: now == end - window', async () => {
    const now = Date.now();
    await redis.hset(stateKey, {
      current_end_time_ms: String(now + 5 * 60 * 1000), // 정확히 window 내
      extension_window_ms: String(5 * 60 * 1000),
    });
    const r = (await place(10_000, 'u1', now)) as [
      number,
      string,
      string,
      string,
      string,
      string,
    ];
    expect(r[0]).toBe(1);
    expect(r[5]).toBe('1'); // triggered_extension
    const state = await redis.hgetall(stateKey);
    expect(Number(state.current_end_time_ms)).toBeGreaterThanOrEqual(
      now + 5 * 60 * 1000,
    );
  });

  test('연장 미트리거: 마감 멀리 남음', async () => {
    const now = Date.now();
    await redis.hset(stateKey, {
      current_end_time_ms: String(now + 60 * 60 * 1000),
      extension_window_ms: String(5 * 60 * 1000),
    });
    const r = (await place(10_000, 'u1', now)) as [
      number,
      string,
      string,
      string,
      string,
      string,
    ];
    expect(r[0]).toBe(1);
    expect(r[5]).toBe('0');
  });

  test('연장 시 분 정시로 올림 (30초 이하)', async () => {
    // baseMs = 분 정시 (예: 11:00:00.000)
    const baseMs = Math.floor(Date.now() / 60_000) * 60_000;
    const nowMs = baseMs + 30_000; // baseMs + 30초
    const extWindowMs = 2 * 60 * 1000;
    await redis.hset(stateKey, {
      start_time_ms: String(baseMs - 60_000),
      current_end_time_ms: String(nowMs + 1000), // 1초 후 마감 → 트리거 가능
      extension_window_ms: String(extWindowMs),
      original_end_time_ms: String(baseMs - 60_000), // 충분히 과거 → 항상 초과
    });
    const r = (await place(10_000, 'u1', nowMs)) as [
      number,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    expect(r[0]).toBe(1);
    expect(r[5]).toBe('1'); // triggered
    // new_end = nowMs + 120_000 = baseMs + 150_000 → ceil → baseMs + 180_000 (3분 정시)
    expect(Number(r[4])).toBe(baseMs + 180_000);
  });

  test('연장 시 분 정시로 올림 (30초 초과)', async () => {
    const baseMs = Math.floor(Date.now() / 60_000) * 60_000;
    const nowMs = baseMs + 31_000; // 31초
    const extWindowMs = 2 * 60 * 1000;
    await redis.hset(stateKey, {
      start_time_ms: String(baseMs - 60_000),
      current_end_time_ms: String(nowMs + 1000),
      extension_window_ms: String(extWindowMs),
      original_end_time_ms: String(baseMs - 60_000),
    });
    const r = (await place(10_000, 'u1', nowMs)) as [
      number,
      string,
      ...string[],
    ];
    expect(r[0]).toBe(1);
    // new_end = baseMs + 151_000 → ceil → baseMs + 180_000 (3분 정시)
    expect(Number(r[4])).toBe(baseMs + 180_000);
  });

  test('연장 시 분 정시 입력은 그대로 유지', async () => {
    const baseMs = Math.floor(Date.now() / 60_000) * 60_000;
    const nowMs = baseMs; // 정확히 분 정시
    const extWindowMs = 2 * 60 * 1000;
    await redis.hset(stateKey, {
      start_time_ms: String(baseMs - 60_000),
      current_end_time_ms: String(nowMs + 1000),
      extension_window_ms: String(extWindowMs),
      original_end_time_ms: String(baseMs - 60_000),
    });
    const r = (await place(10_000, 'u1', nowMs)) as [
      number,
      string,
      ...string[],
    ];
    expect(r[0]).toBe(1);
    // new_end = baseMs + 120_000 (정확히 2분 정시) → ceil → 변화 없음
    expect(Number(r[4])).toBe(baseMs + 120_000);
  });

  test('original 미초과 시 분 반올림 적용 안 됨', async () => {
    const now = Date.now();
    await redis.hset(stateKey, {
      current_end_time_ms: String(now + 5 * 60 * 1000),
      extension_window_ms: String(5 * 60 * 1000),
      original_end_time_ms: String(now + 100 * 60 * 1000), // 충분히 미래
    });
    const r = (await place(10_000, 'u1', now)) as [number, string, ...string[]];
    expect(r[0]).toBe(1);
    expect(r[5]).toBe('1');
    // new_end = now + 5min, original = now + 100min → new_end < original → 반올림 X
    expect(Number(r[4])).toBe(now + 5 * 60 * 1000);
  });

  test('동시성: 100 개 동시 입찰 → 정확히 1 개만 성공 (같은 금액)', async () => {
    const promises = Array.from({ length: 100 }).map((_, i) =>
      place(11_000, `u${i}`),
    );
    const results = (await Promise.all(promises)) as [number, string][];
    const successes = results.filter((r) => r[0] === 1);
    // 첫 입찰이 startingPrice(10_000) 보다 크거나 같으면 1명만 성공.
    // highest_bid=0 이므로 required_min=startingPrice=10_000.
    // 모두 11_000 이지만, 첫 성공 후 highest_bid=11_000 → required_min=12_000.
    // 따라서 정확히 1개만 성공.
    expect(successes).toHaveLength(1);
  });
});
