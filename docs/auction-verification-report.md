# 경매 시스템 — 단계별 검증 보고서

생성일: 2026-04-28

본 문서는 `docs/auction-system-implementation-plan.md` 의 요구사항에 대한 구현 결과를 단계별로 검증합니다.

---

## 정적 검증 (전 단계 공통)

| 검증 항목 | 결과 |
|---|---|
| 서버 type check (`tsc --noEmit`) | ✅ 통과 |
| 클라이언트 type check | ✅ 통과 |
| 모바일 type check | ✅ (기존 사전 에러 외 신규 에러 없음) |
| 서버 build (`nest build`) | ✅ 통과 |
| 서버 lint (`pnpm lint`) | ✅ 0 errors (기존 31 warnings는 본 작업과 무관) |
| Lua 파일이 dist 로 복사됨 | ✅ `dist/src/auction/lua/place-bid.lua` 존재 |

---

## 단계별 검증

### 1단계: 의존성 + Redis 모듈
- 추가된 패키지: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `bullmq`, `@nestjs/bullmq`, `@nestjs/schedule`, `ioredis`, `nanoid@3`
- `AuctionRedisModule` 가 ioredis 기반 인스턴스 3개 (명령용/sub용/BullMQ용) 를 별도 connection 으로 발급 → BullMQ 와 Pub/Sub 충돌 방지

### 2단계: 엔티티 + 모듈 골격
- `auctions`, `auction_bids`, `auction_participants` 테이블 자동 생성 (`synchronize: true`)
- `AuctionEntity`: shareToken/auctionId UNIQUE, status+currentEndTime 인덱스, host/pet 인덱스
- ID 타입: 기존 코드베이스의 `userId/petId` (VARCHAR) 와 일치하도록 FK 컬럼은 VARCHAR
- 알림 타입 4종 추가: `AUCTION_STARTED`, `AUCTION_ENDED_HOST`, `AUCTION_ENDED_WINNER`, `AUCTION_OUTBID`

### 3단계: REST 엔드포인트
| Method | Path | Auth | 검증 |
|---|---|---|---|
| POST | `/v1/auction` | Required | host == owner, ACTIVE/PENDING 중복 차단, 시간/연장 검증 6종 |
| GET | `/v1/auction/:shareToken` | Optional | 미로그인도 조회 가능 |
| POST | `/v1/auction/:shareToken/cancel` | Required | host only, PENDING only |
| GET | `/v1/auction/:auctionId/bids` | Optional | cursor 페이지네이션 |
| GET | `/v1/me/auction` | Required | 내 호스트 경매 |

검증 룰 (구현 위치: `auction.service.ts` `create()`):
- `endTime > startTime`
- `endTime - startTime >= 5분`
- `endTime - startTime <= 7일`
- `extensionMinutes` 1~10 범위
- `extensionMinutes * 2 < auctionLength` (연장창이 절반 이하)
- `minIncrement >= 100`
- `startingPrice >= 0`
- `pet.ownerId == userId`
- 같은 펫에 대해 ACTIVE/PENDING 중복 차단

### 4단계: AuctionStateService (Redis 동기화)
- 생성 시: `auction:{id}:state` HSET + `auction:active` SADD
- `getLiveState`: Redis 라이브 + DB fallback
- 종료 시: 24h TTL 부여, `auction:active` SREM

### 5단계: Lua 스크립트 + BidService ✅ **실제 Redis 통합 테스트 통과**

`pnpm test src/auction/__tests__/place-bid.lua.spec` (LIVE_REDIS_TEST=1):

| 검증 시나리오 | 결과 |
|---|---|
| `NOT_FOUND` (state 없음) | ✅ |
| `NOT_ACTIVE` (PENDING 상태) | ✅ |
| `NOT_STARTED` (시작 시각 전) | ✅ |
| `ALREADY_ENDED` (종료 시각 후) | ✅ |
| `BID_TOO_LOW` 첫 입찰: requiredMin == startingPrice | ✅ |
| `BID_TOO_LOW` 후속 입찰: requiredMin == highest + minIncrement | ✅ |
| 성공 입찰 → `highest_bid`, `highest_bidder_id` 갱신 | ✅ |
| 연장 트리거 (`now == end - window`) | ✅ `triggered_extension == 1` |
| 연장 미트리거 (마감 멀리) | ✅ `triggered_extension == 0` |
| **동시성: 100명 동일 금액 → 1명만 성공** | ✅ |

추가 보장:
- BID_TOO_LOW 시 `requiredMin` 페이로드 반환 → 클라가 즉시 갱신된 최소가 표시
- 사용자별 rate limit (`bid:rl:{auctionId}:{userId}`, 1초 5회)

### 6단계: WebSocket Gateway
- namespace `/auction`, JWT 옵셔널 (auth handshake / join body / bid body 3가지 경로)
- `auction:join` / `auction:leave` / `auction:bid`
- Pub/Sub 구독: `auction:*:updates` → 룸 fan-out
- 30초마다 `auction:server_time` broadcast (시계 동기화)
- 본인 펫 입찰 차단 (`OWN_PET` reject)

