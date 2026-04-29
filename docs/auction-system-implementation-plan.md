# Breedy 경매 시스템 구현 계획서

> 본 문서는 Claude Code가 단독으로 구현 가능하도록 설계된 명세서입니다.
> 핵심 알고리즘과 데이터 흐름까지 명시되어 있으므로, 의문점이 있을 때만 추가 질의하고 그 외에는 본 문서를 진실 공급원(source of truth)으로 사용해 주세요.

---

## 1. 개요

Breedy의 펫(상품)을 경매에 부치는 기능을 추가합니다. 핵심 가치는 **실시간성**과 **공정성**이며, 모든 입찰 검증은 서버 시간 기준으로 원자적(atomic)으로 처리되어야 합니다.

### 1.1 기술 스택

- **Backend**: NestJS, TypeScript, Turborepo monorepo
- **Frontend**: Next.js (Vercel)
- **Mobile**: React Native (webview 기반, Pattern C) — 경매 페이지는 webview로 노출
- **DB**: MySQL (AWS Lightsail)
- **Cache/PubSub/Lock**: Redis (AWS Lightsail)
- **Realtime**: Socket.IO (WebSocket)
- **Job Queue**: BullMQ (Redis 기반)

### 1.2 예상 규모

- 단일 경매 동시 접속: 500–1,000명
- 동시 진행 경매: 초기 1–10건
- 입찰 빈도: 마감 직전 5–10초당 다수 입찰 가능

---

## 2. 요구사항 정리

### 2.1 기능 요구사항

| # | 요구사항 | 비고 |
|---|---|---|
| F1 | 펫 상세 페이지에서 "경매 시작하기" 진입 | 주최자(host) = 펫 소유자 |
| F2 | 시작/종료 시간, 시작가, 최소 입찰 단위(min increment), 연장 분(n) 설정 | 주최자가 입력 |
| F3 | 경매 페이지 공유 링크 자동 생성 | URL: `https://breedy.app/auction/{shareToken}` |
| F4 | 미로그인 시 페이지 열람 가능, 입찰은 로그인 필수 | |
| F5 | 시작시간 도달 시 자동 진행, 종료시간 도달 시 자동 종료 | 스케줄러 |
| F6 | 실시간 입찰가 갱신, 모든 참가자에게 즉시 반영 | WebSocket broadcast |
| F7 | 입찰 검증: `현재 최고가 + 최소 입찰 단위 ≤ 입찰가` | 원자적 처리 필수 |
| F8 | **연장(soft close)**: 종료시간 - n분부터 새 입찰 시 종료시간을 `last_bid_time + n분`으로 갱신 | 핵심 로직 |
| F9 | n분간 새 입찰 없으면 최종 낙찰 확정 | |
| F10 | 낙찰자에게 알림 (DB 기록 + 추후 푸시/이메일) | Discord 운영자 알림 포함 |

### 2.2 비기능 요구사항

- **입찰 응답 지연**: p99 < 200ms
- **시간 정확도**: 모든 입찰의 정렬 기준은 서버 시간(밀리초). 클라이언트 시간 절대 신뢰 금지.
- **무결성**: 동시 다발 입찰에서 "최고가보다 낮은 입찰이 수락되는 일" 절대 금지.
- **가용성**: 단일 Lightsail 노드에서도 동작, 추후 수평 확장 시 코드 변경 최소화.

---

## 3. 시스템 아키텍처

```
┌──────────────┐       WebSocket          ┌─────────────────────────┐
│  Next.js     │ ◄────────────────────►   │   NestJS                │
│  (Web/RN     │                          │   ├─ AuctionGateway     │
│   webview)   │ ◄── HTTP REST ────────►  │   ├─ AuctionService     │
└──────────────┘                          │   ├─ BidService         │
                                          │   └─ AuctionScheduler   │
                                          └────┬───────────────┬────┘
                                               │               │
                                       ┌───────▼─────┐   ┌─────▼──────┐
                                       │   Redis     │   │   MySQL    │
                                       │  - state    │   │  - audit   │
                                       │  - pubsub   │   │  - history │
                                       │  - locks    │   │  - winner  │
                                       │  - bullmq   │   │            │
                                       └─────────────┘   └────────────┘
```

