# 가계도 라이브러리

모든 파일은 `apps/client/src/app/(브리더스룸)/pet/[petId]/family-tree/lib/` 경로에 위치.

---

## 1. types.ts (~120줄)

가계도 전용 타입 정의 및 변환 함수. ForceGraph의 `GraphNode`, `GraphLink` 타입도 여기에 정의.

### 주요 타입

```ts
// 그래프 노드에 표시할 펫 데이터
interface FamilyPetData {
  petId: string;
  name: string | null;
  sex: string | null;
  species: string | null;
  morphs: string[];
  traits: string[];
  hatchingDate: string | null;
  isDeleted: boolean;
  type: string | null;
  isPublic?: boolean;
  isOwner?: boolean;
  ownerName?: string | null;
}

// 서버 CTE 응답 노드
interface FamilyTreeApiNode {
  petId: string;
  fatherId: string | null;
  motherId: string | null;
  depth: number;
  name: string | null;
  sex: string | null;
  morphs: string[];
  traits: string[];
  species: string | null;
  hatchingDate: string | null;
  type: string | null;
  isPublic: boolean;
  isOwner: boolean;
  ownerName: string | null;
}

// 비공개 노드
interface FamilyTreeHiddenNode {
  petId: string;
  hiddenStatus: string;
}

// 유니온 타입
type FamilyTreeApiNodeOrHidden = FamilyTreeApiNode | FamilyTreeHiddenNode;

// 스토어 노드 데이터
interface FamilyTreeNodeData {
  petId: string;
  pet: FamilyPetData | null;
  isCenterPet: boolean;
  fatherId: string | null;
  motherId: string | null;
  isHidden?: boolean;
}
```

### 변환 함수

| 함수 | 용도 |
|------|------|
| `isHiddenNode(node)` | `"hiddenStatus" in node`로 비공개 노드 타입 가드 |
| `toPetData(pet: PetDto)` | PetDto → FamilyPetData (모달 반환값 반영 시) |
| `apiNodeToPetData(node)` | API 응답 → FamilyPetData (최초 로드 시, isPublic/isOwner 포함) |

---

## 2. coi.ts (286줄, 신규)

Wright 경로 공식 기반 COI(Coefficient of Inbreeding) 계산 엔진.

### 주요 타입
```ts
type Pedigree = Map<string, PedigreeEntry>;

interface PedigreeEntry {
  fatherId?: string;
  motherId?: string;
  name?: string;
}

type CoiLevel = "safe" | "caution" | "warning" | "danger";

interface CommonAncestorDetail {
  petId: string;
  name: string;
  contribution: number;
  minGeneration: number;
  pathsFromA: string[][];
  pathsFromB: string[][];
}

interface CoiResult {
  coi: number;
  level: CoiLevel;
  commonAncestors: CommonAncestorDetail[];
  equivalentRelation: string;
}
```

### 주요 함수

#### `buildPedigree(petIds: string[], maxGen = 5): Promise<Pedigree>`
- `petControllerGetParentsByPetId` API를 재귀 호출하여 조상 족보 구축
- 비공개 노드 (`"hiddenStatus" in father`) 는 skip
- `Promise.all`로 병렬 fetching
- 최대 5세대까지 탐색

#### `calculateCOI(petIdA, petIdB, pedigree): CoiResult`
Wright 경로 공식 구현:
1. `getAllAncestors`로 양쪽 모든 조상 집합 추출
2. 교집합으로 공통 조상 식별
3. `findAllPaths`로 각 개체에서 공통 조상까지 모든 경로 DFS 탐색
4. 각 경로 쌍에 대해 `(0.5)^(n1+n2+1) * (1+Fa)` 계산
5. 경로 중복 제거 (중간 노드가 겹치는 경로 쌍 배제)
6. `calculateAncestorInbreeding`으로 조상 자체의 근친계수 재귀 계산 (Fa)

#### `getCoiLevel(coi): CoiLevel`
| COI 범위 | 레벨 |
|----------|------|
| < 6.25% | safe |
| < 12.5% | caution |
| < 25% | warning |
| >= 25% | danger |

#### `getEquivalentRelation(coi): string`
COI 값을 대표 관계 예시로 변환 (무관, 먼 친척, 사촌 수준, 형제/부모-자식 수준)

