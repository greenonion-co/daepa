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
1. pairs 테이블에서 양방향 조회 (`ownerId` 무관)
2. 페어 없으면 모든 값 0인 빈 결과 반환
3. 메이팅 → 산란 → 알/펫 정보 순차 조회
4. `buildEggStatistics` + `buildDistribution`으로 통계 계산

#### 기존 버그 수정 (`findPairIds`)
- **기존**: `pair.fatherId = :fatherId AND pair.motherId = :motherId` (단방향)
- **변경**: `(fatherId AND motherId) OR (motherId AND fatherId)` (양방향)
- 부/모가 뒤바뀌어 저장된 경우에도 정확히 조회