### 3.1 책임 분리 원칙

- **Redis = 진실 공급원 (live state)**
  실시간 경매 상태(현재 최고가, 종료시간, 마지막 입찰자)는 Redis가 단일 소스. 모든 입찰 검증은 Redis Lua 스크립트로 원자적 처리.

- **MySQL = 영속 저장소 (audit log + final result)**
  모든 입찰 시도(성공/실패), 경매 메타데이터, 최종 낙찰자는 MySQL에 기록. 비동기 큐로 적재해 응답 지연을 막는다.

- **WebSocket = 전송 채널**
  Redis Pub/Sub으로 노드 간 broadcast → 게이트웨이가 클라이언트로 fan-out.

### 3.2 데이터 흐름 (입찰 1건의 생애)

1. 클라이언트가 `auction:bid` 이벤트로 입찰 전송
2. AuctionGateway → BidService 호출
3. BidService가 Redis Lua 스크립트 실행 (원자적 검증 + 갱신)
4. 성공 시:
   a. Redis Pub/Sub으로 `auction:{id}:updates` 채널에 broadcast
   b. BullMQ에 `bid-persist` job 추가 (MySQL 비동기 INSERT)
   c. 연장 트리거 시 BullMQ `auction-finalize` job 재스케줄
5. 실패 시: 해당 클라이언트에게만 reject 응답
6. 모든 게이트웨이 인스턴스가 Pub/Sub 메시지 수신 → 자기 룸의 클라이언트들에게 전달

---

## 4. 데이터 모델

### 4.1 MySQL 스키마

```sql
-- 경매 메타 + 최종 결과
CREATE TABLE auctions (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  animal_id       BIGINT UNSIGNED NOT NULL,
  host_user_id    BIGINT UNSIGNED NOT NULL,
  share_token     CHAR(22) NOT NULL UNIQUE,           -- nanoid 22자리
  status          ENUM('PENDING','ACTIVE','ENDED','CANCELED') NOT NULL DEFAULT 'PENDING',
  starting_price  BIGINT NOT NULL,                    -- 원 단위
  min_increment   BIGINT NOT NULL,                    -- 최소 입찰 단위
  extension_minutes INT NOT NULL DEFAULT 5,           -- 연장 분(n)
  start_time      DATETIME(3) NOT NULL,
  original_end_time DATETIME(3) NOT NULL,             -- 최초 설정 종료시간
  current_end_time  DATETIME(3) NOT NULL,             -- 연장 반영 현재 종료시간
  final_price     BIGINT NULL,
  winner_user_id  BIGINT UNSIGNED NULL,
  winner_bid_id   BIGINT UNSIGNED NULL,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_status_end (status, current_end_time),
  INDEX idx_share_token (share_token),
  INDEX idx_animal (animal_id),
  CONSTRAINT fk_auction_animal FOREIGN KEY (animal_id) REFERENCES animals(id),
  CONSTRAINT fk_auction_host  FOREIGN KEY (host_user_id) REFERENCES users(id)
);

-- 모든 입찰 시도 audit log (성공한 것만 저장. 실패는 ops 로그로)
CREATE TABLE auction_bids (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  auction_id      BIGINT UNSIGNED NOT NULL,
  bidder_user_id  BIGINT UNSIGNED NOT NULL,
  amount          BIGINT NOT NULL,
  server_ts_ms    BIGINT NOT NULL,                    -- 서버 수신 epoch ms (정렬 기준)
  triggered_extension TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_auction_ts (auction_id, server_ts_ms),
  INDEX idx_bidder (bidder_user_id),
  CONSTRAINT fk_bid_auction FOREIGN KEY (auction_id) REFERENCES auctions(id),
  CONSTRAINT fk_bid_user    FOREIGN KEY (bidder_user_id) REFERENCES users(id)
);

-- (선택) 단순 동시 접속 통계용
CREATE TABLE auction_participants (
  auction_id      BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  first_joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (auction_id, user_id)
);
```

> **shareToken**은 `nanoid(22)`로 생성 (충돌 확률 무시 가능, URL-safe).

### 4.2 Redis 키 설계