### 상수
- `COI_LEVEL_CONFIG` — 각 위험도별 라이트/다크 모드 색상, 배경색, 설명 문자열

---

## 3. genetics.ts (335줄, 신규)

파충류(크레스티드 게코) 모프/형질 유전 예측 엔진.

### 주요 타입
```ts
type GeneStatus = "visual" | "super" | "het100" | "het66" | "het50" | "none";

interface GenePrediction {
  gene: string;
  type: string;          // "codominant" | "recessive"
  parentA: GeneStatus;
  parentB: GeneStatus;
  outcomes: { status: GeneStatus; probability: number }[];
}

interface OffspringPrediction {
  genes: GenePrediction[];
}
```

### 주요 함수

#### `predictOffspring(morphsA, morphsB): OffspringPrediction`
두 부모의 모프 배열을 받아 자식 모프 확률 예측.

#### `geneStatusLabel(status): string`
| 상태 | 라벨 |
|------|------|
| visual | 비주얼 |
| super | 슈퍼 |
| het100 | 100% Het |
| het66 | 66% Het |
| het50 | 50% Het |
| none | 없음 |

### 유전 규칙 데이터 (`CR_GENE_RULES`)

| 유전자 | 유전 방식 | 비고 |
|--------|----------|------|
| 릴리화이트 | 공우성 | 치사 슈퍼 (`lethalSuper: true`) |
| 카푸치노 | 공우성 | |
| 세이블 | 공우성 | |
| 아잔틱 | 열성 | |
| 초초 | 열성 | |

### 콤보 모프 분해 (`CR_COMBO_MAP`)
- 릴잔틱 → 릴리화이트 + 아잔틱
- 릴리세이블 → 릴리화이트 + 세이블
- 카푸아잔틱 → 카푸치노 + 아잔틱
- 등 7개 콤보

### 내부 로직
- `parseMorphsToGeneMap(morphs)` — 모프 문자열 파싱 (헷 패턴, 슈퍼폼, 콤보 모프)
- `crossCodominant(gene, rule, a, b)` — 공우성 Punnett 사각형 계산
- `crossRecessive(gene, a, b)` — 열성 교배 (헷% 확률 반영)
- 1% 미만 확률 필터링

---

## 4. graph-utils.ts (64줄, 신규)

그래프 엣지 관련 유틸리티.

### 주요 타입
```ts
interface CoiPathEdge { source: string; target: string; }
interface FamilyEdge { id: string; source: string; target: string; }
```

### 주요 함수

#### `extractCoiPathEdges(commonAncestors, visibleNodeIds): CoiPathEdge[]`
COI 공통 조상의 모든 경로에서 현재 그래프에 보이는 엣지만 추출.
- 양쪽 끝점이 모두 `visibleNodeIds`에 있는 경우만 반환
- 양방향 중복 제거 (`a < b` 정규화)

---

## 5. force-graph-constants.ts (~65줄, 신규)

ForceGraph 관련 모든 상수 (30+개):
- 노드 크기: `MIN_RADIUS`, `MAX_RADIUS`, `PAIR_RADIUS_BOOST`, `BASE_FONT_SIZE`
- 색상: `COLOR_DEFAULT_NODE`, `COLOR_HOVER_CENTER`, `COLOR_COI_PATH`, `COLOR_PAIR_EDGE` 등
- 시뮬레이션: `SIM_LINK_DISTANCE`, `SIM_CHARGE_STRENGTH`, `PAIR_ALIGN_STRENGTH`, `GENERATION_GAP` 등
- 포커스 애니메이션: `FOCUS_MIN_ZOOM`, `FOCUS_TRANSITION_MS` 등
- 화살표 마커: `ARROW_MARKER_DEFS` (색상별 마커 정의 배열)

---

## 6. force-graph-utils.ts (~265줄, 신규)

ForceGraph 스타일 계산 순수함수 + 유틸리티.

### 유틸리티 함수
| 함수 | 용도 |
|------|------|
| `getLinkSourceId(link)` | 링크 source ID 추출 (string 또는 GraphNode) |
| `getLinkTargetId(link)` | 링크 target ID 추출 |
| `adjustMorphColorForTheme(hex, isDark)` | 다크/라이트 모드 색상 보정 |
| `nodeRadius(degree, maxDegree, isPairOfCenter?)` | degree 기반 노드 반지름 계산 |
| `screenToSvg(gEl, clientX, clientY)` | 화면 좌표 → SVG 좌표 변환 |
| `getSexDotColor(sex?)` | 성별 dot 색상 (M: 파란, F: 빨간) |

