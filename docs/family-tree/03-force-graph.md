# ForceGraph — d3-force 시각화 컴포넌트

## 파일 구조

원래 1,097줄의 단일 파일에서 7개 파일로 분리하여 ~250줄로 축소.

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| `components/ForceGraph.tsx` | 메인 컴포넌트 (SVG 컨테이너, styleCtx, 렌더링) | ~250 |
| `components/GraphNodeElement.tsx` | SVG 노드 렌더링 (React.memo) | ~220 |
| `components/GraphEdge.tsx` | SVG 엣지 렌더링 (React.memo) | ~65 |
| `hooks/useForceSimulation.ts` | d3-force 시뮬레이션 생명주기 + rAF 배칭 | ~180 |
| `hooks/useForceInteraction.ts` | 줌/팬, 포커스, 드래그, 클릭, hover | ~190 |
| `lib/force-graph-constants.ts` | 상수 (색상, 크기, 시뮬레이션 파라미터) | ~65 |
| `lib/force-graph-utils.ts` | 유틸리티 + StyleContext + 스타일 순수함수 | ~265 |

## 성능 개선

### rAF 기반 틱 렌더링
```ts
// 이전: 매 틱마다 새 배열 복사 + 전체 리렌더
.on("tick", () => { setSimNodes([...newNodes]); setSimLinks([...newLinks]); })

// 개선: rAF로 배칭, ref에서 직접 읽기 (d3가 in-place mutate)
.on("tick", () => {
  cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(() => setTickId(t => t + 1));
})
```

### React.memo 서브컴포넌트
- `GraphNodeElement`: 커스텀 비교함수로 position/color/opacity/노드 데이터(label, imageUrl, isPrivate, generation, sex) 변경 시에만 리렌더
- `GraphEdge`: 커스텀 비교함수로 position/color/width 변경 시에만 리렌더
- hover 변경 시 실제로 색상이 바뀌는 노드/엣지만 리렌더

### StyleContext 패턴
기존 ~12개 useCallback (getMorphColor, getNodeColor, getEdgeColor 등) → useMemo로 만든 StyleContext 객체 + 순수함수로 대체. useCallback 오버헤드 제거.

```ts
interface StyleContext {
  hoveredNodeId: string | null;
  isDark: boolean;
  highlightSelected: boolean;
  selectedSet: Set<string>;
  coiNodeSet: Set<string>;
  coiEdgeSet: Set<string>;
  childSet: Set<string>;
  connectedMap: Map<string, Set<string>>;
  simNodes: GraphNode[];
  maxDegree: number;
}
```

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

## Exported 타입 (lib/types.ts에서 정의, ForceGraph.tsx에서 re-export)
```ts
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  degree: number;
  imageUrl?: string;
  sex?: string;
  isPairOfCenter?: boolean;
  generation?: number;
  morphs?: string[];
  isPrivate?: boolean;
  fatherId?: string;
  motherId?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  isPair?: boolean;
}
```

## d3-force 시뮬레이션 (useForceSimulation)

### 7가지 힘 (Forces)
1. **forceLink** — 엣지 연결 (거리: 180)
2. **forceManyBody** — 노드 간 반발력 (strength: -600)
3. **forceCenter** — 중앙 정렬
4. **forceCollide** — 노드 겹침 방지 (radius + 20 padding)
5. **forceX** — 수평 중앙 정렬 (strength: 0.06)
6. **forceY** — 세대 기반 수직 정렬 (generation * 200, strength: 0.3)
7. **pairAlignForce** (커스텀) — 같은 페어의 노드를 같은 Y좌표로 정렬 (strength: 0.6)

### 노드 위치 보존
- 기존 노드: 이전 위치 유지 (prevPositions)
- 새 노드: 연결된 이웃 노드 근처에서 시작
- 고아 노드: 기존 트리 오른쪽 끝 바로 옆에서 시작

### Alpha 관리
- 확장 시 (노드 추가): alpha 0.3 (기존 노드 흔들림 최소화)
- 초기 로드: alpha 0.8
- alphaDecay: 0.02

## 인터랙션 (useForceInteraction)

### 줌/팬
- `d3-zoom` 사용 (scale: 0.1 ~ 4)
- 노드 위 이벤트는 zoom 대신 drag로 처리 (`filter`)

### 포커스 애니메이션
- `focusNodeId` 변경 시 해당 노드로 자동 이동 + 줌 (최소 1.8x)
- 700ms 트랜지션 + 2초 글로우 펄스 애니메이션
- 좌표 없으면 100ms 간격으로 2초간 재시도

### 노드 드래그
- mousedown 시 현재 위치 고정 → mousemove 시 시뮬레이션 재가열
- mouseup 시 현재 위치 고정 유지

### 클릭/더블클릭
- 250ms 딜레이로 싱글클릭/더블클릭 구분

## 노드 렌더링 (GraphNodeElement)

### 시각 요소 (위→아래 순서)
1. **검색 포커스 글로우**: amber 애니메이션 링
2. **이미지 노드**: `<image>` + `<circle stroke>` 테두리
3. **비이미지 노드**: `<circle fill>` + 선택 링
4. **비공개 노드** (`isPrivate`): 점선 링 + 좌상단 자물쇠 배지
5. **세대 배지**: 우상단 원 배지 "G0", "G1"...
6. **성별 dot + 이름 라벨**: 노드 하단

## 스타일 순수함수 (force-graph-utils.ts)

### 노드 색상 (`computeNodeColor`)
| 상태 | 색상 |
|------|------|
| 선택 하이라이트 모드 (선택 노드) | blue/violet |
| 선택 하이라이트 모드 (자식 노드) | cyan |
| 선택 하이라이트 모드 (COI 경로 노드) | morph 색상 |
| 선택 하이라이트 모드 (나머지) | faded |
| hover 없음 | morph 색상 (첫 번째 모프 or 기본 회색) |
| hover 있음 (hover 노드) | amber |
| hover 있음 (부모 노드) | orange |
| hover 있음 (페어 노드) | fuchsia |
| hover 있음 (연결 노드) | cyan |
| hover 있음 (나머지) | faded |

### 엣지 색상 (`computeEdgeColor`)
| 상태 | 색상 | 두께 |
|------|------|------|
| 선택 간 엣지 | purple/violet | 2.5 |
| 자식 엣지 | cyan | 2.5 |
| COI 경로 | emerald | 3 |
| 부모 엣지 (hover) | orange | 3 |
| hover 연결 | cyan/fuchsia | 2.5 |
| pair 엣지 (기본) | purple/violet | 1 |
| 기본 offspring | 회색 | 1 |
| faded | 연한 회색 | 0.5 |

## 상수 (force-graph-constants.ts)

### 노드 크기
- MIN_RADIUS: 20, MAX_RADIUS: 40, PAIR_RADIUS_BOOST: 8

### 주요 색상
- 기본 노드: `#5a6a7a`, hover 중앙: `#fbbf24` (amber)
- COI 경로: `#10b981` (emerald), 페어: `#c084fc` (purple)
- 부모: `#f97316` (orange), 자식: `#22d3ee` (cyan)

## 상호작용
- **클릭**: `onNodeClick` (노드 확장/COI 선택)
- **더블클릭**: `onNodeDoubleClick` (COI 두 번째 개체 선택)
- **우클릭**: `onNodeContextMenu` (컨텍스트 메뉴 표시)
- **호버**: `onNodeHover` (연결 노드 하이라이트)
- **캔버스 클릭**: `onCanvasClick` (선택 해제)
