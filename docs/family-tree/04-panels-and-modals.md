# 가계도 패널 및 모달 컴포넌트

모든 파일은 `apps/client/src/app/(브리더스룸)/pet/[petId]/breeding-map/components/` 경로에 위치.

---

## 1. PetDetailPanel.tsx (228줄, 신규)

선택된 개체의 상세 정보를 표시하는 좌측 사이드 패널.

### Props
```ts
interface PetDetailPanelProps {
  pet: FamilyPetData | null;
  father?: FamilyPetData | null;
  mother?: FamilyPetData | null;
  onAction?: (action: string, petId: string) => void;
}
```

### 표시 정보
- 썸네일 이미지 (`PetThumbnail`)
- 성별 dot (파란/빨간) + 이름
- 부모 정보 (부/모 이름 + 성별 dot)
- 소유자 이름 (`@ownerName`)
- 모프 배지 (최대 2개 + "+N")
- 해칭일

### 액션 메뉴
| action | 설명 | 조건 |
|--------|------|------|
| `detail` | 상세 보기 | 비공개 아닌 경우 |
| `select-mate` | 메이팅 개체 선택 | 소유 + 성별 있는 경우 |
| `relation` | 관계도 | 항상 |
| `family-tree` | 가계도 | 항상 |

### 비공개 노드 처리
- `isPublic === false && !isOwner` → "비공개 개체" 배지만 표시
- 이름, 부모, 소유자, 모프, 해칭일 모두 숨김

### 애니메이션
- `PanelRow` 서브 컴포넌트로 각 행에 순차 fade-in + slide-in 적용 (50ms 딜레이)

---

## 2. CoiPanel.tsx (329줄, 신규)

근교계수(COI) 정보를 표시하는 패널.

### Props
```ts
interface CoiPanelProps {
  pets?: (CoiPanelPetInfo | undefined)[];
  coi: number;
  level: CoiLevel;                    // "safe" | "caution" | "warning" | "danger"
  commonAncestors: CommonAncestorDetail[];
  equivalentRelation: string;
  isLoading: boolean;
  isReady: boolean;
  onClear: () => void;
  onClearPet?: (petId: string) => void;
  onFocusAncestor?: (petId: string) => void;
  onSelectMate?: (role: "부" | "모") => void;
}
```

### 표시 정보
- 선택된 두 개체 썸네일 + 이름
- COI 퍼센트 + 위험도 레벨 (색상 코딩)
- 대표 관계 문자열 (예: "사촌 수준")
- 공통 조상 목록 (기여도 + 최소 세대)

### 상호작용
- 개체 해제 (`onClearPet`)
- 공통 조상 클릭 → 해당 노드로 포커스 이동 (`onFocusAncestor`)
- "메이팅 개체 선택" 버튼 (`onSelectMate`)

---

## 3. PairStatisticsPanel.tsx (273줄, 신규)

선택된 페어의 번식 이력 통계를 표시하는 우측 패널.

### Props
```ts
interface PairStatisticsPanelProps {
  statistics: PairSummaryDto | null;
  isLoading: boolean;
  hasPair: boolean;
  isOpposite?: boolean;
  isBothOwned?: boolean;
  onAddMating?: (matingDate: string, season: number) => void | Promise<void>;
  matingDates?: string[];
  latestSeason?: number;
  onAddLaying?: () => void;
  onExpand?: () => void;
  pairChildren?: PairChildInfo[];
  onChildClick?: (petId: string) => void;
}
```

### 표시 정보
- 메이팅/산란/알 수 통계
- 수정률/부화율
- 모프 분포
- 페어 자식 목록 (성별 dot + 이름 + 모프)

### 기능
- `CalendarSelect`로 메이팅 날짜 선택 + 시즌 자동 계산 → 메이팅 추가
- 산란 추가 버튼 (메이팅 1건 이상 있을 때만)
- "상세 보기" 확장 버튼 (`onExpand`)
- 자식 클릭 → `onChildClick` (호버 하이라이트)

---

## 4. PairDetailContent.tsx (406줄, 신규)

페어 상세 정보를 다이얼로그 형태로 표시.

### 주요 기능
- `pairControllerGetPairList` API로 페어 데이터 조회
- 부/모 `ParentCard` 표시 (`petThumbnailClickable=false`)
- `PairCard` 표시 (`borderDisabled=true`) — 메모 인라인 편집 포함
- 메이팅 이력 목록 (`MatingItem`)
- 산란 이력 목록 (`LayingItem`)
- 메이팅 추가 (시즌 입력 다이얼로그)
- 산란 추가 (`CreateLayingModal`)
- `usePairInvalidate` 훅으로 쿼리 무효화

---

## 5. OffspringPredictionPanel.tsx (195줄, 신규)

두 개체의 모프 기반 자식 유전형 예측.

### Props
```ts
interface OffspringPredictionPanelProps {
  morphsA: string[];
  morphsB: string[];
  nameA: string;
  nameB: string;
}
```

### 표시 정보
- 유전자별 예측 결과 (부모 상태 + 자식 확률)
- `predictOffspring(morphsA, morphsB)` 결과를 테이블로 표시
- 예측 불가 시 안내 메시지

---

## 6. MorphLegend.tsx (157줄, 신규)

모프별 색상 범례 + 엣지 타입 범례.

### 표시 정보
- 엣지 타입: 페어(점선), 자식(화살표), COI 경로(amber)
- 모프 색상: `getMorphOrTraitColor` 기반 매핑
- 다크/라이트 모드 색상 보정 (`adjustMorphColorForTheme`)
- 접기/펼치기 토글

---

## 7. NodeContextMenu.tsx (92줄, 신규)

우클릭 컨텍스트 메뉴.

### Props
```ts
interface NodeContextMenuProps {
  nodeId: string;
  nodeName: string;
  isPrivate?: boolean;
  isOwner?: boolean;
  nodeSex?: string;
  position: { x: number; y: number };
  onAction: (action: string, nodeId: string) => void;
  onClose: () => void;
}
```

### 메뉴 항목
| action | 라벨 | 조건 |
|--------|------|------|
| `detail` | 개체 상세 보기 | `!isPrivate` |
| `select-mate` | 메이팅 개체 선택 | `isOwner && 성별 있음` |
| `relation` | 관계도 보기 | 항상 |
| `family-tree` | 이 개체의 가계도 | 항상 |

### 동작
- ESC 키로 닫기
- 뷰포트 밖 방지 (위치 자동 보정)

---

## 8. QuickRegisterModal.tsx (514줄, 신규)

가계도에서 빠르게 새 개체를 등록하는 2단계 모달.

### Props
```ts
interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (petId: string) => void;
}
```

### Step 1 — 기본 정보
- 이름 (`NameDuplicateCheckInput` — 중복 검사)
- 성별 (`SingleSelect`)
- 모프 (`FormMultiSelect`)
- 트레잇 (`FormMultiSelect`)
- 설명 (textarea)

### Step 2 — 추가 정보
- 부/모 (`ParentSearchSelector` via `overlay.open`)
- 사진 (`DndImagePicker`, 최대 3장)
- 해칭일 (`Popover` + `Calendar`)
- 몸무게 (`NumberField`, 단위 g)
- 먹이 (`FormMultiSelect`)

### 플로우
1. Step 1 필수항목 입력 → "등록" (바로 등록) 또는 "추가 정보 입력 →" (Step 2로)
2. Step 2 모든 필드 선택사항 → "등록"
3. `petControllerCreate` API 호출
4. 성공 시 `onSuccess(petId)` → 가계도에 새 노드 표시
