# 해칭 컴포넌트 개선 사항

경로: `apps/client/src/app/(브리더스룸)/hatching/`

---

## 핵심 변경: 쿼리 무효화 중앙화

### usePairInvalidate.ts (28줄, 신규)
`apps/client/src/app/(브리더스룸)/hatching/hooks/usePairInvalidate.ts`

**기존 문제**: 각 컴포넌트에서 `pairControllerGetPairList.name` 하나만 개별 무효화 → 가계도 화면에서 관련 데이터가 갱신되지 않음.

**해결**: 페어 관련 데이터 변경 후 무효화해야 하는 6개 쿼리를 일괄 처리하는 커스텀 훅.

```ts
export function usePairInvalidate() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });  // 브리딩 페어 목록
    queryClient.invalidateQueries({ queryKey: ["pair-lookup"] });                   // 가계도 페어 존재 확인
    queryClient.invalidateQueries({ queryKey: ["pair-summary"] });                  // 가계도 번식 이력 요약
    queryClient.invalidateQueries({ queryKey: ["pair-detail-modal"] });             // 가계도 브리딩 상세
    queryClient.invalidateQueries({ queryKey: ["pair-matings-for-laying"] });       // 메이팅 날짜 목록
    queryClient.invalidateQueries({ queryKey: [statisticsControllerGetPairStatistics.name] }); // 통계 대시보드
  }, [queryClient]);
}
```

### 적용된 컴포넌트 (7개)
| 컴포넌트 | 변경 내용 |
|----------|----------|
| `CompleteHatchingModal.tsx` | `useQueryClient` → `usePairInvalidate` |
| `CreateLayingModal.tsx` | `useQueryClient` → `usePairInvalidate` |
| `DeleteMatingModal.tsx` | `useQueryClient` → `usePairInvalidate` |
| `EditEggModal.tsx` | `useQueryClient` → `usePairInvalidate` |
| `EditMatingModal.tsx` | `useQueryClient` → `usePairInvalidate` |
| `LayingItem.tsx` | `usePairInvalidate` 추가 도입 |
| `MatingItem.tsx` | `useQueryClient` → `usePairInvalidate` |

모든 컴포넌트에서 `pairControllerGetPairList` import 제거.

---

## PairCard 메모 인라인 편집

### PairCard.tsx (+154줄 변경)

**기존**: `onClickUpdateDesc` prop → 별도 모달(`UpdatePairModal`) 열어 메모 수정
**변경**: PairCard 내부에서 textarea로 직접 인라인 편집

#### 추가된 기능
- `isEditing` / `editDesc` 상태 관리
- `pairControllerUpdatePair` mutation을 PairCard 내부로 이동
- 저장/취소 버튼 + 글자수 표시 (500자 제한)

#### 새로운 Props
| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `onDescUpdated` | `() => void` | - | 메모 수정 완료 콜백 (기존 `onClickUpdateDesc` 대체) |
| `petThumbnailClickable` | `boolean` | `true` | 부모 썸네일 클릭 링크 활성화 |
| `borderDisabled` | `boolean` | `false` | 카드 테두리/그림자 비활성화 |

### PairList.tsx (+23줄 변경)
- `UpdatePairModal` 관련 코드 전체 삭제 (overlay, handleClickUpdateDesc)
- PairCard prop: `onClickUpdateDesc` → `onDescUpdated={refetch}`

---

## CreateLayingModal.tsx UX 개선

| 변경 | 기존 | 변경 후 |
|------|------|---------|
| 메이팅 필터 | `matingDateTime < layingDateTime` | `matingDateTime <= layingDateTime` |
| 차수 기본값 | 수동 입력 | `maxClutch + 1` 자동 갱신 |
| 차수 안내 | "가장 마지막 차수는 N차 입니다." | "직전 차수: N차" |
| 마지막 산란일 UI | 텍스트 | 테두리 있는 카드 |
| "종" 선택 | 활성 | 주석 처리 (비활성) |
| 상단 간격 | `py-4` | `py-2` |

---

## CreateMatingForm.tsx 확장

가계도 PairStatisticsPanel에서 메이팅 생성 시 부/모를 미리 지정하기 위한 확장.

### 새로운 Props
| prop | 타입 | 설명 |
|------|------|------|
| `onSuccess` | `() => void` | 메이팅 생성 성공 콜백 |
| `initialFather` | `{ petId, name? }` | 초기 부 지정 |
| `initialMother` | `{ petId, name? }` | 초기 모 지정 |
| `lockParents` | `boolean` | 부/모 수정 잠금 |

`lockParents && initialFather/Mother` → `ParentLink editable={false}`

---

## ParentCard.tsx 확장

### 새로운 Props
| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `petThumbnailClickable` | `boolean` | `true` | `false`면 `<Link>` 대신 `<div>` 렌더링 |

가계도 PairDetailContent에서 클릭 시 페이지 이동을 막기 위해 사용.

---

## CalendarSelect.tsx 확장

### 새로운 Props
| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `popOverAlign` | `"start" \| "center" \| "end"` | `"start"` | 팝오버 정렬 |
| `size` | `"sm" \| "md"` | `"md"` | `"sm"` → `text-xs` 적용 |