```
auction:{id}:state         # HASH - 라이브 상태 (가장 중요)
   status                  # 'ACTIVE' | 'ENDED'
   highest_bid             # 현재 최고가 (없으면 0)
   highest_bidder_id       # 0 if none
   starting_price
   min_increment
   start_time_ms
   original_end_time_ms
   current_end_time_ms     # 연장 시 갱신
   extension_window_ms     # n * 60_000
   last_bid_ts_ms

auction:{id}:bids          # LIST - 최근 N건 캐시 (LPUSH, LTRIM 50)
                           # JSON: {bidderId, amount, ts, nickname}

auction:{id}:participants  # SET - 현재 룸에 들어와있는 user id (선택)

auction:active             # SET - 현재 ACTIVE 상태인 auction id 목록 (스케줄러용)

bullmq:*                   # BullMQ 내부 (auction-finalize, bid-persist 큐)
```

**TTL 정책**: `auction:{id}:state`는 종료 후 24시간 TTL 부여. `bids` 캐시도 동일.

---

## 5. 핵심 알고리즘 — 원자적 입찰 (Lua 스크립트)

> 이 스크립트가 본 시스템의 심장입니다. **모든 입찰 검증과 상태 갱신은 단일 Lua 호출 안에서 끝나야 합니다.**

### 5.1 검증 규칙 (한 번의 Lua 호출 내에서 모두 수행)

1. `state.status == 'ACTIVE'` 인가?
2. `now_ms >= state.start_time_ms` 인가?
3. `now_ms < state.current_end_time_ms` 인가? (이미 종료된 경매 거부)
4. `bid_amount >= max(state.highest_bid + state.min_increment, state.starting_price)` 인가?
   - 단, `highest_bid == 0`이면 `bid_amount >= state.starting_price`
5. 위 모두 통과 시:
   - `highest_bid := bid_amount`
   - `highest_bidder_id := user_id`
   - `last_bid_ts_ms := now_ms`
   - 연장 조건 체크: `now_ms >= current_end_time_ms - extension_window_ms` 이면
     - `current_end_time_ms := now_ms + extension_window_ms`
     - `triggered_extension := 1`
   - `auction:{id}:bids` LIST에 LPUSH + LTRIM
   - 새 상태 반환

### 5.2 Lua 스크립트 전문

```lua
-- KEYS[1] = auction:{id}:state
-- KEYS[2] = auction:{id}:bids
-- ARGV[1] = bid_amount (number)
-- ARGV[2] = bidder_user_id (number)
-- ARGV[3] = bidder_nickname (string)
-- ARGV[4] = now_ms (number)
-- ARGV[5] = max_bids_to_keep (number, e.g. 50)

local state = redis.call('HMGET', KEYS[1],
  'status','highest_bid','highest_bidder_id',
  'starting_price','min_increment',
  'start_time_ms','current_end_time_ms','extension_window_ms')

if state[1] == false then
  return {0, 'NOT_FOUND'}
end

local status               = state[1]
local highest_bid          = tonumber(state[2]) or 0
local starting_price       = tonumber(state[4]) or 0
local min_increment        = tonumber(state[5]) or 0
local start_time_ms        = tonumber(state[6]) or 0
local current_end_time_ms  = tonumber(state[7]) or 0
local extension_window_ms  = tonumber(state[8]) or 0

local bid_amount = tonumber(ARGV[1])
local bidder_id  = tonumber(ARGV[2])
local now_ms     = tonumber(ARGV[4])

if status ~= 'ACTIVE' then return {0, 'NOT_ACTIVE'} end
if now_ms < start_time_ms then return {0, 'NOT_STARTED'} end
if now_ms >= current_end_time_ms then return {0, 'ALREADY_ENDED'} end

local required_min
if highest_bid == 0 then
  required_min = starting_price
else
  required_min = highest_bid + min_increment
end

if bid_amount < required_min then
  return {0, 'BID_TOO_LOW', tostring(required_min)}
end

-- 연장 조건
local triggered_extension = 0
local new_end_time_ms = current_end_time_ms
if now_ms >= (current_end_time_ms - extension_window_ms) then
  new_end_time_ms = now_ms + extension_window_ms
  triggered_extension = 1
end

-- 상태 갱신
redis.call('HMSET', KEYS[1],
  'highest_bid', tostring(bid_amount),
  'highest_bidder_id', tostring(bidder_id),
  'last_bid_ts_ms', tostring(now_ms),
  'current_end_time_ms', tostring(new_end_time_ms))

-- 최근 입찰 캐시
local bid_json = string.format(
  '{"bidderId":%d,"nickname":"%s","amount":%d,"ts":%d}',
  bidder_id, ARGV[3], bid_amount, now_ms)
redis.call('LPUSH', KEYS[2], bid_json)
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[5]) - 1)

return {1, 'OK',
  tostring(bid_amount),
  tostring(bidder_id),
  tostring(new_end_time_ms),
  tostring(triggered_extension),
  tostring(now_ms)}
```

