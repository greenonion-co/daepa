# 서버 캐시 전략 — Redis Cache-Aside

## 1. 개요

### 현재 상태
- **서버**: 캐시 없음. 모든 요청이 MySQL 직접 조회
- **클라이언트**: React Query로 계층화된 staleTime 적용 (썸네일 ∞, 가계도 5분, COI 10분)
- **CDN**: Cloudflare R2 이미지만 — API 응답 캐시 없음

### 목표
- **Cache-Aside + 안전망 TTL** 패턴으로 서버 Redis 캐시 도입
- 데이터 변경 시 수동 무효화 → 변경 없는 동안 DB 부하 제로
- 안전망 TTL로 무효화 누락 시에도 최대 30일 후 자동 갱신

### 핵심 원칙
```
읽기: Redis 확인 → HIT이면 즉시 반환, MISS이면 DB 조회 → Redis 저장
쓰기: DB 변경 → 관련 캐시 키 삭제 (갱신 아님)
```

- 캐시는 **삭제만** 한다. 새 값으로 **갱신하지 않는다** (race condition 방지)
- **1:1 매핑 데이터** (개체, 썸네일): 30일 TTL + 수동 무효화 — 무효화 키가 명확하므로 누락 가능성 낮음
- **조합/목록 데이터** (피드, 페어 목록): 3분 TTL + 패턴 무효화 — 패턴 삭제 누락 시 30일간 오래된 목록 노출 위험 방지

---

## 2. 아키텍처

```
[브라우저]
    ↓ React Query (staleTime: 0~∞)
[Next.js 클라이언트]
    ↓ HTTP
[NestJS 서버]
    ↓ CacheService.wrap()
[Redis]  ←── HIT이면 여기서 반환 (1~2ms)
    ↓ MISS
[MySQL]  ←── MISS일 때만 조회 (10~100ms)
```

### 이중 캐시 레이어

| 계층 | 위치 | 역할 | 예시 |
|------|------|------|------|
| L1 | 클라이언트 (React Query) | 브라우저 내 캐시, 사용자별 | staleTime: 5분이면 5분간 API 호출 안 함 |
| L2 | 서버 (Redis) | 서버 내 캐시, 모든 사용자 공유 | 사용자 A가 캐시 생성 → 사용자 B도 HIT |

---

## 3. 기술 스택 및 설정

### 패키지

```bash
# apps/server
pnpm add @nestjs/cache-manager cache-manager cache-manager-redis-yet redis
```

### 환경변수

```env
# apps/server/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### AppModule 설정

```ts
// apps/server/src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
        }),
      }),
    }),
    // ... 기존 모듈
  ],
})
export class AppModule {}
```

---

## 4. 캐시 키 설계 규칙

### 네이밍 컨벤션

```
{도메인}:{식별자}[:{하위식별자}]
```

| 규칙 | 예시 | 설명 |
|------|------|------|
| 도메인은 짧은 영문 | `pet`, `thumb`, `ftree` | 가독성 + Redis 메모리 절약 |
| 식별자는 콜론(`:`)으로 구분 | `pair-stats:{fId}:{mId}` | Redis 관례 |
| 사용자 소유 데이터는 `userId` 포함 | `pair-list:{userId}:{hash}` | 데이터 격리 (보안) |
| 공개 데이터는 `userId` 없음 | `pet:{petId}` | 모든 사용자가 공유 |
| 목록은 필터 해시 사용 | `feed:{hash}` | 필터 조합이 많을 때 키 폭발 방지 |

### 필터 해시 방식

```ts
import { createHash } from 'crypto';

// 필터 객체를 정렬된 JSON → MD5 해시 (8자)
function hashFilters(filters: Record<string, any>): string {
  const sorted = JSON.stringify(filters, Object.keys(filters).sort());
  return createHash('md5').update(sorted).digest('hex').slice(0, 8);
}

