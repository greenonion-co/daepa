# Daepa — Claude Code 참고 메모

## 프로젝트 구조
- `apps/client` — Next.js 14 App Router (pnpm workspace)
- `apps/server` — NestJS (TypeORM + MySQL 8.0)
- `packages/api-client` — orval 자동생성 API 클라이언트 (`@repo/api-client`)
- 주요 앱 경로: `apps/client/src/app/(브리더스룸)/`

## 상세 문서 (작업 전 관련 파일 읽기)
가계도 관련 작업 시 아래 문서를 참조할 것:
| 문서 | 내용 |
|------|------|
| `docs/family-tree/01-server-api.md` | 서버 API (Family Tree CTE) |
| `docs/family-tree/02-client-core-architecture.md` | 클라이언트 코어 (page, store, canvas, 데이터 흐름) |
| `docs/family-tree/03-force-graph.md` | ForceGraph d3-force 시각화 (힘, 노드/엣지 색상, 하이라이트) |
| `docs/family-tree/04-panels-and-modals.md` | 패널/모달 10개 (PetDetail, COI, PairStats, QuickRegister 등) |
| `docs/family-tree/05-libraries.md` | 라이브러리 (types, COI 엔진, 유전 예측, graph-utils, hooks) |
| `docs/family-tree/06-hatching-improvements.md` | 해칭 개선 (usePairInvalidate, PairCard, UX) |
| `docs/family-tree/07-common-extensions.md` | 공통 컴포넌트 확장 (forceCenter, parentSearch, ParentLink) |
| `docs/family-tree/08-api-client-and-setup.md` | API 클라이언트 타입, 의존성, 전체 통계 |

## 가계도 기능
**경로**: `apps/client/src/app/(브리더스룸)/pet/[petId]/breeding-map/`

### 핵심 파일
| 파일 | 역할 |
|------|------|
| `components/FamilyTreeCanvas.tsx` | 메인 컨테이너. 모든 훅/패널 조합 |
| `components/ForceGraph.tsx` | d3-force SVG 그래프. GraphNode/GraphLink 렌더 |
| `store/familyTreeStore.ts` | Zustand. nodesMap, edgesMap (CTE 기반, 전체 한 번에 로드) |
| `hooks/useFamilyTreeData.ts` | useCenterPet, useFamilyTree |
| `lib/coi.ts` | Wright Path Coefficient COI 계산 |
| `lib/graph-utils.ts` | extractCoiPathEdges, FamilyEdge |
| `lib/types.ts` | FamilyTreeNodeData, FamilyPetData, FamilyTreeApiNode, toPetData() |

### 데이터 소스 (현재)
- **Recursive CTE** `GET /v1/pet/family-tree/:petId?depth=5`
  - `pet_relations` 테이블 기반. 루트의 후손 + 공동 부모를 한 번의 SQL로 조회.
  - 서버: `PetRelationService.getFamilyTree()` in `pet_relation.service.ts`
  - `apps/server/src/pet/pet.controller.ts`에 `GET /v1/pet/family-tree/:petId` 등록됨

### 엣지 ID 규칙
- `pair-{minId}-{maxId}` — 부모 쌍 엣지 (같은 세대)
- `offspring-{parentId}-{childId}` — 부모→자식 엣지 (세대+1)

### 스토어 동작 (새 방식)
- `setFamilyTree(petId, nodes: FamilyTreeApiNode[])` — API 응답으로 전체 노드/엣지 초기화
- lazy loading/pairsExpanded 없음 — 전체를 한 번에 로드
- `updateNodePet(petId, pet)` — 모달 닫힐 때 단일 노드 갱신
- 모달 닫힐 때 `queryClient.invalidateQueries(["family-tree", petId])` 로 전체 재로드

### 주요 GraphNode 필드
`id, label, sex, imageUrl, generation, morphs, isPairOfCenter, degree`

## 백엔드 pet_relations 테이블
```
pet_relations: { petId(unique), fatherId: string|null, motherId: string|null }
```
- `@Index('IDX_FATHER_MOTHER', ['fatherId', 'motherId'])`
- 각 펫은 정확히 1개의 row 가짐

## 주요 API 엔드포인트
```
petControllerFindPetByPetId(petId)         → PetDto
petControllerGetParentsByPetId(petId, {statuses: ["approved"]}) → father/mother
petControllerGetChildrenByPetId(petId)     → ChildPetDetailDto[]
statisticsControllerGetPairStatistics({fatherId, motherId}) → ParentStatisticsDto
petImageControllerFindThumbnail(petId)     → {url}
GET /v1/pet/family-tree/:petId?depth=N     → { nodes: FamilyTreeApiNode[] }
```

### orval 미포함 API 직접 호출 방법
```ts
import { AXIOS_INSTANCE } from "@repo/api-client";
const res = await AXIOS_INSTANCE<ResponseType>({ url: "/v1/...", method: "GET", params });
```

## 공통 모달
- `apps/client/src/app/(브리더스룸)/pet/[petId]/components/PetDetailModal.tsx`
  - props: `{ isOpen, pet: PetDto, onClose }`

## 모프 색상
- `apps/client/src/app/(브리더스룸)/hatching/components/Charts/morphColors.ts`
- `getMorphOrTraitColor(morph)` → hex