### 5.3 NestJS 호출 예시

```typescript
// libs/auction/src/bid.service.ts
@Injectable()
export class BidService {
  private placeBidScript: string;

  constructor(@InjectRedis() private readonly redis: Redis) {
    this.placeBidScript = fs.readFileSync(
      path.join(__dirname, 'lua/place-bid.lua'), 'utf8');
  }

  async placeBid(input: {
    auctionId: number;
    userId: number;
    nickname: string;
    amount: number;
  }): Promise<BidResult> {
    const nowMs = Date.now();
    const result = await this.redis.eval(
      this.placeBidScript,
      2,
      `auction:${input.auctionId}:state`,
      `auction:${input.auctionId}:bids`,
      String(input.amount),
      String(input.userId),
      input.nickname,
      String(nowMs),
      '50',
    ) as [number, string, ...string[]];

    const [ok, code, ...rest] = result;
    if (ok === 0) {
      return { success: false, code, requiredMin: rest[0] && Number(rest[0]) };
    }

    const [amountStr, bidderIdStr, newEndMsStr, extendedStr, tsMsStr] = rest;
    const payload = {
      success: true as const,
      auctionId: input.auctionId,
      amount: Number(amountStr),
      bidderId: Number(bidderIdStr),
      newEndTimeMs: Number(newEndMsStr),
      extended: extendedStr === '1',
      tsMs: Number(tsMsStr),
    };

    // 1) 모든 노드에 broadcast
    await this.redis.publish(
      `auction:${input.auctionId}:updates`,
      JSON.stringify({ type: 'BID_ACCEPTED', payload }),
    );

    // 2) MySQL 영속화는 비동기
    await this.bidQueue.add('persist', {
      auctionId: input.auctionId,
      bidderUserId: input.userId,
      amount: payload.amount,
      serverTsMs: payload.tsMs,
      triggeredExtension: payload.extended,
    }, { removeOnComplete: true, attempts: 5, backoff: { type: 'exponential', delay: 500 } });

    // 3) 연장됐다면 종료 잡 재스케줄
    if (payload.extended) {
      await this.scheduleFinalize(input.auctionId, payload.newEndTimeMs);
    }

    return payload;
  }
}
```

---

## 6. 종료(낙찰 확정) 알고리즘

### 6.1 BullMQ 지연 잡 + 재검증 패턴

연장이 일어날 때마다 종료 시각이 바뀌므로, "타이머를 다시 맞춘다"는 단순 발상은 race condition에 취약합니다. 다음 패턴을 사용합니다:

1. 경매 생성 시: `auction-finalize` 잡을 `original_end_time_ms` 시각에 지연 등록 (`jobId = auction:{id}:finalize`).
2. 입찰로 연장이 트리거되면:
   - 동일 `jobId`로 잡을 다시 추가하면 BullMQ가 기존 잡을 대체. (또는 `removeJob → add`)
   - 새 실행 시각 = `new_end_time_ms`.
3. 잡이 실제로 실행될 때 다시 한 번 Redis 상태를 읽어 **재검증**:

```typescript
async finalizeAuction(auctionId: number) {
  const state = await this.redis.hgetall(`auction:${auctionId}:state`);
  const nowMs = Date.now();
  const endMs = Number(state.current_end_time_ms);

  // 재검증: 잡 실행 시점에 종료시각이 또 미래로 밀려 있다면 무시
  if (nowMs < endMs) {
    // 누군가 직전에 입찰해서 또 연장된 경우 → 무시. 새 잡이 이미 등록되어 있음.
    return { skipped: true, reason: 'NOT_YET' };
  }

  // 원자적으로 status 전환 (중복 종료 방지)
  const closed = await this.redis.hsetnx(
    `auction:${auctionId}:state:closing`, 'lock', '1');
  if (!closed) return { skipped: true, reason: 'ALREADY_CLOSING' };

  await this.redis.hset(`auction:${auctionId}:state`, 'status', 'ENDED');

  // MySQL 최종 기록
  const winner = state.highest_bidder_id && Number(state.highest_bidder_id) > 0
    ? { userId: Number(state.highest_bidder_id), price: Number(state.highest_bid) }
    : null;

  await this.auctionsRepo.markEnded(auctionId, winner);

  // 알림
  await this.redis.publish(`auction:${auctionId}:updates`,
    JSON.stringify({ type: 'AUCTION_ENDED', payload: { winner } }));
  await this.notificationService.sendAuctionEndedDiscord(auctionId, winner);

  return { skipped: false };
}
```

### 6.2 시작 잡

`auction-start` 잡도 동일하게 `start_time_ms`에 지연 등록. 실행 시 status를 `PENDING → ACTIVE`로 전환하고 broadcast.

### 6.3 안전망 (Watchdog)

스케줄러를 30초마다 돌려, status=`ACTIVE`이면서 `current_end_time_ms < now()`인 경매를 찾아 강제 종료. (BullMQ 잡 누락 대비)

```typescript
@Cron(CronExpression.EVERY_30_SECONDS)
async watchdog() {
  const ids = await this.redis.smembers('auction:active');
  const nowMs = Date.now();
  for (const id of ids) {
    const endMs = Number(await this.redis.hget(`auction:${id}:state`, 'current_end_time_ms'));
    if (endMs && nowMs >= endMs) {
      await this.finalizeAuction(Number(id));
    }
  }
}
```

---

## 7. WebSocket 프로토콜

### 7.1 연결

- Endpoint: `wss://api.breedy.app/ws/auction`
- 핸드셰이크 시 JWT를 query 또는 `auth` 페이로드로 전달 (선택. 미인증도 read-only 접속 허용)

### 7.2 클라이언트 → 서버

| 이벤트 | 페이로드 | 설명 |
|---|---|---|
| `auction:join` | `{ shareToken: string }` | 룸 입장. 응답으로 현재 상태 송신 |
| `auction:leave` | `{ shareToken: string }` | 룸 퇴장 |
| `auction:bid` | `{ shareToken, amount }` | 입찰. 인증 필수 |

### 7.3 서버 → 클라이언트

| 이벤트 | 페이로드 | 설명 |
|---|---|---|
| `auction:state` | `AuctionStateDto` | join 직후 1회 송신. 시간 동기화 정보 포함 |
| `auction:bid_accepted` | `{ bidderId, nickname, amount, newEndTimeMs, extended, tsMs }` | 입찰 수락 broadcast |
| `auction:bid_rejected` | `{ code, requiredMin? }` | 입찰자에게만 송신 |
| `auction:extended` | `{ newEndTimeMs }` | (옵션) `bid_accepted`에서 추출 가능하므로 생략 가능 |
| `auction:ended` | `{ winner: { userId, nickname, price } \| null }` | 종료 broadcast |
| `auction:server_time` | `{ serverNowMs }` | 30초마다 송신, 클라 시계 보정용 |

### 7.4 AuctionStateDto

```typescript
export interface AuctionStateDto {
  auctionId: number;
  shareToken: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
  startingPrice: number;
  minIncrement: number;
  extensionMinutes: number;
  startTimeMs: number;
  originalEndTimeMs: number;
  currentEndTimeMs: number;
  highestBid: number;
  highestBidder: { userId: number; nickname: string } | null;
  recentBids: Array<{ bidderId: number; nickname: string; amount: number; tsMs: number }>;
  serverNowMs: number;          // 클라이언트 시계 보정용
}
```

### 7.5 NestJS Gateway 골격