// 예: feed:{filterType}:{page}:{hash8}
// hashFilters({ keyword: "모르핀", isPublic: 1 }) → "a3f2b1c4"
```

---

## 5. API별 캐시 전략

### 전체 캐시 맵

```
API                              │ 키 패턴                              │ TTL      │ 읽기빈도 │ 쓰기빈도 │ 비고
─────────────────────────────────┼─────────────────────────────────────┼──────────┼──────────┼──────────┼────────────
GET /v1/pet/:petId               │ pet:{petId}                         │ 30일     │ 높음     │ 집중+휴지│ 수정 후 긴 조회기간
GET /v1/pet-image/thumb/:petId   │ thumb:{petId}                       │ 30일     │ 매우높음 │ 매우낮음 │ 이미지 거의 불변
GET /v1/pet/family-tree/:petId   │ ftree:{petId}:{depth}:{ancDepth}    │ 30일     │ 높음     │ 낮음     │ CTE 무거움
GET /v1/statistics/pairs         │ pair-stats:{userId}:{hash}          │ 30일     │ 중간     │ 낮음     │ 4단계 배치 파이프라인
GET /v1/statistics/adoptions     │ adopt-stats:{userId}:{hash}         │ 30일     │ 낮음     │ 낮음     │ 8+ 테이블 집계
GET /v1/pairs/:pairId            │ pair:{pairId}                       │ 30일     │ 중간     │ 중간     │ 중첩 구조
GET /v1/pet-adoption/:petId      │ pet-adopt:{petId}                   │ 30일     │ 중간     │ 중간     │ 분양 상태
GET /v1/pet/parents/:petId       │ parents:{petId}                     │ 30일     │ 높음     │ 낮음     │ 부모 조회
GET /v1/pet/children/:petId      │ children:{petId}:{page}             │ 30일     │ 중간     │ 낮음     │ 자식 목록 (페이지네이션)
GET /v1/pet/siblings/:petId      │ siblings:{petId}:{page}             │ 30일     │ 낮음     │ 낮음     │ 형제 목록
GET /v1/pet/clutch-mates/:petId  │ clutch:{petId}                      │ 30일     │ 낮음     │ 낮음     │ 클러치메이트
GET /v1/pet (공개 피드)           │ feed:{hash}                         │ 3분      │ 매우높음 │ 간접     │ 조합 데이터, 정밀 무효화 어려움
GET /v1/br/pet (내 개체)          │ my-pets:{userId}:{hash}             │ 3분      │ 높음     │ 간접     │ 사용자별 목록
GET /v1/pairs (페어 목록)         │ pair-list:{userId}:{hash}           │ 3분      │ 중간     │ 간접     │ 필터+페이지네이션 조합 다양
GET /v1/user/public-profile/:name│ profile:{name}                      │ 30일     │ 낮음     │ 낮음     │ 쇼룸 프로필
```

### 캐시 제외 대상

| API | 제외 사유 |
|-----|-----------|
| `GET /v1/feedings` | 매일 기록, 실시간성 필요 |
| `GET /v1/user-notification` | 실시간 알림, 캐시하면 새 알림 누락 |
| `GET /v1/user-notification/unread/count` | 실시간 카운터 |
| `GET /v1/parent-requests/:petId/pending-count` | 실시간 카운터 |
| `POST/PATCH/DELETE` 전체 | 쓰기 작업은 캐시하지 않음 |

---

### 5.1 개체 상세 (`GET /v1/pet/:petId`)

**특성**: 필드별 개별 수정 API 호출로 집중 수정 구간이 있지만, 수정 후 긴 조회 기간.

```
[집중 수정] 이름→성별→모프→공개설정 (수분간)
[이후 조회] 다른 사용자들이 반복 조회 (수일~수주)
```

```ts
// 키: pet:{petId}
// TTL: 30일 (안전망)
// 무효화: PATCH /v1/pet/:petId 시 DEL

async findPetByPetId(petId: string) {
  return this.cacheService.wrap(
    CACHE.pet.key(petId),
    () => this.petRepository.findOne({ where: { petId }, relations: ['owner'] }),
    CACHE.pet.ttl,
  );
}
```

**수정 시 무효화:**
```ts
async update(petId: string, dto: UpdatePetDto) {
  await this.petRepository.update(petId, dto);
  await this.cacheService.del(CACHE.pet.key(petId));
  await this.cacheService.delByPattern(CACHE.feed.pattern);  // 목록에도 반영
}
```

---

### 5.2 피드 목록 (`GET /v1/pet`)

**특성**: 여러 사용자의 데이터가 조합된 목록. 누군가 개체를 등록/수정하면 목록이 바뀜. 정밀한 무효화가 어려움.

```ts
// 키: feed:{hash8} (filterType + page + keyword + isPublic 등의 해시)
// TTL: 3분 (짧은 TTL로 자연 갱신에 의존)
// 무효화: 개체 등록/수정/삭제 시 DEL feed:*

