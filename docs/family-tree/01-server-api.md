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
- `@Roles(USER_ROLE.BREEDER, USER_ROLE.ADMIN)` + `@UseGuards(RolesGuard)` — 브리더/관리자만 접근 가능
- `@JwtUser()` 필수 인증 — 본인 소유 펫만 조회 가능 (소유권 검증 후 `ForbiddenException`)
- 쿼리 파라미터:
  - `depth` (후손 탐색 깊이, 기본 2, 최대 7)
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

## 2. 인덱스 최적화

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

## 3. 페어 저장 시 성별 정규화

### 파일
| 파일 | 변경 |
|------|------|
| `apps/server/src/mating/mating.service.ts` | `normalizeParentIds()` 헬퍼 추가, `saveMating`/`updateMating`에서 호출 |
| `apps/client/.../hooks/usePairStatistics.ts` | `Promise.all` 2중 호출 → 단일 호출 |
| `apps/client/.../hooks/usePairActions.tsx` | `Promise.all` 2중 호출 → 단일 호출 (2곳) |
| `apps/client/.../components/PairDetailContent.tsx` | `Promise.all` 2중 호출 → 단일 호출 |

### 상세

#### 문제
`pairs` 테이블에 fatherId/motherId가 성별과 무관하게 저장될 수 있어 조회 시 양방향(`OR` 조건 또는 `Promise.all` 2중 호출)이 필요했음.

#### 해결
1. **저장 시 정규화**: `MatingService.normalizeParentIds()`가 `pet_details.sex`를 조회하여 fatherId에 수컷, motherId에 암컷이 오도록 swap
2. **조회 단방향 전환**: 정규화가 보장되므로 OR 양방향 조회와 클라이언트의 2중 API 호출 제거