```typescript
@WebSocketGateway({ namespace: '/auction', cors: { origin: '*' } })
export class AuctionGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly auctionService: AuctionService,
    private readonly bidService: BidService,
    @InjectRedis() private readonly redisSub: Redis,
  ) {}

  async afterInit() {
    // Redis Pub/Sub 구독
    await this.redisSub.psubscribe('auction:*:updates');
    this.redisSub.on('pmessage', (_pattern, channel, message) => {
      const auctionId = Number(channel.split(':')[1]);
      const event = JSON.parse(message);
      this.server.to(`auction:${auctionId}`).emit(
        this.mapEventName(event.type), event.payload);
    });
  }

  @SubscribeMessage('auction:join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { shareToken: string }) {
    const auction = await this.auctionService.findByToken(body.shareToken);
    if (!auction) throw new WsException('NOT_FOUND');
    await client.join(`auction:${auction.id}`);
    const state = await this.auctionService.getLiveState(auction.id);
    client.emit('auction:state', state);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('auction:bid')
  async onBid(@ConnectedSocket() client: AuthSocket, @MessageBody() body: { shareToken: string; amount: number }) {
    const auction = await this.auctionService.findByToken(body.shareToken);
    if (!auction) throw new WsException('NOT_FOUND');
    const result = await this.bidService.placeBid({
      auctionId: auction.id,
      userId: client.user.id,
      nickname: client.user.nickname,
      amount: body.amount,
    });
    if (!result.success) {
      client.emit('auction:bid_rejected', { code: result.code, requiredMin: result.requiredMin });
    }
    // 성공 시 broadcast는 Pub/Sub에서 처리됨
  }
}
```

---

## 8. REST API

### 8.1 엔드포인트

| Method | Path | 설명 | Auth |
|---|---|---|---|
| POST | `/api/auctions` | 경매 생성 (host) | Required |
| GET | `/api/auctions/:shareToken` | 경매 상세 (SSR/SSG용) | Optional |
| GET | `/api/auctions/:id/bids?cursor=` | 입찰 히스토리 페이지네이션 | Optional |
| POST | `/api/auctions/:id/cancel` | 시작 전 취소 | Host only |
| GET | `/api/me/auctions` | 내 호스트/참여 경매 목록 | Required |

### 8.2 경매 생성 DTO

```typescript
class CreateAuctionDto {
  @IsInt() animalId: number;
  @IsInt() @Min(0) startingPrice: number;
  @IsInt() @Min(100) minIncrement: number;     // 최소 100원
  @IsInt() @Min(1) @Max(60) extensionMinutes: number;
  @IsISO8601() startTime: string;
  @IsISO8601() endTime: string;
}
```

검증:
- `endTime > startTime`
- `endTime - startTime >= 5분`
- `extensionMinutes < (endTime - startTime) / 2` (연장창이 경매 길이의 절반 넘지 않도록)
- `animalId`의 소유자 = 현재 사용자
- 해당 동물에 대해 ACTIVE/PENDING 경매가 이미 있는지 체크

생성 후 응답에 `shareToken`과 `shareUrl` 포함.

---

## 9. 프론트엔드 (Next.js)

### 9.1 페이지 구성

```
/app/auction/[shareToken]/page.tsx                    # 경매 페이지 (SSR)
/app/auction/components/CreateAuctionForm.tsx         # 경매 생성 폼 (재사용)
/app/auction/components/CreateAuctionDialog.tsx       # 경매 생성 모달 wrapper
```

경매 생성 진입점: 펫 상세 페이지의 "개체 경매" 버튼 → `overlay.open(<CreateAuctionDialog>)` 로 모달 표시.
딥링크 페이지(`/auction/create`)는 추후 외부 진입이 필요할 때 같은 `CreateAuctionForm` 으로 다시 만들 수 있음.

### 9.2 시계 동기화

서버가 `auction:state`와 함께 `serverNowMs`를 보내고, 30초마다 `auction:server_time`을 broadcast. 클라이언트는 오프셋을 유지:

```typescript
let serverOffsetMs = 0; // serverNow - clientNow
const getServerTimeMs = () => Date.now() + serverOffsetMs;

socket.on('auction:state', (state) => {
  serverOffsetMs = state.serverNowMs - Date.now();
});
socket.on('auction:server_time', ({ serverNowMs }) => {
  serverOffsetMs = serverNowMs - Date.now();
});
```