### 스타일 순수함수
| 함수 | 용도 |
|------|------|
| `computeNodeColor(node, ctx)` | 노드 fill/stroke 색상 |
| `computeEdgeColor(link, ctx)` | 엣지 stroke 색상 |
| `computeEdgeWidth(link, ctx)` | 엣지 두께 |
| `computeEdgeHidden(link, ...)` | 엣지 숨김 여부 |
| `computeArrowMarkerId(color)` | 화살표 마커 ID |
| `computeNodeOpacity(node, ctx)` | 노드 불투명도 |
| `computeLabelOpacity(node, ctx)` | 라벨 불투명도 |

### StyleContext
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

---

## 7. hooks

### useFamilyTreeData.ts (39줄)
| 훅 | API | queryKey | staleTime |
|----|-----|----------|-----------|
| `useCenterPet(petId)` | `petControllerFindPetByPetId` | `[name, petId]` | 기본 |
| `useFamilyTree(petId, depth, ancestorDepth)` | `petControllerGetFamilyTree` | `["family-tree", petId, depth, ancestorDepth]` | 5분 |

`useFamilyTree`의 `select`에서 orval 타입을 `FamilyTreeApiNodeOrHidden[]`으로 캐스팅.

### useCoiCalculation.ts (50줄)
| 훅 | 의존성 | staleTime | gcTime |
|----|--------|-----------|--------|
| `useCoiCalculation(petIdA?, petIdB?)` | `buildPedigree`, `calculateCOI` | 10분 | 30분 |

두 petId가 모두 있을 때만 활성화. 5세대 pedigree 구축.

### usePairStatistics.ts (80줄)
| 훅 | 기능 |
|----|------|
| `usePairStatistics(petIdA?, petIdB?, sexA?, sexB?)` | 페어 존재 여부 + 번식 통계 조회 |

- `determinePairRoles` — 성별 기반 father/mother 역할 결정
- 단방향 페어 조회 (서버 저장 시 성별 정규화 보장)
- queryKey: `["pair-lookup", ...]`, `["pair-summary", ...]`

### useGraphTransform.ts (~180줄, 신규)
FamilyTreeCanvas에서 추출. 그래프 데이터 변환:
- `nodesMap`/`edgesMap` → `GraphNode[]`/`GraphLink[]` 변환
- 썸네일 URL 일괄 fetch (`useQueries`)
- 성별 필터 적용
- 모프 범례 (visibleMorphs)
- 비공개 노드 필터링

### useSearch.ts (~157줄, 신규)
FamilyTreeCanvas에서 추출. 검색 + 외부 트리 추가:
- 검색어 debounce (300ms)
- API 검색 결과 → 그래프 포커스
- 외부 개체 선택 → API fetch → 스토어 merge

### useCoiSelection.tsx (~321줄, 신규)
FamilyTreeCanvas에서 추출. COI 선택/메이트 선택:
- COI 첫 번째/두 번째 개체 선택 상태 관리
- `useCoiCalculation` 연동
- 메이트 선택 모드 + 메이팅 생성 + pair 엣지 추가

### usePairActions.tsx (~193줄, 신규)
FamilyTreeCanvas에서 추출. 페어 통계 + 메이팅/산란:
- `usePairStatistics` 연동
- 메이팅 생성/산란 추가 (overlay-kit 모달)
- 쿼리 무효화

### useForceSimulation.ts (~180줄, 신규)
ForceGraph에서 추출. d3-force 시뮬레이션 생명주기:
- rAF 배칭으로 틱 렌더링 최적화
- 노드 위치 보존, 이웃 기반 초기 배치
- 커스텀 pairAlignForce
- Alpha 관리 (확장 vs 초기)

### useForceInteraction.ts (~190줄, 신규)
ForceGraph에서 추출. 인터랙션 관리:
- d3-zoom 줌/팬
- focusNodeId 포커스 애니메이션 (줌인 + 글로우)
- 노드 드래그 (mousedown → mousemove → mouseup)
- 싱글클릭/더블클릭 구분 (250ms 딜레이)
- hover 상태 + connectedMap
