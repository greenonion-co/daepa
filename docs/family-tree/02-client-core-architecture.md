# 클라이언트 가계도 — 코어 아키텍처

## 개요
`apps/client/src/app/(브리더스룸)/pet/[petId]/family-tree/` 경로에 가계도 기능 전체를 구현.

## 파일 구조
```
family-tree/
├── page.tsx                          # Next.js 라우트 엔트리포인트
├── store/
│   └── familyTreeStore.ts            # Zustand 전역 상태
├── hooks/
│   ├── useFamilyTreeData.ts          # 데이터 fetching 훅
│   ├── useCoiCalculation.ts          # COI 계산 훅
│   └── usePairStatistics.ts          # 페어 통계 훅
├── lib/
│   ├── types.ts                      # 타입 정의
│   ├── coi.ts                        # COI 계산 엔진
│   ├── genetics.ts                   # 유전 예측 엔진
│   └── graph-utils.ts                # 그래프 유틸리티
├── components/
│   ├── FamilyTreeCanvas.tsx           # 메인 컨테이너 (1,171줄)
│   ├── ForceGraph.tsx                 # d3-force SVG 렌더링 (1,097줄)
│   ├── CoiPanel.tsx                   # COI 정보 패널
│   ├── PetDetailPanel.tsx             # 개체 상세 패널
│   ├── PairStatisticsPanel.tsx        # 페어 통계 패널
│   ├── PairDetailContent.tsx          # 페어 상세 다이얼로그
│   ├── OffspringPredictionPanel.tsx   # 유전 예측 패널
│   ├── MorphLegend.tsx                # 모프 색상 범례
│   ├── NodeContextMenu.tsx            # 우클릭 메뉴
│   └── QuickRegisterModal.tsx         # 빠른 개체 등록 모달
└── FORCE_GRAPH_LAYOUT.md             # 레이아웃 규칙 문서
```

---

## page.tsx (39줄, 신규)

- `"use client"` 컴포넌트
- `use(params)`로 `petId` 추출 (Next.js 14 비동기 params 패턴)
- 상단 헤더: 뒤로가기(`/pet/${petId}`) + 안내 텍스트 ("처음 부모+2세대 표시 - 클릭으로 확장 가능")
- 본문: `<FamilyTreeCanvas petId={petId} />` 렌더링
- 높이: `h-[calc(100dvh-52px)]` (상단 네비 52px 제외)

---

## familyTreeStore.ts (244줄, 신규)

Zustand 기반 가계도 전역 상태 관리.

### 주요 상태
| 상태 | 타입 | 설명 |
|------|------|------|
| `nodesMap` | `Map<string, FamilyTreeNodeData>` | petId → 노드 데이터 |
| `edgesMap` | `Map<string, FamilyEdge>` | 엣지 ID → 엣지 데이터 |
| `expandedNodeIds` | `Set<string>` | 확장 fetch 완료 노드 |
| `centerPetId` | `string` | 중심 개체 ID |

### 주요 액션
| 액션 | 설명 |
|------|------|
| `setFamilyTree(petId, nodes, centerPairPartnerIds)` | 최초 API 응답으로 전체 초기화 |
| `mergeTree(petId, nodes, centerPairPartnerIds)` | 노드 클릭 시 확장 데이터 병합 |
| `updateNodePet(petId, pet)` | 모달 닫힐 때 단일 노드 갱신 |
| `addPairEdge(petIdA, petIdB)` | 페어 엣지 수동 추가 |
| `removePairEdge(petIdA, petIdB)` | 페어 엣지 수동 삭제 |
| `getGenerationMap()` | BFS로 세대 맵 계산 |

### 엣지 ID 규칙
- **pair 엣지**: `pair-{min(id1,id2)}-{max(id1,id2)}` (같은 세대)
- **offspring 엣지**: `offspring-{parentId}-{childId}` (부모→자식)

### 비공개 노드 처리
- `isHiddenNode(node)` 판별 → `pet: null, isHidden: true`로 저장
- `fatherId: null, motherId: null`로 설정 (엣지 생성 시 skip)

### 핵심 내부 함수
- `buildEdgesMap(nodes)` — fatherId/motherId 기반으로 offspring + pair 엣지 생성. 양쪽 끝점이 모두 노드에 존재하는 경우만 생성
- `computeGenerationMap(nodesMap, edgesMap, centerPetId)` — BFS로 세대 번호 할당

---

## FamilyTreeCanvas.tsx (1,171줄, 신규)

가계도 기능의 메인 컨테이너. 모든 하위 컴포넌트, 훅, 스토어를 조합.

### Props
```ts
interface FamilyTreeCanvasProps {
  petId: string;
}
```

### 사용하는 훅
- `useFamilyTreeStore` (Zustand)
- `useFamilyTree` / `useCenterPet` — 데이터 fetching
- `useCoiCalculation` — COI 계산
- `usePairStatistics` — 페어 통계
- `usePairInvalidate` — 쿼리 무효화

### 연결하는 컴포넌트
- `ForceGraph` — d3 그래프 렌더링
- `PetDetailPanel` — 개체 상세 (좌측)
- `CoiPanel` — COI 정보 (좌측 하단)
- `OffspringPredictionPanel` — 유전 예측
- `PairStatisticsPanel` — 페어 통계 (우측)
- `MorphLegend` — 모프 범례
- `NodeContextMenu` — 우클릭 메뉴
- `QuickRegisterModal` — 빠른 등록 모달
- `PairDetailContent` — 페어 상세 다이얼로그
- `CreateLayingModal` — 산란 생성
- `PetDetailModal` — 개체 상세 모달

### 주요 핸들러
- `handleNodeClick` — 노드 확장 (API fetch) 또는 COI 선택
- `handleNodeDoubleClick` — COI 두 번째 개체 선택 (같은 개체 방지)
- `handleSelectMate` — 메이팅 개체 선택 → 메이팅 생성 → `addPairEdge`
- `handleContextMenuAction` — 상세보기, 관계도, 가계도 이동

### 데이터 흐름
1. `useFamilyTree(petId)` → API 응답
2. `setFamilyTree(petId, nodes, centerPairPartnerIds)` → 스토어 초기화
3. `nodesMap` / `edgesMap` → `GraphNode[]` / `GraphLink[]` 변환
4. `<ForceGraph nodes={graphNodes} links={graphLinks} />` 렌더링
5. 노드 클릭 → `mergeTree` → 그래프 확장
