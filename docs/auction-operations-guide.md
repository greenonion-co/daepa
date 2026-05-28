# 펫 경매 시스템 — 운영 가이드

> 기준: `feat/auction` 브랜치 (2026-05-25). 코드 변경 시 함께 갱신할 것.

이 문서는 경매 기능을 처음 보는 개발자가 **인프라 동작 / 데이터 흐름 / 알림 / 장애 복구**를 한 번에 이해할 수 있도록 정리한 운영 레퍼런스다. 구현 의도(왜 그렇게 설계했는가)는 `docs/auction-system-implementation-plan.md` 참조.

---

## 1. 한눈에 보는 시스템

```
┌──────────────┐  WS/REST  ┌─────────────────┐                ┌────────────┐
│  Client/SDK  │ ────────▶ │  Nest Server    │  ┌──────────▶  │  MySQL     │
│  (Next.js)   │ ◀──────── │  (N instances)  │  │             │  - auctions
└──────────────┘  Socket   └─────────────────┘  │             │  - bids
                              │      │           │             └────────────┘
                              │      │           │
                              │      ▼           │             ┌────────────┐
                              │  ┌────────────┐  │             │  Redis     │
                              │  │ BullMQ     │ ─┘             │  - state   │
                              │  │ Workers    │                │  - bids    │
                              │  │ Schedulers │ ◀────────────  │  - pubsub  │
                              │  └────────────┘                │  - queues  │
                              │                                └────────────┘
                              ▼
                       ┌───────────────┐
                       │  FCM Push     │
                       │  Discord Hook │
                       └───────────────┘
```

- 입찰의 정합성은 **Redis Lua 스크립트의 atomicity** 로 보장
- 입찰의 영속성은 **BullMQ → MySQL** 비동기 워커가 처리
- 시간 트리거(시작/종료)는 **BullMQ delayed job** + **Cron watchdog** 이중화
- 상태 broadcast 는 **Redis pub/sub** → **Socket.IO room**

---

## 2. 도메인 상태 머신

```
        ┌───────┐  start 잡 실행  ┌─────────┐  finalize 잡 실행  ┌────────┐
 create ▶ PENDING ──────────────▶ ACTIVE   ────────────────────▶ ENDED  │
        └───┬───┘                 └───┬────┘                    └────────┘
            │                         │
            │  호스트 취소           │  호스트 취소
            ▼                         ▼
        ┌─────────────────────────────────┐
        │            CANCELED              │
        └─────────────────────────────────┘
```

| 상태 | 의미 | 입찰 가능 | 종료 가능 |
|---|---|:-:|:-:|
| PENDING | 생성됐으나 시작 시각 미도달 | ❌ | ✅ (취소만) |
| ACTIVE | 입찰 진행 중 | ✅ | ✅ |
| ENDED | 정상 종료 (낙찰자 있을 수도, 유찰일 수도) | ❌ | ❌ |
| CANCELED | 호스트가 취소 | ❌ | ❌ |