## React Query staleTime
- family-tree 데이터: 5분 (`staleTime: 5 * 60 * 1000`)
- 썸네일: Infinity
- COI 계산: 10분

## 가계도 연관 모달/폼 컴포넌트

### CreateMatingForm
`apps/client/src/app/(브리더스룸)/hatching/components/CreateMatingForm.tsx`
```ts
props: {
  onClose: () => void;
  onSuccess?: () => void;           // 메이팅 생성 성공 후 콜백
  initialFather?: { petId: string; name?: string | null };
  initialMother?: { petId: string; name?: string | null };
  lockParents?: boolean;            // true이면 부/모 ParentLink editable=false
}
```
- `lockParents && initialFather` → 부 ParentLink `editable={false}`
- `lockParents && initialMother` → 모 ParentLink `editable={false}`

### CreateLayingModal
`apps/client/src/app/(브리더스룸)/hatching/components/CreateLayingModal.tsx`
```ts
props: { isOpen: boolean; onClose: () => void; fatherId?: string; motherId?: string }
```

### ParentLink
`apps/client/src/app/(브리더스룸)/pet/components/ParentLink.tsx`
- `editable={false}` → 선택/삭제 버튼 숨김, UI는 유지
- 부/모 표시: 성별 dot(파란/빨간) + 이름 텍스트 (PetDetailPanel 스타일)
- `parent.owner?.userId`, `parent.owner?.name` — optional chaining 필수 (owner 없는 경우 있음)

## 가계도에서 모달 열기 패턴 (overlay-kit)
```tsx
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

overlay.open(({ isOpen, close }) => (
  <Dialog open={isOpen} onOpenChange={close}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>제목</DialogTitle></DialogHeader>
      <SomeForm onClose={close} onSuccess={handleSuccess} />
    </DialogContent>
  </Dialog>
));
```

## Query 무효화 키 (가계도 관련)
```ts
queryClient.invalidateQueries({ queryKey: [statisticsControllerGetPairStatistics.name] });
queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
```

## PairStatisticsPanel
`apps/client/src/app/(브리더스룸)/pet/[petId]/breeding-map/components/PairStatisticsPanel.tsx`
- `onAddMating` / `onAddLaying` props로 버튼 표시
- 산란+ 버튼: `statistics?.totalMatings > 0` 일 때만 활성화
- `usePairStatistics` hook: `hooks/usePairStatistics.ts` — `statisticsControllerGetPairStatistics` 단일 API 호출

## ForceGraph 렌더링 구조
`components/ForceGraph.tsx` — d3-force 시뮬레이션 + React SVG 렌더링

### GraphNode 주요 필드
```ts
{ id, label, degree, imageUrl?, sex?, isPairOfCenter?, generation?, morphs?, isPrivate? }
```

### 노드 시각 요소 (위에서 아래 순서)
1. **이미지 있는 노드**: `<image>` + `<circle stroke>` (테두리)
2. **이미지 없는 노드**: `<circle fill>` + 선택 링
3. **비공개 노드** (`isPrivate`): 점선 링 (`strokeDasharray="5 3"`) + 좌상단 자물쇠 배지
4. **검색 포커스**: 초록 애니메이션 링 (`highlightFocusedId`)
5. **세대 배지** (`generation`): 우상단 원 배지 "G0", "G1" ...
6. **자물쇠 배지** (`isPrivate`): 좌상단 원 배지 — 세대 배지 반대편
7. **성별 dot + 이름 라벨**: 노드 아래

### 노드 색상 로직 (`getNodeColor`)
- 선택 하이라이트 모드: 선택 노드 blue ring, 나머지 faded
- hover 없음: `getMorphColor` (첫 번째 모프 색상 or 기본 회색)
- hover 있음: hover 노드 amber, 연결 노드 cyan(자식)/fuchsia(페어), 나머지 faded

### 엣지 색상 로직
- COI 경로: amber(`#f59e0b`), 두께 3
- pair 엣지 (같은 세대): purple/violet
- hover 연결: cyan/fuchsia
- 기본: 회색

### 노드 클릭 접근 제어 (`handleNodeClick`)
- **비공개 노드** (`isHidden` 또는 `isPublic === false && !isOwner`): early return (아무 반응 없음)
- **타인 소유 공개 노드** (`!isOwner`): 패널 표시 + "타인의 개체입니다." 토스트, 트리 확장 API 호출 안 함
- **본인 소유 노드**: 패널 표시 + `petControllerGetFamilyTree` 호출로 트리 확장

### 비공개 노드 처리 (`isPrivate: true`)
- `handleContextMenuAction("detail")`: `setDetailModalPetId` 호출 skip → `petControllerFindPetByPetId` 불호출
- `NodeContextMenu`: "개체 상세 보기" 항목 숨김 (`isPrivate` prop)
- `PetDetailPanel`: "비공개 개체" 배지 표시
- `isPrivate` 설정 시점: `FamilyTreeCanvas` graphNodes 빌드 시 `n.pet?.isPublic === false`
- `FamilyPetData.isPublic`: `FamilyTreeApiNode.isPublic`에서 `apiNodeToPetData()`로 전달됨