카운트다운은 `currentEndTimeMs - getServerTimeMs()`로 계산. requestAnimationFrame 또는 100ms setInterval로 업데이트.

### 9.3 입찰 UX

- "현재 최고가 + 최소 입찰 단위" 자동 계산해 디폴트 입력값 채우기
- `+1단위`, `+5단위`, `+10단위` 빠른 버튼
- 입찰 클릭 시 낙관적 UI 적용하지 말 것 (서버 응답 후 갱신). 잘못된 우선권 표시 방지.
- `bid_rejected` 시 즉시 피드백 (특히 `BID_TOO_LOW`는 갱신된 최소가 표시)
- 마감 60초 전부터는 카운트다운 강조 + 진동/사운드 (모바일 webview)

### 9.4 연장 시 시각 피드백

`bid_accepted` 페이로드에 `extended === true`일 때:
- 카운트다운 옆에 "⏱ 연장됨!" 토스트 (2초)
- 종료시각 텍스트가 부드럽게 갱신되도록 transition

---

## 10. 보안 / 어뷰징 방지

| 항목 | 대응 |
|---|---|
| 비로그인 입찰 | WsJwtGuard로 차단. 페이지 열람은 허용. |
| 본인 펫 입찰 | `host_user_id !== bidder_user_id` 검증 (서비스 레이어) |
| 동일 사용자 폭주 | Redis로 사용자별 rate limit: `bid:rl:{auctionId}:{userId}` (예: 1초 5회) |
| 입찰가 검증 우회 | 모든 검증은 Lua 스크립트 안. 클라 검증은 UX용일 뿐. |
| shareToken 추측 | nanoid 22자리 (≈ 132bit entropy) |
| WebSocket 인증 토큰 만료 | 핸드셰이크 시 검증 + 입찰 시 재검증 |
| 경매 정보 변조 | 시작 후에는 경매 메타 변경 불가 (PUT 차단) |

---

## 11. 인프라 / 배포

### 11.1 Lightsail 구성 (초기)

- 단일 Node 인스턴스 (NestJS): 4GB RAM 이상 권장. 1k 동시 WS 연결은 Node 단일 프로세스로 충분.
- Redis: 별도 1GB 인스턴스 또는 동일 노드에 컨테이너로. 데이터는 in-memory + AOF 켜기.
- MySQL: 기존 인스턴스 재사용.

### 11.2 환경 변수

```
REDIS_URL=redis://...
DATABASE_URL=mysql://...
WS_PUBLIC_URL=wss://api.breedy.app/auction
JWT_SECRET=...
DISCORD_AUCTION_WEBHOOK_URL=...
```

### 11.3 모니터링 (최소)

- Discord 웹훅: 경매 시작/종료/오류 알림
- 로그: 입찰 실패 코드별 카운트 (분 단위 집계)
- Health check: `/health` 에서 Redis ping + MySQL ping

---

## 12. 테스트 전략

### 12.1 단위 테스트

- BidService.placeBid: 모든 reject 코드 (`NOT_ACTIVE`, `NOT_STARTED`, `ALREADY_ENDED`, `BID_TOO_LOW`)
- 연장 트리거 경계값: `now == end - window` 정확히 한 단위
- 시작가 첫 입찰 vs 이후 입찰의 최소가 계산

### 12.2 통합 테스트 (Lua 검증)

ioredis-mock이 아닌 **실제 Redis** + testcontainers 사용. Lua 스크립트의 동작 보증이 핵심.

### 12.3 동시성 테스트 (필수)

```typescript
// 100명이 동시에 같은 금액 입찰 시도 → 정확히 1명만 성공
test('concurrent bids: only one wins', async () => {
  await setupAuction({ highestBid: 10000, minIncrement: 1000 });
  const results = await Promise.all(
    Array.from({ length: 100 }).map((_, i) =>
      bidService.placeBid({ auctionId: 1, userId: i + 1, nickname: `u${i}`, amount: 11000 }),
    ),
  );
  const successes = results.filter(r => r.success);
  expect(successes).toHaveLength(1);
});
```

### 12.4 부하 테스트

