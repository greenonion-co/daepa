# 서버 API 변경 사항

## 1. Family Tree API

### 엔드포인트
```
GET /v1/pet/family-tree/:petId?depth=N&ancestorDepth=M
```

### 파일
| 파일 | 변경 |
|------|------|
| `apps/server/src/pet/pet.controller.ts` | 엔드포인트 등록 (+31줄) |
| `apps/server/src/pet_relation/pet_relation.dto.ts` | DTO 3개 추가 (+101줄) |
| `apps/server/src/pet_relation/pet_relation.service.ts` | `getFamilyTree()` 메서드 추가 (+217줄) |

### 상세

#### Controller
- `@Public()` + `@UseGuards(OptionalJwtAuthGuard)` — 비로그인도 조회 가능, 로그인 시 소유권 기반 프라이버시 처리
- 쿼리 파라미터:
  - `depth` (후손 탐색 깊이, 기본 5, 최대 7)
  - `ancestorDepth` (조상 탐색 깊이, 기본 2, 최대 5)
- `Math.min`으로 상한값 제한

#### DTO
- **`FamilyTreeNodeDto`** — petId, fatherId, motherId, depth, name, sex, morphs, traits, species, hatchingDate, type, isPublic, isOwner, ownerName
- **`GetFamilyTreeResponseDto`** — `nodes: (FamilyTreeNodeDto | PetHiddenStatusDto)[]` + `centerPairPartnerIds: string[]`
- **`GetFamilyTreeQueryDto`** — depth, ancestorDepth (`@Transform`으로 Number 변환)

#### Service (`getFamilyTree`)
Recursive CTE SQL 쿼리로 4개의 CTE를 조합:

1. **`ancestor_cte`** — 중심 펫의 조상을 `maxAncestorDepth`만큼 재귀 탐색
2. **`descendant_cte`** — 중심 펫의 후손을 `maxDepth`만큼 재귀 탐색
3. **`deduped_ancestors` / `deduped`** — 중복 제거 (가장 얕은 depth 유지)
4. **`all_ids`** — 루트 + 후손 + 공동 부모 + pairs 테이블 기반 파트너 + 조상 통합

최종 SELECT에서 `pets`, `pet_relations`, `pet_details`, `users` 테이블을 JOIN하여 필요한 정보 조회.

**프라이버시 처리**: `isPublic === false`이고 요청 사용자 소유가 아닌 경우 `PetHiddenStatusDto`(petId + hiddenStatus만)로 반환.

**파트너 ID**: `pairs` 테이블에서 중심 펫의 파트너 ID를 별도 쿼리로 조회하여 `centerPairPartnerIds`로 반환.

---

## 2. Pair Summary API

### 엔드포인트
```
GET /v1/statistics/pair-summary?fatherId=...&motherId=...
```

### 파일
| 파일 | 변경 |
|------|------|
| `apps/server/src/statistics/statistics.controller.ts` | 엔드포인트 등록 (+20줄) |
| `apps/server/src/statistics/statistics.dto.ts` | `PairSummaryDto` 추가 (+20줄) |
| `apps/server/src/statistics/statistics.service.ts` | `getPairSummary()` 메서드 추가 (+131줄) |

### 상세

#### Controller
- `fatherId`, `motherId` 둘 다 필수 (없으면 `BadRequestException`)
- 인증 필요 (`@Public()` 없음)

#### DTO (`PairSummaryDto`)
- `totalMatings: number` — 총 메이팅 횟수
- `totalLayings: number` — 총 산란 횟수
- `egg: EggStatisticsDto` — 알 통계 (total, fertilized, unfertilized, hatched, dead, pending, fertilizedRate, hatchingRate)
- `morphs: DistributionItemDto[]` — 모프 분포

#### Service (`getPairSummary`)
1. pairs 테이블에서 단방향 조회 (`ownerId` 무관, 저장 시 성별 정규화 보장)
2. 페어 없으면 모든 값 0인 빈 결과 반환
3. 메이팅 → 산란 → 알/펫 정보 순차 조회
4. `buildEggStatistics` + `buildDistribution`으로 통계 계산

---

## 3. 인덱스 최적화

### 파일
| 파일 | 변경 |
|------|------|
| `apps/server/src/pet_relation/pet_relation.entity.ts` | `IDX_MOTHER_ID` 인덱스 추가 (+1줄) |

### 상세

#### 문제
`pet_relations` 테이블의 기존 복합 인덱스 `IDX_FATHER_MOTHER(fatherId, motherId)`는 MySQL의 leftmost prefix 규칙에 의해 `motherId` 단독 조건에서 사용 불가. `WHERE mother_id = ?` 또는 `WHERE father_id = ? OR mother_id = ?`의 OR 우측이 풀스캔.

#### 영향 받는 쿼리
- `getFamilyTree()` — descendant CTE의 `WHERE father_id = ? OR mother_id = ?`
- `getChildrenWithDetails()` — `WHERE pr.father_id = :petId OR pr.mother_id = :petId`
- `getAdoptionStatistics()` — `WHERE petRelation.motherId = :motherId` (motherId만 필터 시)

#### 해결
```ts
@Index('IDX_MOTHER_ID', ['motherId'])
```
`motherId` 단독 인덱스 추가. 기존 `IDX_FATHER_MOTHER` 복합 인덱스는 유지하여 `fatherId` 단독 및 `(fatherId, motherId)` 복합 조회는 기존대로 동작.

---

## 4. 페어 저장 시 성별 정규화

### 파일
| 파일 | 변경 |
|------|------|
| `apps/server/src/mating/mating.service.ts` | `normalizeParentIds()` 헬퍼 추가, `saveMating`/`updateMating`에서 호출 |
| `apps/server/src/statistics/statistics.service.ts` | `getPairSummary` 양방향 → 단방향 전환 |
| `apps/client/.../hooks/usePairStatistics.ts` | `Promise.all` 2중 호출 → 단일 호출 |
| `apps/client/.../hooks/usePairActions.tsx` | `Promise.all` 2중 호출 → 단일 호출 (2곳) |
| `apps/client/.../components/PairDetailContent.tsx` | `Promise.all` 2중 호출 → 단일 호출 |

### 상세

#### 문제
`pairs` 테이블에 fatherId/motherId가 성별과 무관하게 저장될 수 있어 조회 시 양방향(`OR` 조건 또는 `Promise.all` 2중 호출)이 필요했음.

#### 해결
1. **저장 시 정규화**: `MatingService.normalizeParentIds()`가 `pet_details.sex`를 조회하여 fatherId에 수컷, motherId에 암컷이 오도록 swap
2. **조회 단방향 전환**: 정규화가 보장되므로 `getPairSummary`의 OR 양방향 조회와 클라이언트의 2중 API 호출 제거
