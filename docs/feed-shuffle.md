# Redis 기반 피드 셔플 시스템

## 배경

피드 페이지에서 펫을 랜덤하게 노출해야 한다. 펫 테이블은 수십만 건 이상으로 증가할 예정이므로, `ORDER BY RAND()`처럼 전체 테이블 스캔이 필요한 방식은 사용할 수 없다.

## 아키텍처

Redis Sorted Set을 활용한 **사전 셔플 + 캐싱** 방식을 사용한다.

```
Client                          Server                          Redis                   MySQL
  │                               │                               │                       │
  │ GET /v1/pet/feed              │                               │                       │
  │   ?seed=1712500000            │                               │                       │
  │   &page=1                     │                               │                       │
  │   &itemPerPage=10             │                               │                       │
  ├──────────────────────────────►│                               │                       │
  │                               │  EXISTS feed:shuffle:1712..   │                       │
  │                               ├──────────────────────────────►│                       │
  │                               │                               │                       │
  │                               │  ┌─ Cache MISS ──────────────►│                       │
  │                               │  │                             │  SELECT petId         │
  │                               │  │                             │  FROM pets            │
  │                               │  │                             │  WHERE isPublic=true  │
  │                               │  │                             │  AND isDeleted=false  │
  │                               │  │                             ├──────────────────────►│
  │                               │  │                             │◄─── [id1,id2,...,idN] │
  │                               │  │                             │                       │
  │                               │  │  Seed 기반 Fisher-Yates 셔플│                       │
  │                               │  │  ZADD feed:shuffle:1712..   │                       │
  │                               │  │    0 id_x, 1 id_y, ...     │                       │
  │                               │  └────────────────────────────►│                       │
  │                               │                               │                       │
  │                               │  ┌─ Cache HIT ───────────────►│                       │
  │                               │  │  ZRANGE feed:shuffle:1712.. │                       │
  │                               │  │    0 9 (offset~offset+9)   │                       │
  │                               │  │◄── [id_x, id_y, ..., id_z] │                       │
  │                               │  │                             │                       │
  │                               │  │  SELECT * FROM pets         │                       │
  │                               │  │  WHERE petId IN (id_x,..)  │                       │
  │                               │  └────────────────────────────────────────────────────►│
  │                               │◄──────────────────────────────────── [pet details]     │
  │                               │                               │                       │
  │◄──────────────────────────────│  PageDto<PetDto>              │                       │
  │                               │                               │                       │
```

## 핵심 개념

### Seed 기반 셔플

- 클라이언트가 `Math.floor(Date.now() / (1000 * 60 * 15))`으로 **15분 단위 seed**를 생성한다.
- 같은 15분 구간의 모든 사용자가 동일한 seed → **동일한 Redis 셔플 캐시를 공유**.
- 같은 seed는 항상 같은 셔플 순서를 보장한다 → **무한스크롤 페이지네이션과 호환**.
- 15분이 지나면 새로운 seed → 새로운 순서.
- TTL 30분 기준 최대 2~3개의 셔플 캐시만 Redis에 유지 → **메모리 효율적**.

### Fisher-Yates 셔플 (Seeded PRNG)

- `Math.random()` 대신 seed 기반 의사 난수 생성기(mulberry32)를 사용한다.
- 같은 seed 입력 → 같은 난수 시퀀스 → 같은 셔플 결과.

```typescript
// Seeded PRNG (mulberry32)
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### Redis Sorted Set 활용

| 연산 | 용도 | 시간복잡도 |
|------|------|-----------|
| `EXISTS` | 셔플 캐시 존재 여부 확인 | O(1) |
| `ZADD` | 셔플된 petId를 score(순서)와 함께 저장 | O(N log N) |
| `ZRANGE` | 해당 페이지의 petId 조회 | O(log N + M) |
| `ZCARD` | 전체 개수 (totalCount) | O(1) |
| `EXPIRE` | TTL 설정 | O(1) |

## 캐시 전략

### 캐시 키
```
sfeed:{seed}
```

### TTL
- **30분** — seed 구간(15분)보다 길게 설정하여 전환 시점에 스크롤 중인 사용자도 안정적으로 서빙
- 15분 seed 구간 기준 최대 2~3개의 셔플 캐시만 Redis에 유지

### 무효화 전략: TTL 의존 (수동 무효화 없음)
- 셔플 캐시는 **수동 무효화를 하지 않는다** — TTL 만료에 의존
- 펫 생성/삭제/비공개 전환 시에도 셔플 캐시를 삭제하지 않음
- 대신 상세 조회 시 `isPublic = true AND isDeleted = false` 필터로 비공개/삭제 펫을 제외
- 새로 등록된 펫은 최대 30분(TTL) 후에 피드에 반영
- **이유**: 수천 명이 펫을 등록/삭제할 때마다 전체 셔플 캐시가 삭제되면 캐시가 무의미해짐

## 상세 조회 캐시

### 목적
같은 seed + 같은 startOffset + 같은 page를 요청하는 사용자끼리 상세 조회(WHERE IN + JOIN) 결과를 공유하여 DB 부하를 줄인다.

### 캐시 키
```
sfeed-d:{seed}:{startOffset}:{page}
```

### TTL
- **2분** — 비공개/삭제 전환 반영 지연 최대 2분 (피드에서만, 상세 페이지는 즉시 반영)

### 캐시 공유 조건
- startOffset을 **10가지**(0~9)로 제한하여 공유율을 높임
- 동시 접속 1000명 기준, 같은 조건의 사용자 ~100명 → 높은 HIT율
- `wrap()`으로 singleflight 보호 — 동시 요청 시 DB 1번만 호출

## Pull-to-Refresh (startOffset)

### 목적
모바일에서 pull-to-refresh 시 같은 피드가 반복되는 문제를 해결한다. seed가 동일해도 **다른 위치부터 피드를 시작**하여 새로운 느낌을 제공한다.

### 동작 방식
```
셔플 배열 (캐시): [A, B, C, D, E, F, G, H, I, J, ...]