async findAll(query: FindAllDto) {
  const key = CACHE.feed.key(hashFilters({
    filterType: query.filterType,
    page: query.page,
    keyword: query.keyword,
    isPublic: query.isPublic,
  }));
  return this.cacheService.wrap(key, () => this.findAllFromDB(query), CACHE.feed.ttl);
}
```

**왜 TTL이 짧은가:**
- `feed:ALL:1` 캐시가 있을 때, 다른 사용자가 개체 등록 → 이 개체가 1페이지에 나와야 하는지, 3페이지에 나와야 하는지 알 수 없음
- `feed:*` 패턴 삭제로 전체 플러시하되, 삭제 누락 가능성 대비 짧은 TTL

---

### 5.3 썸네일 (`GET /v1/pet-image/thumbnail/:petId`)

**특성**: 모든 펫 카드에서 호출. 이미지 변경은 극히 드묾. 캐시 효과 최대.

```ts
// 키: thumb:{petId}
// TTL: 30일
// 무효화: PUT /v1/pet-image/:petId 시 DEL

async findThumbnail(petId: string) {
  return this.cacheService.wrap(
    CACHE.thumbnail.key(petId),
    () => this.petImageRepository.findOne({ where: { petId, isThumbnail: true } }),
    CACHE.thumbnail.ttl,
  );
}
```

---

### 5.4 가계도 / 브리딩맵 (`GET /v1/pet/family-tree/:petId`)

**특성**: Recursive CTE 쿼리로 서버 부하가 큼. 부모 관계 변경 시에만 데이터가 바뀜.

```ts
// 키: ftree:{petId}:{depth}:{ancestorDepth}
// TTL: 30일
// 무효화: 부모 관계 변경(link/unlink) 시 관련 트리 삭제

async getFamilyTree(petId: string, depth: number, ancestorDepth: number) {
  return this.cacheService.wrap(
    CACHE.familyTree.key(petId, depth, ancestorDepth),
    () => this.buildFamilyTreeFromDB(petId, depth, ancestorDepth),
    CACHE.familyTree.ttl,
  );
}
```

**무효화 범위:**
```ts
// 부모 관계 변경 시
async invalidateFamilyTreeCache(petId: string, parentId?: string) {
  // 1. 변경된 개체의 트리
  await this.cacheService.delByPattern(CACHE.familyTree.pattern(petId));
  // 2. 부모의 트리 (자식 목록이 바뀌므로)
  if (parentId) {
    await this.cacheService.delByPattern(CACHE.familyTree.pattern(parentId));
  }
}
```

---

### 5.5 페어 목록 (`GET /v1/pairs`)

**특성**: 5단계 배치 쿼리 (pairs→matings→layings→pets→details). 필터/페이지네이션 조합 다양. 사용자별 데이터.

```ts
// 키: pair-list:{userId}:{hash8}
// TTL: 3분 (목록 — 짧은 TTL)
// 무효화: 메이팅/산란 CRUD 시 DEL pair-list:{userId}:*

async getPairList(userId: string, query: PairListDto) {
  const key = CACHE.pairList.key(userId, hashFilters({
    page: query.page,
    species: query.species,
    fatherId: query.fatherId,
    motherId: query.motherId,
    // ...기타 필터
  }));
  return this.cacheService.wrap(key, () => this.buildPairListFromDB(userId, query), CACHE.pairList.ttl);
}
```

---

### 5.6 페어 상세 (`GET /v1/pairs/:pairId`)

**특성**: 중첩 구조 (pair→matings→layings→eggs). 메이팅/산란 변경 시 무효화.

```ts
// 키: pair:{pairId}
// TTL: 30일
// 무효화: 해당 페어의 메이팅/산란 CRUD 시 DEL

async getPairDetailById(pairId: string) {
  return this.cacheService.wrap(
    CACHE.pairDetail.key(pairId),
    () => this.buildPairDetailFromDB(pairId),
    CACHE.pairDetail.ttl,
  );
}
```

---

### 5.7 페어 통계 (`GET /v1/statistics/pairs`)

**특성**: 4단계 배치 파이프라인. 계산 비용 높음. 메이팅/산란/해칭 이벤트 시에만 변경.

```ts
// 키: pair-stats:{userId}:{hash8}
// TTL: 30일
// 무효화: 메이팅/산란/해칭 CRUD 시 DEL pair-stats:{userId}:*

async getPairStatistics(userId: string, query: PairStatisticsDto) {
  const key = CACHE.pairStats.key(userId, hashFilters({
    species: query.species,
    fatherId: query.fatherId,
    motherId: query.motherId,
    year: query.year,
    month: query.month,
  }));
  return this.cacheService.wrap(key, () => this.buildPairStatsFromDB(userId, query), CACHE.pairStats.ttl);
}
```

---

### 5.8 분양 통계 (`GET /v1/statistics/adoptions`)

**특성**: 8+ 테이블 집계 (수익, 성별, 모프, 고객 분석 등). 분양 완료 시에만 변경.

```ts
// 키: adopt-stats:{userId}:{hash8}
// TTL: 30일
// 무효화: 분양 완료(completeAdoption) 시 DEL adopt-stats:{userId}:*