정의: [`apps/server/src/auction/auction.constants.ts:1-6`](../apps/server/src/auction/auction.constants.ts#L1)

---

## 3. 인프라 구성요소

| 구성요소 | 역할 | 주요 키/네임스페이스 |
|---|---|---|
| **MySQL** | 영속 저장 (auction / bid / participant) | `auctions`, `auction_bids`, `auction_participants` |
| **Redis** (3개 클라이언트) | 라이브 상태 / pub-sub / BullMQ broker | `auction:{id}:*` |
| **BullMQ** | 시작/종료 잡 (delayed) + 입찰 영속화 | `auction-jobs`, `auction-bid-persist` |
| **NestJS Scheduler** | 30s / 5m watchdog | `@Cron` |
| **Socket.IO** | 실시간 push → 브라우저/모바일 | namespace `/auction`, room `auction:{id}` |
| **FCM** | 푸시 알림 | 사용자 토큰 기반 |
| **Discord Webhook** | 운영자 알림 | env `DISCORD_AUCTION_WEBHOOK_URL` |

### 3-1. Redis 클라이언트 3개 분리 이유

[`apps/server/src/auction/redis/redis.module.ts`](../apps/server/src/auction/redis/redis.module.ts)

| Provider | 용도 | 분리 이유 |
|---|---|---|
| `AUCTION_REDIS` | 일반 명령 (HSET, EVAL 등) | pub/sub 연결은 명령 전용 연결과 분리 필요 (ioredis 권장) |
| `AUCTION_REDIS_SUB` | `PSUBSCRIBE auction:*:updates` | subscribe 모드 진입한 connection 은 다른 명령 발행 불가 |
| `AUCTION_REDIS_BULL` | BullMQ 전용 | 큐 워커가 blocking 명령(BRPOPLPUSH 등)을 점유 |

---

## 4. 데이터 모델 (MySQL)

### 4-1. `auctions` ([entity](../apps/server/src/auction/auction.entity.ts))

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `id` | BIGINT PK | 내부 식별자 (Redis key, BullMQ jobId, FK 용) |
| `auctionId` | VARCHAR(22) UNIQUE | 외부 식별자 (nanoid). API/알림 페이로드에 노출 |
| `petId` | VARCHAR | FK → `pets.pet_id` |
| `hostUserId` | VARCHAR | FK → `users.user_id` |
| `shareToken` | VARCHAR(22) UNIQUE | 공유 URL 토큰 (nanoid) |
| `status` | ENUM | `PENDING/ACTIVE/ENDED/CANCELED` |
| `startingPrice`, `minIncrement` | BIGINT | 시작가, 최소 증가폭 (원 단위) |
| `extensionMinutes` | INT (default 5) | 막판 입찰 시 자동 연장 분 |
| `startTime`, `originalEndTime`, `currentEndTime` | DATETIME(3) | 분 정시 정렬됨 |
| `finalPrice`, `winnerUserId`, `winnerBidId` | nullable | 종료 시 확정 |

**인덱스**: `UNIQUE(auctionId)`, `UNIQUE(shareToken)`, `(status, currentEndTime)`, `(petId)`, `(hostUserId)`

### 4-2. `auction_bids` ([entity](../apps/server/src/auction/auction_bid.entity.ts))

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `id` | BIGINT PK | 입찰 row id |
| `auctionId` | BIGINT | `auctions.id` (논리 FK, 제약 없음) |
| `bidderUserId` | VARCHAR | 입찰자 |
| `amount` | BIGINT | 입찰가 |
| `serverTsMs` | BIGINT | 서버 수신 시각 (정렬 기준) |
| `triggeredExtension` | TINYINT (0/1) | 이 입찰이 연장을 유발했는가 |

**인덱스**: `(auctionId, serverTsMs)`, `(bidderUserId)`

> 이 테이블은 **bid-persist 워커**가 비동기로 INSERT. 입찰 응답이 200 OK 였더라도 짧은 지연이 있다.

### 4-3. `auction_participants` ([entity](../apps/server/src/auction/auction_participant.entity.ts))

`(auctionId, userId)` 복합 PK. 같은 사용자가 한 경매에 처음 입찰하면 row 생성, 이후 입찰마다 `bidCount + 1`.

---

## 5. Redis 키 구조

키 생성 함수: [`auction-state.service.ts:11-14`](../apps/server/src/auction/auction-state.service.ts#L11)

| 키 | 타입 | 내용 | TTL |
|---|---|---|---|
| `auction:{id}:state` | Hash | 라이브 상태 (status, highest_bid, ...) | ENDED/CANCELED 시 24h |
| `auction:{id}:bids` | List | 최근 입찰 JSON (최대 50, LPUSH/LTRIM) | 동일 |
| `auction:{id}:updates` | Pub/Sub | broadcast 채널 | — |
| `auction:{id}:closing` | String | finalize 중복 실행 방지 lock | 60s |
| `auction:active` | Set | 현재 PENDING/ACTIVE 인 auctionId 모음 (watchdog 입력) | — |
| `bid:rl:{auctionId}:{userId}` | String | 입찰 rate limit 카운터 | 1s (PEXPIRE) |
| `bull:auction-jobs:*` | (BullMQ 내부) | delayed/active job | — |
| `bull:auction-bid-persist:*` | (BullMQ 내부) | bid 영속화 job | — |

### 5-1. `auction:{id}:state` Hash 필드

| 필드 | 의미 |
|---|---|
| `auction_id`, `pet_id`, `host_user_id`, `share_token` | 외부 식별자 |
| `status` | `PENDING/ACTIVE/ENDED/CANCELED` |
| `highest_bid`, `highest_bidder_id`, `highest_bidder_nickname` | 최고가 정보 |
| `starting_price`, `min_increment`, `extension_minutes`, `extension_window_ms` | 경매 파라미터 |
| `start_time_ms`, `original_end_time_ms`, `current_end_time_ms` | 시각 (epoch ms) |
| `last_bid_ts_ms` | 마지막 입찰 시각 |
| `final_price`, `winner_user_id` | 종료 후 확정값 |

상태 hydrate 는 경매 **생성 시** [`auction.service.ts:154`](../apps/server/src/auction/auction.service.ts#L154) 1회만 일어남. 이후 변경은 Lua 또는 service 메서드가 부분 업데이트.

---

## 6. BullMQ 큐와 잡

### 6-1. `auction-jobs` 큐 ([auction-jobs.processor.ts](../apps/server/src/auction/auction-jobs.processor.ts))

| Job name | jobId 패턴 | 트리거 | 동작 |
|---|---|---|---|
| `start` | `auction:{id}:start` | 경매 생성 시 delay = (startTime - now) | `markActive` + state status='ACTIVE' + publish `AUCTION_STARTED` + 호스트 푸시 + Discord |
| `start` (watchdog) | `auction:{id}:start:wd:{ts}` | 30s cron, status=PENDING이고 시작 시각 지남 | 동일 |
| `start` (DB fallback) | `auction:{id}:start:dbwd:{ts}` | 5m cron, DB 기준 누락 검출 | 동일 |
| `finalize` | `auction:{id}:finalize` | 경매 생성 시 delay = (endTime - now) | closing lock → winner 결정 → `markEnded` (트랜잭션) → Redis state ENDED + finalResult → publish `AUCTION_ENDED` + 호스트/낙찰자 알림 + Discord |
| `finalize` (입찰 연장) | `auction:{id}:finalize` | 자동 연장 시 `bid.service` 가 동일 jobId 로 add → 기존 잡 replace | 동일 |
| `finalize` (watchdog) | `auction:{id}:finalize:wd:{ts}` | 30s cron, endTime 지남 | 동일 |
| `finalize` (DB fallback) | `auction:{id}:finalize:dbwd:{ts}` | 5m cron, DB 기준 누락 검출 | 동일 |

**handleFinalize 자기방어**:
- 종료 시각 미도달 → `NOT_YET` skip (연장 잡 vs watchdog 중복 시 무해)
- 이미 ENDED/CANCELED → `ALREADY_TERMINAL` skip
- closing lock 획득 실패 → `ALREADY_CLOSING` skip (멀티 노드 race 방지)

### 6-2. `auction-bid-persist` 큐 ([bid-persist.processor.ts](../apps/server/src/auction/bid-persist.processor.ts))

| Job name | 트리거 | 동작 |
|---|---|---|
| `persist` | 입찰 성공 시 `bid.service` 가 add | 트랜잭션 안에서 `auction_bids` INSERT + `auction_participants` upsert |

**재시도 정책**: `attempts: 5`, `backoff: exponential, delay: 500ms` ([bid.service.ts:175-176](../apps/server/src/auction/bid.service.ts#L175))

---

## 7. WebSocket 프로토콜

### 7-1. 연결 / 인증

[`auction.gateway.ts:117-141`](../apps/server/src/auction/auction.gateway.ts#L117)

- namespace: `/auction`
- transports: `['websocket', 'polling']`
- 인증 방법 (모두 옵셔널, 토큰 없어도 read-only 접근 가능):
  1. `io({ auth: { token: '<jwt>' } })`
  2. `?token=<jwt>` 쿼리스트링
  3. `socket.emit('auction:join', { shareToken, token })` body 안에 명시
- 토큰 invalid 시 silent skip → 무인증 read-only 진행 (입찰만 거부됨)

### 7-2. Client → Server 이벤트

| 이벤트 | body | 응답 |
|---|---|---|
| `auction:join` | `{ shareToken, token? }` | `auction:state` 전체 스냅샷 emit |
| `auction:leave` | `{ shareToken }` | room leave |
| `auction:bid` | `{ shareToken, amount, token? }` | 성공: 본인에게 emit 없음 (broadcast 로 받음). 실패: `auction:bid_rejected` |

### 7-3. Server → Client 이벤트

| 이벤트 | 발신 경로 | payload |
|---|---|---|
| `auction:state` | join 직후 1회 | `AuctionStateDto` 전체 |
| `auction:bid_accepted` | Lua 성공 → publish → pub/sub | `{ auctionId, shareToken, bidderId, nickname, amount, newEndTimeMs, extended, tsMs }` |
| `auction:bid_rejected` | 본인에게만 | `{ code, requiredMin? }` |
| `auction:started` | `handleStart` 직후 | `{ auctionId, shareToken }` |
| `auction:ended` | `handleFinalize` 직후 | `{ auctionId, shareToken, winner }` |
| `auction:cancelled` | `cancelByHost` 직후 | `{ auctionId, shareToken }` |
| `auction:server_time` | 30s interval | `{ serverNowMs }` (클라이언트 시계 보정용) |

### 7-4. bid_rejected 코드 사전

| 코드 | 의미 |
|---|---|
| `UNAUTHENTICATED` | JWT 없음 또는 invalid |
| `BAD_INPUT` | shareToken 없거나 amount type 오류 |
| `OWN_PET` | 호스트가 본인 경매에 입찰 시도 |
| `BAD_AMOUNT` | amount 가 0 이하 또는 non-finite |
| `RATE_LIMITED` | 1초 내 6회 이상 입찰 시도 |
| `NOT_FOUND` | Redis 상태 없음 (이미 정리됨) |
| `NOT_ACTIVE` | PENDING/ENDED/CANCELED |
| `NOT_STARTED` | 시작 시각 미도달 |
| `ALREADY_ENDED` | 종료 시각 지남 |
| `BID_TOO_LOW` | 최소 입찰가 미달 (응답에 `requiredMin` 포함) |
| `INTERNAL` | Lua 실패 또는 예외 |

---

## 8. REST API

[`auction.controller.ts`](../apps/server/src/auction/auction.controller.ts)

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | `/v1/auction` | required | 경매 생성 + 자동 스케줄링 |
| GET | `/v1/auction/:shareToken` | optional | 라이브 상태 조회 (호스트가 아니어도 공개) |
| POST | `/v1/auction/:shareToken/cancel` | required (호스트) | 호스트 취소 |
| GET | `/v1/auction/:auctionId/bids?cursor&limit` | public | 입찰 히스토리 (cursor 기반) |
| GET | `/v1/me/auction` | required | 내가 호스트인 경매 목록 (최근 50개) |

### 8-1. 입력 검증 ([`auction.service.ts:67-118`](../apps/server/src/auction/auction.service.ts#L67))

| 조건 | 에러 코드 |
|---|---|
| `startTime/endTime` 파싱 실패 | `INVALID_TIME` |
| `end <= start` | `END_BEFORE_START` |
| 경매 길이 < 5분 | `AUCTION_TOO_SHORT` |
| 경매 길이 > 7일 | `AUCTION_TOO_LONG` |
| 시작이 과거(1분 grace 후) | `START_TIME_IN_PAST` |
| `extensionMinutes ∉ [1,10]` | `INVALID_EXTENSION_MINUTES` |
| 연장 윈도우 × 2 >= 경매 길이 | `EXTENSION_WINDOW_TOO_WIDE` |
| `minIncrement < 100` | `MIN_INCREMENT_TOO_LOW` |
| `startingPrice < 0` | `STARTING_PRICE_NEGATIVE` |
| 펫 없음/소유주 아님 | `PET_NOT_FOUND` / `NOT_OWNER` |
| 같은 펫에 PENDING/ACTIVE 경매 존재 | `AUCTION_ALREADY_EXISTS` |

> 시각은 서버에서 **분 정시(HH:MM:00)로 floor** 강제 — 초 단위 마감 경쟁 방지. UI 의 `step=60` 외 API 직접 호출 우회 차단.

---

## 9. 라이프사이클 시나리오 (상세)

### 9-A. 경매 생성

1. **클라이언트** → `POST /v1/auction`
2. **AuctionController.createAuction**
   - `AuctionService.create()`:
     - 입력 검증 (위 §8-1)
     - 트랜잭션 내: 펫 검증 → 중복 경매 검증 → `nanoid()` 로 `auctionId`/`shareToken` 생성 → INSERT
     - `AuctionStateService.hydrate()`: Redis state 초기화 + `auction:active` SADD
   - `AuctionSchedulerService.scheduleAuction()`: BullMQ 에 `start` 잡 (delay = startTime - now), `finalize` 잡 (delay = endTime - now) 추가
3. **응답**: `{ auctionId, shareToken, shareUrl: '${CLIENT_BASE_URL}/auction/{shareToken}' }`

**알림**: 없음 (생성 단계에서는 발송 안 함)

---

### 9-B. 경매 시작 (PENDING → ACTIVE)

1. **BullMQ** delayed `start` 잡 fire (또는 30s/5m watchdog 이 PENDING 검출)
2. **AuctionJobsProcessor.handleStart**
   - `AuctionService.markActive()`: DB status='ACTIVE'
   - `AuctionStateService.setStatus()`: Redis state status='ACTIVE'
   - `publishUpdate('AUCTION_STARTED', { auctionId, shareToken })` → pub/sub
3. **AuctionGateway.afterInit** 의 pmessage 핸들러 → `auction:{id}` room 에 `auction:started` emit
4. **AuctionNotificationService.notifyAuctionStarted** (fire-and-forget)
   - Pet 정보 조회
   - **호스트에게 푸시**: "경매가 시작되었습니다 / {petName}의 경매가 시작되었습니다."
   - **Discord webhook**: `:gavel: **경매 시작** — auctionId=..., host=..., pet=..., end=...`

| 알림 | 채널 | 수신자 |
|---|---|---|
| AUCTION_STARTED | 푸시 | 호스트 |
| (operations) | Discord | #auction 채널 |

---

### 9-C. 입찰 (ACTIVE 중)

1. **클라이언트** → `socket.emit('auction:bid', { shareToken, amount, token? })`
2. **AuctionGateway.onBid**
   - 인증 확인 → 미인증 시 `bid_rejected: UNAUTHENTICATED`
   - 호스트 본인 입찰 차단 → `OWN_PET`
3. **BidService.placeBid**
   - `checkRateLimit`: `bid:rl:{auctionId}:{userId}` INCR + PEXPIRE 1s → 1초 5회 초과 시 `RATE_LIMITED`
   - **Lua 스크립트 실행** ([place-bid.lua](../apps/server/src/auction/lua/place-bid.lua)):
     - HMGET 으로 state 읽기
     - 검증: 존재 / `ACTIVE` 여부 / 시작 시각 / 종료 시각 / 최소 입찰가
     - 통과 시 atomically: HSET highest_bid/bidder/nickname/last_bid_ts_ms/current_end_time_ms + LPUSH bid_json + LTRIM 50
     - 자동 연장 판단: `now >= currentEnd - extensionWindow` 이면 `newEnd = now + extensionWindow`, `originalEnd` 초과 시 분 정시 올림
   - 결과 배열 `[1, 'OK', amount, bidderId, newEndTimeMs, triggered_extension, ts, prev_highest_bidder]` 반환
4. **broadcast**: `publishUpdate('BID_ACCEPTED', payload)` → 모든 노드의 pub/sub 핸들러가 room 에 `auction:bid_accepted` emit
5. **bid-persist 큐 enqueue**: BullMQ 가 비동기로 `auction_bids` + `auction_participants` 영속화
6. **outbid 알림**: 직전 최고가 입찰자가 있고 본인이 아니면 → `AuctionNotificationService.notifyBidOutbid` (FCM 푸시만)
7. **연장 시 재스케줄**: `triggered_extension == 1` 이면 `auction:{id}:finalize` jobId 로 새 delay 의 finalize 잡 add → 기존 잡 자동 replace

| 알림 | 채널 | 수신자 | 조건 |
|---|---|---|---|
| BID_ACCEPTED | WS | room 의 모든 socket | 입찰 성공 시 |
| AUCTION_OUTBID | 푸시 | 직전 최고가 입찰자 | prev bidder 존재 + 본인 아님 |

> outbid 알림은 spam 회피로 **인앱 알림 저장 없음, 푸시만**. 같은 사용자가 연속 outbid 당하면 매번 푸시 발송.

---

### 9-D. 자동 연장 (입찰의 부수효과)

Lua 스크립트가 `now >= currentEnd - extensionWindow` 일 때 자동 발동.

| 단계 | 동작 |
|---|---|
| Lua | `current_end_time_ms` HSET 갱신 + 결과의 `triggered_extension=1` |
| BidService | `auctionQueue.add('finalize', ..., { jobId: 'auction:{id}:finalize', delay: newEnd - now })` → 기존 finalize 잡을 동일 jobId 로 replace |
| pub/sub payload | `extended: true, newEndTimeMs` 클라이언트 전달 → UI 가 연장 애니메이션 표시 |

**원본 종료 시각 초과 시 분 정시 올림**: 입찰자가 초 단위로 경쟁하지 않게, `originalEnd` 를 초과해 연장되는 경우에만 `Math.ceil(newEnd / 60000) * 60000` 적용. 호스트 설정 연장 시간 ≤ 실제 연장 < (설정 + 60초).

---

### 9-E. 경매 종료 (ACTIVE → ENDED)

1. **BullMQ** delayed `finalize` 잡 fire (또는 30s/5m watchdog)
2. **AuctionJobsProcessor.handleFinalize**
   - Redis 상태 확인 (없으면 skip)
   - 종료 시각 미도달 → `NOT_YET` skip
   - 이미 ENDED/CANCELED → skip
   - **closing lock 획득** (`SET auction:{id}:closing 1 PX 60000 NX`) → 멀티 노드/중복 잡 방지
   - 최고가/낙찰자 결정 → `bidRepo.findOne` 으로 `winnerBidId` 매핑
   - **AuctionService.markEnded** (트랜잭션): DB status='ENDED' + finalPrice/winnerUserId/winnerBidId
   - `setStatus('ENDED')`: Redis state status='ENDED' + active set 제거 + TTL 24h
   - `setFinalResult(winner)`: final_price/winner_user_id HSET
   - `publishUpdate('AUCTION_ENDED', { winner })` → pub/sub
   - **AuctionNotificationService.notifyAuctionEnded** (fire-and-forget)
   - closing lock DEL
3. **Gateway pmessage** → room 에 `auction:ended` emit

| 알림 | 채널 | 수신자 | 텍스트 |
|---|---|---|---|
| AUCTION_ENDED_HOST | 푸시 + 인앱 | 호스트 | 낙찰 시: "경매가 낙찰되었습니다 / {pet}이(가) {price}원에 낙찰" / 유찰 시: "경매가 종료되었습니다 / 입찰자 없이 종료" |
| AUCTION_ENDED_WINNER | 푸시 + 인앱 | 낙찰자 (있을 때만) | "낙찰을 축하합니다 / {pet}을 {price}원에 낙찰받으셨습니다" |
| (operations) | Discord | #auction 채널 | `:trophy: **경매 종료** — auctionId=..., winner=... price=...` |

> 인앱 알림은 `senderId+receiverId+type+targetId` UNIQUE 충돌 시 ignore → 동일 경매에 대해 중복 저장 없음.

---

### 9-F. 호스트 취소 (PENDING/ACTIVE → CANCELED)

1. **클라이언트** → `POST /v1/auction/:shareToken/cancel`
2. **AuctionService.cancelByHost** (트랜잭션)
   - 권한 체크 (`hostUserId === userId`)
   - 상태 체크 (ENDED/CANCELED 면 `CANNOT_CANCEL_TERMINAL`)
   - DB status='CANCELED'
   - Redis state status='CANCELED' (+ active set 제거, TTL 24h)
3. 트랜잭션 커밋 후 `publishUpdate('AUCTION_CANCELED', { auctionId, shareToken })` → 입찰자/관전자에게 즉시 안내
4. 기존 `finalize` 잡은 그대로 두어도 status=CANCELED 분기로 skip

| 알림 | 채널 | 수신자 |
|---|---|---|
| AUCTION_CANCELED | WS only (`auction:cancelled`) | room 의 모든 socket |
| **현재 푸시/인앱 없음** | — | — |

> ⚠️ **알려진 갭**: 입찰자가 앱을 닫은 상태에서 호스트가 취소하면 인지할 수 없음. 후속 작업 후보.

---

## 10. 알림 매트릭스 (요약)

| 이벤트 | 호스트 | 입찰자 | 낙찰자 | 직전 최고가 | 관전자 | Discord |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| 경매 시작 | 푸시 | — | — | — | WS | ✅ |
| 입찰 성공 | — | (브로드캐스트 받음) | — | — | WS | — |
| 입찰 역전 (outbid) | — | — | — | 푸시 | — | — |
| 자동 연장 | — | (WS payload 의 extended=true) | — | — | WS | — |
| 경매 종료 | 푸시+인앱 | — | 푸시+인앱 | — | WS | ✅ |
| 호스트 취소 | — | — | — | — | WS only | — |

**모바일 deep link**: 푸시의 `data.path = '/auction/{shareToken}'`. 백그라운드 알림 탭 시 [`apps/mobile/src/hooks/usePushNotification.ts`](../apps/mobile/src/hooks/usePushNotification.ts) 가 `pendingDeepLinkPath` 저장 → `App.tsx` 가 NavigationRef ready 후 navigate. **foreground 알림은 path 처리 분기 없음** (알려진 갭).

자세한 메시지/payload 는 §11 참고.

---

## 11. 알림 페이로드 상세

### 11-1. FCM `data` 공통 필드

| 필드 | 값 |
|---|---|
| `type` | `AUCTION_STARTED` / `AUCTION_ENDED_HOST` / `AUCTION_ENDED_WINNER` / `AUCTION_OUTBID` |
| `shareToken` | 경매 공유 토큰 |
| `auctionId` | nanoid string |
| `path` | `/auction/{shareToken}` |

### 11-2. AuctionNotificationService 메시지 (현재 사용 중)

[`auction-notification.service.ts`](../apps/server/src/auction/auction-notification.service.ts)

직접 `FcmService.sendPushNotification` 호출 (== 인앱 알림과 별도 path).

### 11-3. UserNotificationService.getPushMessage (백업)

[`user_notification.service.ts:130-172`](../apps/server/src/user_notification/user_notification.service.ts#L130)

`sendPushNotificationForNotification(notification)` 호출 시 사용되는 메시지 매핑. **현재 경매 모듈은 이 경로를 거치지 않으나**, 인앱 알림이 다른 곳에서 발송될 가능성에 대비해 동일한 4개 case 가 등록되어 있음.

> 두 곳에 메시지 정의가 있는 셈 — 향후 일원화 후보 (관련 메모는 `docs/auction-system-implementation-plan.md` 참고 가능).

### 11-4. Discord webhook 포맷

```
:gavel: **경매 시작** — auctionId=`{nanoid}`, host=`{userId}`, pet=`{petId}`, end={ISO}
:trophy: **경매 종료** — auctionId=`{nanoid}`, winner=`{userId}` price={price}원
```

유찰 시: `winner=` 대신 `입찰자 없음`.

---

## 12. 장애 복구 메커니즘

| 장애 시나리오 | 자동 복구 메커니즘 |
|---|---|
| BullMQ delayed start 잡 유실 | 30s `watchdog`: Redis active set + PENDING + 시작 시각 지남 → start 재투입 |
| BullMQ delayed finalize 잡 유실 | 30s `watchdog`: ACTIVE + 종료 시각 지남 → finalize 재투입 |
| Redis flush / active set 비어있음 | 5m `dbFallbackWatchdog`: DB 의 ACTIVE/PENDING 200건 조회 → 해당되는 잡 재투입 |
| 멀티 노드에서 finalize 중복 실행 | `auction:{id}:closing` SETNX lock (60s) — 둘째 시도는 `ALREADY_CLOSING` skip |
| 멀티 노드에서 start 중복 실행 | `markActive` 가 status check 후 idempotent |
| Lua 실행 실패 | `INTERNAL` 응답 → 클라이언트 재시도 가능 |
| bid-persist 워커 실패 | BullMQ `attempts: 5` + exponential backoff 500ms |
| `notify*` 실패 | `logger.warn` 만, 비즈니스 흐름 영향 없음 |
| Discord webhook 실패 | `logger.warn` |
| WS 연결 끊김 | socket.io 자동 재연결 (정책 미명시, 기본값 사용) |

> finalize 중복 실행은 lock 으로 막지만, **`markEnded` 자체도 트랜잭션 안에서 status check 후 idempotent** 라 이중 안전. 잡은 부담 없이 여러 경로로 추가해도 됨.

---

## 13. 환경 변수

| 키 | 필수 | 기본값 | 용도 |
|---|---|---|---|
| `REDIS_HOST` | ✔ | `localhost` | Redis 호스트 |
| `REDIS_PORT` | ✔ | `6379` | Redis 포트 |
| `REDIS_PASSWORD` | optional | — | Redis 패스워드 |
| `JWT_SECRET` | ✔ | — | WS 토큰 검증 |
| `DISCORD_AUCTION_WEBHOOK_URL` | optional | — | 미설정 시 silent skip |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ✔ | — | FCM 서비스 계정 |
| `CLIENT_BASE_URL` | optional | `""` | shareUrl 생성에 사용 |
| `NEXT_PUBLIC_WS_BASE_URL` | ✔ (client) | — | 클라이언트가 ws 연결할 base |

`.env.example`: [apps/server/.env.example](../apps/server/.env.example)
turbo task env 등록: [`turbo.json`](../turbo.json) (CI 캐시 키에 포함)

> ⚠️ 보안: `DISCORD_AUCTION_WEBHOOK_URL` 은 turbo env 에 등록되어 있어 CI 로그/캐시에 흔적이 남을 수 있음. 시크릿 매니저 경유 또는 server-only 분리 검토 권장.

---

## 14. 운영/모니터링 가이드

### 14-1. 실시간 상태 점검 (Redis CLI)

```bash
# 활성 경매 ID 목록
redis-cli SMEMBERS auction:active

# 특정 경매 상태
redis-cli HGETALL auction:{id}:state

# 최근 입찰
redis-cli LRANGE auction:{id}:bids 0 9

# closing lock 확인
redis-cli GET auction:{id}:closing
```

### 14-2. BullMQ 잡 점검

```bash
# 대기 중인 delayed 잡 수
redis-cli ZCARD bull:auction-jobs:delayed
redis-cli ZCARD bull:auction-bid-persist:delayed

# 실패한 잡
redis-cli ZRANGE bull:auction-jobs:failed 0 -1 WITHSCORES
```

(BullMQ Board UI 도입 검토 가치 — 현재는 CLI 만)

### 14-3. 로그 키워드

| 키워드 | 의미 |
|---|---|
| `notifyAuctionStarted failed` / `notifyAuctionEnded failed` / `notifyBidOutbid failed` | 알림 발송 실패 |
| `discord webhook failed` | Discord POST 실패 |
| `Lua eval failed` | Redis Lua 실행 오류 |
| `bid persist enqueue failed` | bid 영속화 큐 enqueue 실패 (드물지만 발생 시 데이터 손실) |
| `finalize reschedule failed` | 자동 연장 후 finalize 재스케줄 실패 |
| `watchdog tick failed` / `db fallback watchdog failed` | 안전망 실패 |
| `ALREADY_CLOSING` | 정상 — 중복 finalize 잡이 lock 에 막힘 |
| `NOT_YET` | 정상 — finalize 잡이 종료 시각 전에 실행됨 (연장 후 잔존 잡) |

### 14-4. 자주 묻는 운영 시나리오

| 질문 | 답 |
|---|---|
| "경매가 종료 시각이 지났는데 ENDED 안 됨" | 최대 30초 내 watchdog 이 finalize 잡 재투입. 그래도 안 되면 BullMQ `failed` 큐 확인 / Redis active set 확인 |
| "Discord 알림 안 옴" | `DISCORD_AUCTION_WEBHOOK_URL` 설정 확인, 서버 로그 `discord webhook failed` 확인, Discord 측 webhook rate limit (30/min/channel) 확인 |
| "FCM 푸시 안 옴" | 사용자가 FCM 토큰 등록했는지, `FIREBASE_SERVICE_ACCOUNT_PATH` 유효한지, 로그에 `Failed to send push notification` |
| "같은 사용자가 한 경매에 여러 outbid 알림 받음" | 정상 동작 — 매 outbid 마다 푸시 발송. 인앱은 저장 안 함. |
| "취소된 경매도 클라이언트가 ACTIVE 로 보임" | WS 연결 안 됐을 가능성 — 다음 페이지 로드 시 `getLiveState` 가 CANCELED 반환 |

---

## 15. 알려진 제약 / 후속 작업

브랜치 리뷰에서 합의된 항목 (구현 시점 기준):

| 영역 | 항목 |
|---|---|
| **DB** | `synchronize: true` 운영 위험 — 마이그레이션 파일 분리 필요 |
| **DB** | `auction_bids.auctionId` FK 단독 인덱스 추가 (현재는 복합만) |
| **DB** | `@Unique` decorator 명시화 (현재 `@Index unique: true` 만) |
| **Redis** | `onModuleDestroy` 의 quit/disconnect 미구현 — graceful shutdown 지연 |
| **Redis** | `getMyAuctions` 의 50 × HGETALL N+1 — pipeline 으로 batch 가능 |
| **Lua** | rate limit 이 Lua 밖이라 INCR race 로 limit bypass 가능 — Lua 통합 필요 |
| **Lua** | JSON escape 가 `"` 만 — cjson 또는 더 견고한 escape 필요 |
| **finalize** | winner bid 결정 시 동률(같은 금액, 다른 사용자) edge case — Lua 에서 winner bidId 함께 반환하면 안전 |
| **finalize** | `markEnded` 트랜잭션 안에서 Redis publish 호출 — commit 전 broadcast 가능성 |
| **알림** | 호스트 취소 알림 (푸시/인앱) 없음 |
| **알림** | 입찰자(낙찰 못함)에게 종료 알림 없음 |
| **알림** | 메시지 정의가 2곳 (`AuctionNotificationService` inline + `UserNotificationService.getPushMessage`) — 일원화 후보 |
| **모바일** | foreground 푸시에 deep link path 처리 분기 없음 |
| **WS** | reconnection 정책 미명시 (socket.io 기본값 사용) |
| **WS** | 메시지 contract 에 version 필드 없음 |
| **운영** | FCM/Discord 실패 메트릭 없음 — 모니터링 도구 필요 |
| **운영** | `DISCORD_AUCTION_WEBHOOK_URL` 이 turbo env 에 노출 — CI 로그/캐시에 흔적 가능 |

---

## 16. 빠른 코드 인덱스

| 파일 | 역할 |
|---|---|
| [`auction.constants.ts`](../apps/server/src/auction/auction.constants.ts) | 상태 enum, 길이/연장 제약, queue 이름 |
| [`auction.entity.ts`](../apps/server/src/auction/auction.entity.ts) | DB 스키마 |
| [`auction_bid.entity.ts`](../apps/server/src/auction/auction_bid.entity.ts) | 입찰 영속 |
| [`auction_participant.entity.ts`](../apps/server/src/auction/auction_participant.entity.ts) | 참가자 집계 |
| [`auction.service.ts`](../apps/server/src/auction/auction.service.ts) | 생성/조회/취소/상태 전이 |
| [`auction-state.service.ts`](../apps/server/src/auction/auction-state.service.ts) | Redis 상태 + pub/sub |
| [`bid.service.ts`](../apps/server/src/auction/bid.service.ts) | 입찰 (Lua 호출 + 큐 enqueue + outbid 알림) |
| [`auction.gateway.ts`](../apps/server/src/auction/auction.gateway.ts) | Socket.IO 게이트웨이 |
| [`auction.controller.ts`](../apps/server/src/auction/auction.controller.ts) | REST 엔드포인트 |
| [`auction-jobs.processor.ts`](../apps/server/src/auction/auction-jobs.processor.ts) | BullMQ start/finalize 워커 |
| [`bid-persist.processor.ts`](../apps/server/src/auction/bid-persist.processor.ts) | BullMQ bid 영속화 워커 |
| [`auction-scheduler.service.ts`](../apps/server/src/auction/auction-scheduler.service.ts) | 잡 스케줄링 + watchdog cron |
| [`auction-notification.service.ts`](../apps/server/src/auction/auction-notification.service.ts) | FCM + Discord + 인앱 발송 |
| [`redis/redis.module.ts`](../apps/server/src/auction/redis/redis.module.ts) | 3개 Redis 클라이언트 |
| [`lua/place-bid.lua`](../apps/server/src/auction/lua/place-bid.lua) | 원자 입찰 스크립트 |
| [`auction.dto.ts`](../apps/server/src/auction/auction.dto.ts) | DTO 및 swagger 정의 |
| [`apps/client/src/app/auction/[shareToken]/AuctionLiveView.tsx`](../apps/client/src/app/auction/[shareToken]/AuctionLiveView.tsx) | 클라이언트 라이브 페이지 |
| [`apps/client/src/app/auction/useAuctionSocket.ts`](../apps/client/src/app/auction/useAuctionSocket.ts) | 클라이언트 WS 훅 |

---

**문서 마지막 갱신**: 2026-05-25 (브랜치 `feat/auction`, PR #246 기준)
**책임자**: 본 문서는 경매 도메인 변경 시 코드 PR 에 함께 갱신할 것.