`artillery` 또는 `k6`로 1,000 동시 연결 + 초당 50 입찰 시뮬레이션. p99 < 200ms 확인.

---

## 13. 구현 순서 (체크리스트)

Claude Code는 다음 순서로 진행해 주세요. 각 단계는 독립적으로 PR 단위가 될 수 있도록 끊어주세요.

- [ ] **1단계: DB 마이그레이션**
  - `auctions`, `auction_bids`, `auction_participants` 테이블 생성
  - TypeORM/Prisma 엔티티 작성

- [ ] **2단계: 경매 도메인 모듈 골격**
  - `AuctionModule`, `AuctionService`, `AuctionsRepository`
  - REST: 생성/조회/취소 엔드포인트
  - shareToken 생성 (nanoid)

- [ ] **3단계: Redis 상태 동기화**
  - 경매 생성 시 Redis에 state 적재
  - `getLiveState()` (Redis → DTO 변환)
  - `auction:active` SET 관리

- [ ] **4단계: 입찰 코어 (Lua + BidService)**
  - Lua 스크립트 작성 및 단위 테스트
  - BidService.placeBid 구현
  - 동시성 테스트 통과 확인

- [ ] **5단계: WebSocket Gateway**
  - 연결/룸/JWT 가드
  - join/bid 핸들러
  - Pub/Sub 구독 → broadcast fan-out

- [ ] **6단계: BullMQ 잡 (시작/종료/연장)**
  - `auction-start`, `auction-finalize` 큐
  - 연장 시 jobId 재사용 패턴
  - Watchdog cron

- [ ] **7단계: MySQL 영속화 큐**
  - `bid-persist` 큐 (재시도 정책 포함)
  - 종료 시 winner 기록

- [ ] **8단계: Next.js 페이지**
  - 경매 페이지 (`/auction/[shareToken]`)
  - 시계 동기화 훅 (`useServerTime`)
  - 입찰 UI + 카운트다운

- [ ] **9단계: 경매 생성 페이지**
  - 펫 상세에서 진입
  - 폼 검증
  - 공유 링크 표시 (복사 버튼)

- [ ] **10단계: 알림**
  - Discord 웹훅 (시작/종료/오류)
  - 종료 후 호스트와 낙찰자에게 인앱 알림 레코드 적재

- [ ] **11단계: 테스트 / 부하 검증**
  - 동시성 테스트 100명 → 1명 통과
  - k6 1,000 connection 시뮬레이션
  - p99 < 200ms 확인

- [ ] **12단계: 모니터링 / 문서화**
  - `/health` 엔드포인트
  - README에 운영 가이드

---

## 14. 향후 확장 고려 (지금은 구현 X, 설계만 양보)

- **수평 확장**: NestJS 인스턴스를 여러 개로 늘릴 때, Socket.IO Redis adapter (`@socket.io/redis-adapter`) 추가만으로 동작하도록 구조 유지.
- **결제 연동**: 낙찰 후 에스크로 결제 흐름. `auctions.status`에 `PAYMENT_PENDING` 추가 여지.
- **자동 입찰 (proxy bid)**: 사용자가 최대 금액을 정해두면 시스템이 최소 단위만큼 자동 입찰. Lua 스크립트에 한 단계 추가.
- **금칙어/신고/블랙리스트**: 호스트가 특정 사용자 차단.

---

## 15. 의사 결정이 필요한 항목 (Claude Code → sh.k 확인)

다음 항목은 코드 진행 전에 sh.k에게 짧게 확인해 주세요. 답이 없으면 괄호 안 기본값으로 진행.

1. 경매 최대 길이 제한 (기본: 7일)
2. `extension_minutes` 허용 범위 (기본: 1–10분)
3. 경매 취소 가능 시점 (기본: PENDING 상태에서만)
4. 본인 펫 입찰 차단 여부 (기본: 차단)
5. 미로그인 사용자에게 입찰가 마스킹 여부 (기본: 노출)
6. 동일 사용자 rate limit 정책 (기본: 1초당 5회)

---

**이상.** 본 문서를 진실 공급원으로 삼아 구현해 주세요. 모호한 부분이 있으면 위 15번 섹션에 추가하고 진행하세요.