async getAdoptionStatistics(userId: string, query: AdoptionStatisticsDto) {
  const key = CACHE.adoptionStats.key(userId, hashFilters({
    species: query.species,
    year: query.year,
    month: query.month,
  }));
  return this.cacheService.wrap(key, () => this.buildAdoptionStatsFromDB(userId, query), CACHE.adoptionStats.ttl);
}
```

---

### 5.9 분양 정보 (`GET /v1/pet-adoption/:petId`)

**특성**: 개체당 1:1 관계. 분양 상태/가격 변경 시 무효화.

```ts
// 키: pet-adopt:{petId}
// TTL: 30일
// 무효화: PATCH /v1/pet-adoption/:petId 시 DEL

async getPetAdoption(petId: string) {
  return this.cacheService.wrap(
    CACHE.petAdoption.key(petId),
    () => this.petAdoptionRepository.findOne({ where: { petId } }),
    CACHE.petAdoption.ttl,
  );
}
```

---

### 5.10 부모/자식/형제 관계 조회

```ts
// 부모: parents:{petId}        TTL 30일  — 부모 link/unlink 시 무효화
// 자식: children:{petId}:{page} TTL 30일  — 부모 관계 변경 시 무효화
// 형제: siblings:{petId}:{page} TTL 30일  — 부모 관계 변경 시 무효화
// 클러치: clutch:{petId}        TTL 30일  — 산란 변경 시 무효화
```

---

## 6. 무효화 맵

### 6.1 동작 → 삭제할 캐시 키

```
동작 (API)                          │ 삭제할 캐시 키
────────────────────────────────────┼───────────────────────────────────────────
개체 등록 (POST /v1/pet)            │ feed:*
                                    │ my-pets:{userId}:*
                                    │ children:{fatherId}:*  (부모 설정 시)
                                    │ children:{motherId}:*  (부모 설정 시)
────────────────────────────────────┼───────────────────────────────────────────
개체 수정 (PATCH /v1/pet/:id)       │ pet:{petId}
                                    │ feed:*
                                    │ my-pets:{userId}:*
────────────────────────────────────┼───────────────────────────────────────────
개체 삭제 (DELETE /v1/pet/:id)      │ pet:{petId}
                                    │ thumb:{petId}
                                    │ pet-adopt:{petId}
                                    │ feed:*
                                    │ my-pets:{userId}:*
                                    │ ftree:{petId}:*
                                    │ children:{fatherId}:*
                                    │ children:{motherId}:*
────────────────────────────────────┼───────────────────────────────────────────
썸네일 변경 (PUT /v1/pet-image/:id) │ thumb:{petId}
────────────────────────────────────┼───────────────────────────────────────────
부모 연결 (POST /v1/parent-req/:id) │ parents:{petId}
                                    │ ftree:{petId}:*
                                    │ ftree:{parentId}:*
                                    │ children:{parentId}:*
                                    │ siblings:{petId}:*
────────────────────────────────────┼───────────────────────────────────────────
부모 해제 (DELETE /v1/parent-req/:id)│ (부모 연결과 동일)
────────────────────────────────────┼───────────────────────────────────────────
메이팅 등록 (POST /v1/mating)       │ pair-list:{userId}:*
                                    │ pair:{pairId}
                                    │ pair-stats:{userId}:*
────────────────────────────────────┼───────────────────────────────────────────
메이팅 수정 (PATCH /v1/mating/:id)  │ pair-list:{userId}:*
                                    │ pair:{pairId}
                                    │ pair-stats:{userId}:*
────────────────────────────────────┼───────────────────────────────────────────
메이팅 삭제 (DELETE /v1/mating/:id) │ pair-list:{userId}:*
                                    │ pair:{pairId}
                                    │ pair-stats:{userId}:*
────────────────────────────────────┼───────────────────────────────────────────
산란 등록 (POST /v1/layings)        │ pair-list:{userId}:*
                                    │ pair:{pairId}
                                    │ pair-stats:{userId}:*
                                    │ clutch:{petId}  (관련 개체)
────────────────────────────────────┼───────────────────────────────────────────
산란 수정 (PATCH /v1/layings/:id)   │ (산란 등록과 동일)
────────────────────────────────────┼───────────────────────────────────────────
산란 삭제 (DELETE /v1/layings/:id)  │ (산란 등록과 동일)
────────────────────────────────────┼───────────────────────────────────────────
해칭 완료 (POST /v1/pet/:id/hatch) │ pair-list:{userId}:*
                                    │ pair:{pairId}
                                    │ pair-stats:{userId}:*
                                    │ feed:*
                                    │ my-pets:{userId}:*