첫 진입 (startOffset=0):
  page 1: [A, B, C, D, E, F, G, H, I, J]
  page 2: [K, L, M, N, O, P, Q, R, S, T]

pull-to-refresh (startOffset=37):
  순환 배열:     [...37번째부터, ..., A, B, ..., 36번째]
  page 1: [37번째 펫부터 10개]
  page 2: [47번째 펫부터 10개]

다시 pull-to-refresh (startOffset=152):
  순환 배열:     [...152번째부터, ..., A, B, ..., 151번째]
  page 1: [152번째 펫부터 10개]
```

### 구현
- 클라이언트: `useMemo(() => Math.floor(Math.random() * 10000), [])` — 컴포넌트 마운트 시 랜덤 생성
- 모바일 pull-to-refresh는 WebView `reload()` → 컴포넌트 재마운트 → 새 startOffset
- 서버: 캐시된 셔플 배열에서 `startOffset % totalCount` 위치부터 순환하여 페이지네이션
- **Redis 캐시는 재사용** — 새 캐시를 생성하지 않으므로 메모리 부담 없음

## 성능 고려사항

### 데이터 규모별 예상 성능

| 펫 수 | ID 조회 | 셔플 | 캐시 저장 | 캐시 HIT 조회 | 메모리 |
|--------|---------|------|----------|--------------|--------|
| 1만 | ~10ms | ~1ms | ~10ms | <1ms | ~100KB |
| 10만 | ~50ms | ~10ms | ~50ms | <1ms | ~1MB |
| 50만 | ~200ms | ~50ms | ~200ms | <1ms | ~5MB |

- **캐시 HIT 시**: 배열 slice + WHERE IN 조회만 발생 → **수 ms 이내**
- **캐시 MISS 시**: ID 조회 + 셔플 + 캐시 저장 → 15분마다 1회만 발생, 이후 30분간 캐시 활용
- ID만 조회하므로 DB 부하 최소 (커버링 인덱스 활용)
- **빈 결과는 캐싱하지 않음** — 펫 등록 후 즉시 피드에 반영

### WHERE IN 쿼리
- 페이지 크기(10~20개)의 petId로 상세 데이터 조회
- Primary Key 기반이므로 인덱스 활용, 매우 빠름

## 엔드포인트

```
GET /v1/pet/feed?seed={number}&page={number}&itemPerPage={number}&startOffset={number}
```

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| seed | number | (필수) | 셔플 시드 (30분 단위 타임스탬프) |
| page | number | 1 | 페이지 번호 |
| itemPerPage | number | 10 | 페이지당 항목 수 |
| startOffset | number | 0 | 셔플 배열 시작 오프셋 (pull-to-refresh 시 랜덤 값) |

### 응답
기존 `PageDto<PetDto>`와 동일한 형태.

## 관련 파일

| 파일 | 역할 |
|------|------|
| `apps/server/src/pet/pet.service.ts` | `getShuffledFeed()` 메서드 |
| `apps/server/src/pet/pet.controller.ts` | `GET /v1/pet/feed` 엔드포인트 |
| `apps/server/src/pet/pet.dto.ts` | `FeedQueryDto` |
| `apps/server/src/common/cache.service.ts` | Sorted Set 연산 메서드 |
| `apps/server/src/common/cache-keys.ts` | `shuffledFeed` 캐시 키 |
| `apps/server/src/common/cache-invalidation.ts` | 무효화 규칙 |
| `apps/client/src/components/feed/PetList.tsx` | 클라이언트 피드 호출 |
