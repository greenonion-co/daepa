# 공통 컴포넌트 확장

가계도 기능에서 기존 공통 컴포넌트를 재사용하기 위해 필요한 확장 및 버그 수정.

---

## 1. FormMultiSelect.tsx / SingleSelect.tsx — `forceCenter` prop

### 파일
- `apps/client/src/app/(브리더스룸)/components/FormMultiSelect.tsx` (+11줄)
- `apps/client/src/app/(브리더스룸)/components/selector/SingleSelect.tsx` (+11줄)

### 변경
```ts
// 새로운 prop
forceCenter?: boolean;  // 데스크탑에서도 화면 중앙 모달로 표시
```

**기존**: `isMobile` 조건으로만 화면 중앙 모달(오버레이 배경 + 중앙 정렬) 표시
**변경**: `isMobile || forceCenter` 조건으로 변경

### 목적
가계도 등 데스크탑 환경의 모달 내부에서 셀렉터를 사용할 때, 화면 중앙에 모달 형태로 드롭다운을 띄우기 위함.

---

## 2. parentSearch/index.tsx — 성별 옵셔널

### 파일
`apps/client/src/app/(브리더스룸)/components/selector/parentSearch/index.tsx` (+6줄)

### 변경
- `sex` prop 타입: `PetDtoSex` (필수) → `PetDtoSex | undefined` (옵셔널)
- 필터링: `pet.sex === sex` → `(!sex || pet.sex === sex)`

### 목적
성별 지정 없이 모든 개체를 검색할 수 있도록 지원. 가계도에서 부모 검색 시 성별 제한 없이 검색하는 유스케이스.

---

## 3. ParentLink.tsx — 버그 수정 + UI 통일

### 파일
`apps/client/src/app/(브리더스룸)/pet/components/ParentLink.tsx` (+32줄)

### 버그 수정
- `parent.owner.userId` → `parent.owner?.userId` (owner가 null일 수 있는 경우)
- owner 이름 표시 조건에 `parent.owner?.name` 존재 확인 추가

### UI 변경
| 기존 | 변경 |
|------|------|
| 이름 아래 파란/빨간 반투명 언더라인 하이라이트 (`after:` pseudo-element) | 성별 dot (파란/빨간 원 `w-2 h-2`) + 이름 가로 배치 (`flex gap-1.5`) |

PetDetailPanel 스타일과 일관된 성별 dot + 이름 표시로 통일.

---

## 4. Header.tsx — 가계도 진입점 추가

### 파일
`apps/client/src/app/(브리더스룸)/pet/[petId]/components/Header.tsx` (+65줄)

### 변경
기존 "개체 관계도" 단일 버튼 → 두 개 버튼으로 분리:

| 버튼 | 색상 | 경로 | 설명 |
|------|------|------|------|
| 관계도 | 파란색 (`bg-blue-100`) | `/pet/{petId}/relation` | 기존 (텍스트 "개체 관계도" → "관계도"로 축약) |
| 가계도 | 초록색 (`bg-green-100`) | `/pet/{petId}/family-tree` | **신규** (툴팁: "가족 관계를 트리 구조로 확인합니다.") |

미로그인 시 두 버튼 모두 프로모 시트 표시.

---

## 5. dialog.tsx — Tailwind v4 호환 정리

### 파일
`apps/client/src/components/ui/dialog.tsx` (+6줄)

### 변경
- CSS 클래스 순서 재정렬 (Tailwind v4 규칙)
- `DialogClose` z-index: `z-50` → `z-30` (모달 요소 간 z-index 충돌 방지)

---

## 6. package.json — d3 의존성 추가

### 파일
`apps/client/package.json` (+6줄)

### 추가된 의존성
| 패키지 | 용도 |
|--------|------|
| `d3-force@^3.0.0` | 힘 기반 레이아웃 시뮬레이션 |
| `d3-selection@^3.0.0` | SVG DOM 선택/조작 |
| `d3-zoom@^3.0.0` | 줌/팬 인터랙션 |
| `@types/d3-force@^3.0.10` | TypeScript 타입 |
| `@types/d3-selection@^3.0.11` | TypeScript 타입 |
| `@types/d3-zoom@^3.0.8` | TypeScript 타입 |