────────────────────────────────────┼───────────────────────────────────────────
분양 상태 변경                       │ pet-adopt:{petId}
(PATCH /v1/pet-adoption/:petId)     │ feed:*  (목록에 상태 반영)
────────────────────────────────────┼───────────────────────────────────────────
분양 완료                            │ adopt-stats:{userId}:*
(POST /v1/adoption-history/:petId)  │ pet-adopt:{petId}
                                    │ feed:*
────────────────────────────────────┼───────────────────────────────────────────
프로필 수정                          │ profile:{name}
(PATCH /v1/user/private-info)       │
```

### 6.2 무효화 그룹 (서비스에서 재사용)

반복되는 무효화 조합을 그룹으로 정의한다.

```ts
// apps/server/src/common/cache-invalidation.ts

export class CacheInvalidation {
  constructor(private cacheService: CacheService) {}

  /** 개체 데이터 변경 시 — 목록 캐시 플러시 */
  async onPetChanged(petId: string, userId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.pet.key(petId)),
      this.cacheService.delByPattern(CACHE.feed.pattern),
      this.cacheService.delByPattern(CACHE.myPets.pattern(userId)),
    ]);
  }

  /** 브리딩 이벤트 (메이팅/산란/해칭) 변경 시 */
  async onBreedingChanged(userId: string, pairId: string) {
    await Promise.all([
      this.cacheService.delByPattern(CACHE.pairList.pattern(userId)),
      this.cacheService.del(CACHE.pairDetail.key(pairId)),
      this.cacheService.delByPattern(CACHE.pairStats.pattern(userId)),
    ]);
  }

  /** 부모 관계 변경 시 */
  async onParentChanged(petId: string, parentId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.parents.key(petId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(petId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(parentId)),
      this.cacheService.delByPattern(CACHE.children.pattern(parentId)),
      this.cacheService.delByPattern(CACHE.siblings.pattern(petId)),
    ]);
  }

  /** 분양 완료 시 */
  async onAdoptionCompleted(petId: string, userId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.petAdoption.key(petId)),
      this.cacheService.delByPattern(CACHE.adoptionStats.pattern(userId)),
      this.cacheService.delByPattern(CACHE.feed.pattern),
    ]);
  }
}
```

---

## 7. 구현 유틸리티

### 7.1 캐시 키 정의 (`cache-keys.ts`)

```ts
// apps/server/src/common/cache-keys.ts

/** 기본 TTL: 30일 (안전망 — 수동 무효화가 주 전략) */
const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000;

/** 목록 TTL: 3분 (패턴 무효화 누락 대비) */
const LIST_TTL = 3 * 60 * 1000;

