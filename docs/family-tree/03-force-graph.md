# ForceGraph — d3-force 시각화 컴포넌트

## 파일
`apps/client/src/app/(브리더스룸)/pet/[petId]/family-tree/components/ForceGraph.tsx` (1,097줄, 신규)

## 개요
d3-force 시뮬레이션 기반 SVG 그래프를 렌더링하는 핵심 시각화 컴포넌트. 노드(개체)와 링크(관계)를 힘 기반 배치로 표시합니다.

## Props
```ts
interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  className?: string;
  selectedNodeIds?: string[];          // COI 선택 노드
  highlightSelected?: boolean;         // 페어 하이라이트 모드
  highlightedEdges?: CoiPathEdge[];    // COI 경로 엣지
  onNodeClick?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
  onCanvasContextMenu?: (position, simPosition?) => void;
  onCanvasClick?: (position, simPosition?) => void;
  focusNodeId?: string | null;         // 검색 포커스 노드
  initialNodePositions?: Record<string, { x: number; y: number }>;
  highlightedChildIds?: string[];      // 자식 하이라이트
}
```

## Exported 타입
```ts
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  degree: number;        // 중심으로부터의 거리
  imageUrl?: string;
  sex?: string;
  isPairOfCenter?: boolean;
  generation?: number;
  morphs?: string[];
  isPrivate?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string;
  target: string;
}
```

## d3-force 시뮬레이션

### 7가지 힘 (Forces)
1. **forceLink** — 엣지 연결 (pair: 거리 100, offspring: 거리 120)
2. **forceManyBody** — 노드 간 반발력 (strength: -400)
3. **forceCenter** — 중앙 정렬
4. **forceCollide** — 노드 겹침 방지 (radius: 50)
5. **forceX** — 수평 정렬 (pair 엣지 기준)
6. **forceY** — 수직 정렬 (세대 기반, generation * 150)
7. **pairAlignForce** (커스텀) — 같은 페어의 노드를 같은 Y좌표로 정렬

### 줌/팬
- `d3-zoom` 사용 (scale: 0.1 ~ 4)
- 마우스 휠 줌, 드래그 팬
- `focusNodeId` 변경 시 해당 노드로 자동 이동 + 줌

## 노드 렌더링 (위→아래 순서)

1. **이미지 노드**: `<image>` + `<circle stroke>` 테두리
2. **비이미지 노드**: `<circle fill>` + 선택 링
3. **비공개 노드** (`isPrivate`): 점선 링 (`strokeDasharray="5 3"`) + 좌상단 자물쇠 배지
4. **검색 포커스**: 초록 애니메이션 링 (`highlightFocusedId`)
5. **세대 배지**: 우상단 원 배지 "G0", "G1"...
6. **성별 dot + 이름 라벨**: 노드 하단

## 노드 색상 로직 (`getNodeColor`)

| 상태 | 색상 |
|------|------|
| 선택 하이라이트 모드 (선택 노드) | 파란 ring |
| 선택 하이라이트 모드 (나머지) | faded |
| hover 없음 | `getMorphColor` (첫 번째 모프 색상 or 기본 회색) |
| hover 있음 (hover 노드) | amber |
| hover 있음 (연결 노드-자식) | cyan |
| hover 있음 (연결 노드-페어) | fuchsia |
| hover 있음 (나머지) | faded |

## 엣지 색상 로직

| 상태 | 색상 | 두께 |
|------|------|------|
| COI 경로 | amber (`#f59e0b`) | 3 |
| pair 엣지 | purple/violet | 2 |
| hover 연결 | cyan/fuchsia | 2 |
| 기본 offspring | 회색 | 1.5 |
| 기본 pair | 회색 점선 | 1 |

## 하이라이트 모드

`highlightSelected && selectedNodes.length === 2` 일 때 활성화:
- 선택된 두 노드 + 이들의 자식 노드만 강조 표시
- 개별 부모→자식 offspring 엣지 숨김
- COI 경로 엣지는 amber로 강조

## 상호작용
- **클릭**: `onNodeClick` (노드 확장/COI 선택)
- **더블클릭**: `onNodeDoubleClick` (COI 두 번째 개체 선택)
- **우클릭**: `onNodeContextMenu` (컨텍스트 메뉴 표시)
- **호버**: `onNodeHover` (연결 노드 하이라이트)
- **캔버스 클릭**: `onCanvasClick` (선택 해제)
