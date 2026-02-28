# API 클라이언트 타입 및 프로젝트 설정

---

## 1. orval 자동 생성 API 클라이언트 타입

### 파일 (모두 신규)
`packages/api-client/src/model/` 경로:

| 파일 | 설명 |
|------|------|
| `familyTreeNodeDto.ts` | 가계도 노드 DTO (48줄) |
| `familyTreeNodeDtoDepth.ts` | depth 필드 타입 (13줄) |
| `familyTreeNodeDtoFatherId.ts` | fatherId 필드 타입 (13줄) |
| `familyTreeNodeDtoMotherId.ts` | motherId 필드 타입 (13줄) |
| `getFamilyTreeResponseDto.ts` | 가계도 응답 DTO (15줄) |
| `getFamilyTreeResponseDtoNodesItem.ts` | 응답 nodes 아이템 유니온 타입 (11줄) |
| `pairSummaryDto.ts` | 페어 요약 통계 DTO (20줄) |
| `petControllerGetFamilyTreeParams.ts` | 가계도 쿼리 파라미터 (18줄) |
| `statisticsControllerGetPairSummaryParams.ts` | 페어 요약 쿼리 파라미터 (12줄) |

### 타입 주의사항
- `FamilyTreeNodeDtoFatherId`가 `{ [key: string]: unknown } | null`로 생성됨 (기대: `string | null`)
- 클라이언트에서 `select` 변환으로 보정:
  ```ts
  select: (data) => ({
    nodes: data.nodes as unknown as FamilyTreeApiNodeOrHidden[],
    centerPairPartnerIds: (data.centerPairPartnerIds ?? []) as string[],
  })
  ```

### API 함수 (api/index.ts +144줄)
| 함수 | 엔드포인트 |
|------|-----------|
| `petControllerGetFamilyTree(petId, params)` | `GET /api/v1/pet/family-tree/:petId` |
| `statisticsControllerGetPairSummary(params)` | `GET /api/v1/statistics/pair-summary` |

### model/index.ts (+8줄)
8개의 새 모델 타입 re-export 추가.

---

## 2. CLAUDE.md (168줄, 신규)

프로젝트 루트에 생성. Claude Code 어시스턴트를 위한 프로젝트 컨텍스트 문서.

### 포함 내용
- 프로젝트 구조 (apps/client, apps/server, packages/api-client)
- 가계도 기능 핵심 파일/데이터 소스/엣지 ID 규칙/스토어 동작
- 백엔드 `pet_relations` 테이블 구조
- 주요 API 엔드포인트 목록
- 모달/폼 컴포넌트 사용법 (CreateMatingForm, CreateLayingModal, ParentLink)
- overlay-kit 패턴
- Query 무효화 키
- ForceGraph 렌더링 구조 (노드/엣지 색상, 비공개 노드 처리)
- PairStatisticsPanel props

---

## 3. pnpm-lock.yaml (+39줄)

d3 패키지 3개 + TypeScript 타입 3개 추가에 따른 lock 파일 업데이트.

---

## 전체 변경 통계

| 카테고리 | 파일 수 | 추가 줄 | 삭제 줄 |
|----------|---------|---------|---------|
| 서버 API | 6 | ~520 | ~20 |
| 클라이언트 코어 (page, store, hooks, lib) | 10 | ~1,328 | 0 |
| 클라이언트 컴포넌트 | 10 | ~4,462 | 0 |
| 해칭 개선 | 13 | ~200 | ~150 |
| 공통 컴포넌트 확장 | 6 | ~130 | ~40 |
| API 클라이언트 타입 | 11 | ~317 | 0 |
| 프로젝트 설정 | 3 | ~213 | 0 |
| **합계** | **59** | **~7,170** | **~210** |