export const CACHE = {
  // ── 1:1 매핑 (30일 TTL + 수동 무효화) ──
  pet: {
    key: (petId: string) => `pet:${petId}`,
    ttl: DEFAULT_TTL,
  },
  thumbnail: {
    key: (petId: string) => `thumb:${petId}`,
    ttl: DEFAULT_TTL,
  },
  familyTree: {
    key: (petId: string, depth = 5, ancestorDepth = 2) =>
      `ftree:${petId}:${depth}:${ancestorDepth}`,
    pattern: (petId: string) => `ftree:${petId}:*`,
    ttl: DEFAULT_TTL,
  },
  pairDetail: {
    key: (pairId: string) => `pair:${pairId}`,
    ttl: DEFAULT_TTL,
  },
  pairStats: {
    key: (userId: string, filterHash: string) => `pair-stats:${userId}:${filterHash}`,
    pattern: (userId: string) => `pair-stats:${userId}:*`,
    ttl: DEFAULT_TTL,
  },
  adoptionStats: {
    key: (userId: string, filterHash: string) => `adopt-stats:${userId}:${filterHash}`,
    pattern: (userId: string) => `adopt-stats:${userId}:*`,
    ttl: DEFAULT_TTL,
  },
  petAdoption: {
    key: (petId: string) => `pet-adopt:${petId}`,
    ttl: DEFAULT_TTL,
  },
  parents: {
    key: (petId: string) => `parents:${petId}`,
    ttl: DEFAULT_TTL,
  },
  profile: {
    key: (name: string) => `profile:${name}`,
    ttl: DEFAULT_TTL,
  },
  children: {
    key: (petId: string, page: number) => `children:${petId}:${page}`,
    pattern: (petId: string) => `children:${petId}:*`,
    ttl: DEFAULT_TTL,
  },
  siblings: {
    key: (petId: string, page: number) => `siblings:${petId}:${page}`,
    pattern: (petId: string) => `siblings:${petId}:*`,
    ttl: DEFAULT_TTL,
  },
  clutchMates: {
    key: (petId: string) => `clutch:${petId}`,
    ttl: DEFAULT_TTL,
  },

  // ── 조합/목록 (3분 TTL + 패턴 무효화) ──
  feed: {
    key: (filterHash: string) => `feed:${filterHash}`,
    pattern: 'feed:*',
    ttl: LIST_TTL,
  },
  myPets: {
    key: (userId: string, filterHash: string) => `my-pets:${userId}:${filterHash}`,
    pattern: (userId: string) => `my-pets:${userId}:*`,
    ttl: LIST_TTL,
  },
  pairList: {
    key: (userId: string, filterHash: string) => `pair-list:${userId}:${filterHash}`,
    pattern: (userId: string) => `pair-list:${userId}:*`,
    ttl: LIST_TTL,
  },
} as const;
```

### 7.2 캐시 서비스 (`cache.service.ts`)

```ts
// apps/server/src/common/cache.service.ts

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

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

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  /**
   * 캐시에 있으면 반환, 없으면 fallback 실행 후 캐시에 저장.
   * - Singleflight로 동시 요청 보호 (cache stampede 방지)
   * - null 결과도 짧은 TTL로 캐싱 (cache penetration 방지)
   */
  async wrap<T>(key: string, fallback: () => Promise<T>, ttl: number): Promise<T> {
    // 1. 캐시 조회
    try {
      const cached = await this.cache.get<T | string>(key);
      if (cached === NULL_SENTINEL) return null as T;
      if (cached !== undefined && cached !== null) return cached as T;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key=${key}`, err);
    }

    // 2. Singleflight: 이미 같은 키로 DB 호출 중이면 그 결과를 기다림
    const inflight = this.inflightMap.get(key);
    if (inflight) return inflight;

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
  async get<T>(key: string): Promise<T | null> { /* ... */ }

  /** 단일 키 저장 */
  async set<T>(key: string, value: T, ttl: number): Promise<void> { /* ... */ }

  /** 단일 키 삭제 */
  async del(key: string): Promise<void> { /* ... */ }

  /** 패턴으로 일괄 삭제 — SCAN 기반 (비블로킹) */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const client = (this.cache as any).store.client;
      let cursor = 0;
      do {
        const result = await client.scan(cursor, { MATCH: pattern, COUNT: SCAN_COUNT });
        cursor = result.cursor;
        if (result.keys.length > 0) await client.del(result.keys);
      } while (cursor !== 0);
    } catch (err) {
      this.logger.warn(`Cache DEL pattern failed for pattern=${pattern}`, err);
    }
  }

  private async fetchAndCache<T>(key: string, fallback: () => Promise<T>, ttl: number): Promise<T> {
    const fresh = await fallback();
    try {
      if (fresh === undefined || fresh === null) {
        await this.cache.set(key, NULL_SENTINEL, NULL_TTL); // penetration 방지
      } else {
        await this.cache.set(key, fresh, ttl);
      }
    } catch (err) {
      this.logger.warn(`Cache SET failed for key=${key}`, err);
    }
    return fresh;
  }
}
```

### 7.3 필터 해시 유틸 (`hash-filters.ts`)

```ts
// apps/server/src/common/hash-filters.ts

import { createHash } from 'crypto';

/**
 * 필터 객체를 짧은 해시 문자열로 변환.
 * 목록/통계 API의 캐시 키에 사용.
 *
 * @example
 * hashFilters({ filterType: 'ALL', page: 1, keyword: '' }) // → "a3f2b1c4"
 */
export function hashFilters(filters: Record<string, any>): string {
  const sorted = JSON.stringify(filters, Object.keys(filters).sort());
  return createHash('md5').update(sorted).digest('hex').slice(0, 8);
}
```

---

## 8. 구현 순서

### Phase 1: 인프라 (1일)
1. Redis 패키지 설치 + Docker Compose에 Redis 추가
2. `AppModule`에 `CacheModule` 등록
3. `CacheService`, `cache-keys.ts`, `hash-filters.ts` 생성
4. `CacheInvalidation` 서비스 생성

### Phase 2: 고효율 대상 (2~3일)
가장 효과가 크고 무효화가 단순한 것부터 적용.

| 순서 | API | 이유 |
|------|-----|------|
| 1 | 썸네일 (`thumb:`) | 호출량 최다, 변경 거의 없음, 무효화 단순 |
| 2 | 가계도 (`ftree:`) | CTE 쿼리 무거움, 변경 드묾 |
| 3 | 부모 조회 (`parents:`) | 호출 빈번, 변경 드묾 |
| 4 | 개체 상세 (`pet:`) | 호출 빈번, 무효화 1:1 명확 |

### Phase 3: 통계/집계 (2~3일)
계산 비용이 높은 집계 API.

| 순서 | API | 이유 |
|------|-----|------|
| 5 | 페어 통계 (`pair-stats:`) | 4단계 파이프라인, 계산 무거움 |
| 6 | 분양 통계 (`adopt-stats:`) | 8+ 테이블 집계 |
| 7 | 페어 상세 (`pair:`) | 중첩 구조 조회 비용 |
| 8 | 분양 정보 (`pet-adopt:`) | 1:1, 단순 |

### Phase 4: 목록 캐시 (2~3일)
필터 해시 + 패턴 무효화가 필요한 목록.

| 순서 | API | 이유 |
|------|-----|------|
| 9 | 피드 (`feed:`) | 호출량 최다이지만 무효화 복잡 |
| 10 | 내 개체 (`my-pets:`) | 사용자별 격리 필요 |
| 11 | 페어 목록 (`pair-list:`) | 필터 조합 다양 |
| 12 | 자식/형제/클러치 | 보조 기능, 우선도 낮음 |

### Phase 5: 모니터링 + 튜닝 (1일)
- Redis `INFO` 명령으로 메모리 사용량 확인
- HIT/MISS 비율 로깅
- TTL 조정 (데이터 기반)

---

## 9. 모니터링

### Redis CLI 명령어

```bash
# 실시간 모든 명령 모니터링
redis-cli monitor

# 메모리 사용량
redis-cli info memory

# 키 개수
redis-cli dbsize

# 특정 패턴의 키 목록
redis-cli keys "feed:*"
redis-cli keys "thumb:*"

# 특정 키의 남은 TTL 확인 (초 단위)
redis-cli ttl "pet:abc-123"
```

### 로깅 (CacheService에 내장)

```
[CacheService] WARN Cache GET failed for key=pet:abc — Redis 장애 시 자동 로깅
```

필요시 HIT/MISS 카운터를 추가하여 Prometheus 등으로 수집 가능.

---

## 10. 클라이언트 캐시와의 시너지

### 현재 클라이언트 캐시 설정 (React Query)

| 데이터 | staleTime | gcTime | 비고 |
|--------|-----------|--------|------|
| 썸네일 | Infinity | Infinity | 수동 invalidate |
| 가계도 | 5분 | 기본값 | |
| 페어 통계 | 5분 | 기본값 | |
| 검색 (외부) | 30초 | 기본값 | |
| 피드/목록 | 0 (즉시 stale) | 기본값 | |

### 이중 캐시 시나리오

```
1. 사용자 A가 피드 조회 (최초)
   Browser → [L1 MISS] → NestJS → [L2 MISS] → MySQL → L2 저장 → L1 저장 → 응답

2. 사용자 A가 같은 페이지 재조회 (30초 후, staleTime=0)
   Browser → [L1 stale → background refetch] → NestJS → [L2 HIT] → 응답 (MySQL 안 감)

3. 사용자 B가 같은 피드 조회
   Browser → [L1 MISS (B의 첫 방문)] → NestJS → [L2 HIT] → 응답 (MySQL 안 감)

4. 누군가 개체 등록
   NestJS → MySQL INSERT → DEL feed:* (L2 무효화)
   → 클라이언트는 React Query invalidateQueries로 L1도 무효화
```

### 권장 클라이언트 staleTime 조정

서버 캐시 도입 후, API 호출 자체가 빨라지므로 (Redis HIT ≈ 2ms) 클라이언트 staleTime을 줄여도 성능 영향이 작다.

| 데이터 | 현재 | 서버 캐시 도입 후 권장 | 이유 |
|--------|------|----------------------|------|
| 썸네일 | Infinity | Infinity (유지) | 변경 시 수동 무효화로 충분 |
| 가계도 | 5분 | 5분 (유지) | 서버 TTL 30일 + 클라이언트 5분 = 적정 |
| 피드 | 0 | 0 (유지) | 서버에서 3분 캐시하므로 부하 없음 |
| 개체 상세 | 0 | 1분 | 서버 캐시가 있으므로 불필요한 refetch 줄임 |

---

## 11. Redis 장애 대응

### 설계 원칙: Redis는 캐시일 뿐, 장애 시 DB로 직접 조회

`CacheService.wrap()`에 이미 try-catch가 내장되어 있음:
- Redis GET 실패 → DB 조회 (정상 동작, 느려질 뿐)
- Redis SET 실패 → 로그만 남기고 응답은 정상
- Redis 완전 다운 → 모든 요청이 DB 직접 조회 (캐시 도입 전과 동일)

```
Redis 정상:  요청 → Redis HIT → 응답 (2ms)
Redis 장애:  요청 → Redis 타임아웃 → DB 조회 → 응답 (50ms)
             ↑ 서비스 중단 없음, 성능만 저하
```

---

## 12. 보호 메커니즘

### 12.1 Cache Stampede 방지 (Singleflight)

캐시 만료/무효화 직후 동일 키에 동시 요청이 몰리면 모두 DB를 직접 조회하는 문제 (thundering herd).

```
[문제] ftree:abc 만료 → 동시 50명 조회 → CTE 쿼리 50회 실행 → DB 과부하
[해결] Singleflight → 첫 번째 요청만 DB 조회, 나머지 49개는 같은 Promise를 기다림
```

**구현**: `CacheService.inflightMap` — 인메모리 `Map<string, Promise>`

```ts
// wrap() 내부
const inflight = this.inflightMap.get(key);
if (inflight) return inflight;  // 이미 DB 호출 중 → 기다림

const promise = this.fetchAndCache(key, fallback, ttl);
this.inflightMap.set(key, promise);
try { return await promise; }
finally { this.inflightMap.delete(key); }
```

- 단일 프로세스 내에서만 작동 (multi-instance 환경에서는 Redis distributed lock 필요 — 현재 단일 인스턴스이므로 충분)
- DB 호출이 실패해도 `finally`에서 맵 정리 → 다음 요청이 재시도

### 12.2 Cache Penetration 방지 (Null 캐싱)

존재하지 않는 키로 반복 조회하면 매번 DB를 히트하는 문제.

```
[문제] 삭제된 petId → pet:abc MISS → DB 조회 → null → 캐시 안 함 → 반복
[해결] null 결과도 sentinel 값으로 30초간 캐싱
```

**구현**: `NULL_SENTINEL = '__NULL__'` + `NULL_TTL = 30초`

```ts
// 저장: null이면 sentinel 저장
if (fresh === null) await this.cache.set(key, '__NULL__', 30_000);

// 조회: sentinel이면 null 반환
if (cached === '__NULL__') return null;
```

- TTL을 30초로 짧게 유지 → 실제 데이터가 생성되면 자연 만료 후 정상 캐싱
- 대량의 랜덤 키 공격(cache avalanche)에 대해서는 별도 rate limiting 필요

### 12.3 SCAN 기반 패턴 삭제

`KEYS` 명령은 O(N)으로 Redis를 블로킹함. `SCAN` 커서 기반으로 교체하여 비블로킹 점진적 삭제.

```ts
// KEYS (블로킹) — 사용하지 않음
const keys = await client.keys('feed:*');  // 키 10만개 → 수백ms 블로킹

// SCAN (비블로킹) — 현재 구현
let cursor = 0;
do {
  const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
  cursor = result.cursor;
  if (result.keys.length > 0) await client.del(result.keys);
} while (cursor !== 0);
```

- `COUNT: 100` — 한 번에 100개씩 스캔 (Redis 이벤트 루프 양보)
- 삭제 중 새 키가 생길 수 있지만, 캐시이므로 일부 누락은 허용 가능

### 12.4 Redis 메모리 관리

Docker Compose에 메모리 정책 설정:

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

| 설정 | 값 | 설명 |
|------|-----|------|
| `maxmemory` | 256mb | 캐시 전용이므로 보수적 설정 (필요 시 상향) |
| `maxmemory-policy` | `allkeys-lru` | 메모리 가득 차면 가장 오래 안 쓴 키 자동 제거 |

- OOM 크래시 방지 — 메모리 한도 도달 시 자동 eviction
- 캐시 전용이므로 `allkeys-lru`가 적합 (모든 키가 eviction 대상)
- `volatile-lru`(TTL 있는 키만 제거)와 달리, TTL 없는 키가 혹시 생겨도 안전

---

## 13. 주의사항

### 직렬화
- `cache-manager`는 기본적으로 JSON 직렬화를 사용
- `Date` 객체는 문자열로 저장됨 → 클라이언트에서 이미 문자열로 처리하므로 문제없음
- `BigInt`, `Buffer` 등 비직렬화 타입이 있으면 별도 처리 필요

### 캐시 키 충돌
- 모든 키가 `{도메인}:` 접두사를 가지므로 충돌 가능성 없음
- 같은 Redis 인스턴스를 다른 서비스와 공유할 경우 전역 접두사 추가 고려 (`daepa:pet:abc`)