### 7단계: BullMQ 잡 + Watchdog
- `auction-start`: `start_time_ms` 지연 등록 → status PENDING→ACTIVE
- `auction-finalize`: `original_end_time_ms` 지연 등록, 연장 시 동일 jobId 로 대체
- **재검증 패턴**: 잡 실행 시 `now < currentEndTime` 이면 skip (연장 race 처리)
- **closing lock**: `SET NX PX 60000` 으로 멀티 인스턴스 / 중복 잡 방지
- `bid-persist` 잡: MySQL INSERT + participant upsert (재시도 5회, exponential backoff)
- Watchdog 1: 30s마다 `auction:active` SET 검사
- Watchdog 2: 5분마다 DB fallback (Redis flush 대비)

### 8단계: 알림
- 종료 시 호스트/낙찰자에게 `UserNotificationEntity` 적재 (UNIQUE INDEX `orIgnore` 로 중복 방지)
- FCM 푸시 (기존 `FcmService` 사용) — 페이로드에 `path: /auction/{shareToken}` 포함
- Discord 웹훅 (`DISCORD_AUCTION_WEBHOOK_URL`, 미설정 시 silent skip)

### 9단계: Next.js 경매 페이지
- `/auction/[shareToken]/page.tsx` — SSR + initialState
- `useAuctionSocket` 훅 — JWT 토큰 자동 첨부, 자동 재연결
- 시계 오프셋 유지 (`serverNowMs` 차이 추적, `auction:server_time` 30s 단위 보정)
- 카운트다운 100ms 틱
- 마감 60초 전 빨간색
- 연장 시 "⏱ 연장됨!" 토스트 (2초)
- 본인 펫일 때 입찰 UI 비표시
- 미로그인 시 입찰 버튼이 로그인 페이지로 라우팅
- 낙관적 UI 미적용 (요구사항 9.3)

### 10단계: 경매 생성 모달
- 펫 상세 페이지의 "개체 경매" 버튼 → `overlay.open(<CreateAuctionDialog>)` 로 모달 표시
- 비공개 펫이면 버튼 비활성 + Tooltip(데스크탑) / toast(모바일) 안내
- 모달은 `next/dynamic` 으로 lazy 로딩 (펫 상세 진입 번들 부담 0)
- `lockPetId` 로 모달 진입 시 펫 ID 인풋 잠금
- 클라 검증 (서버와 동일): 5분 이상, 종료 > 시작, 연장창 < 절반, 1~10분 범위
- 생성 성공 시 공유 링크 + 복사 버튼 + 페이지 이동 버튼 (모달 안에서 inline 전환)

### 11단계: 모바일 webview 라우팅
- 푸시 데이터 `path` 필드 추가
- `notification` store 에 `pendingDeepLinkPath` 추가
- `usePushNotification` 에서 path 우선 (없으면 기존 notificationId 라우팅)
- App.tsx 에서 `pendingDeepLinkPath` 감지 → `navigationRef.navigate('Main', { path })`

### 12단계: 보안/운영
- 본인 펫 입찰 차단 (서비스 레이어 + WS 게이트웨이 양쪽)
- 사용자별 rate limit: `bid:rl:{auctionId}:{userId}` (1초당 5회)
- 입찰가 검증: 모두 Lua 스크립트 안 (클라 검증은 UX 용)
- shareToken: nanoid 22자리 (≈131 bit entropy)
- WebSocket 토큰 만료: bid 시점 재검증
- 시작 후 메타 변경: 별도 PATCH 엔드포인트 미생성으로 차단
- `/health` 엔드포인트: Redis ping + MySQL ping
- 새 ENV 추가: `DISCORD_AUCTION_WEBHOOK_URL` (선택)

---

## 알려진 한계 / 향후 작업

1. **부하 테스트**: k6 / artillery 시뮬레이션 미수행 (인프라 필요).
2. **알림 UI 의 새 타입 처리**: `notifications` 페이지에 `AUCTION_*` 타입의 별도 카드 디자인 미작성. `path` 가 푸시에 포함되어 있어 모바일에서는 즉시 deep-link 동작.
3. **orval 재생성**: 서버를 켜야 할 수 있어 현재 미실행. 클라이언트는 `AXIOS_INSTANCE` 직접 호출로 대체 (CLAUDE.md 패턴).
4. **e2e 테스트**: WebSocket join → 입찰 → broadcast 시나리오는 통합 테스트 환경 필요.

## 운영 체크리스트

- [ ] `.env.local` / `.env.production` 에 `DISCORD_AUCTION_WEBHOOK_URL` 추가 (선택)
- [ ] Lightsail Redis 인스턴스에 `maxmemory-policy=noeviction` 설정 (BullMQ 권장)
- [ ] 첫 배포 후 `/health` 200 확인
- [ ] `LIVE_REDIS_TEST=1 pnpm test src/auction` 로 Lua 동시성 회귀 테스트 정기 실행
