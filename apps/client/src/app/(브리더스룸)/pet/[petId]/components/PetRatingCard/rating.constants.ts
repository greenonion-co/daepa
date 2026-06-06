// 펫 평가(육각형 능력치) 항목 정의.
// 위치(index)가 서버 score1~score6과 1:1 매핑되는 안정 키.
// 항목명이 확정되면 라벨만 교체하면 된다(서버/스키마 변경 불필요).
export const RATING_LABELS = [
  "항목1",
  "항목2",
  "항목3",
  "항목4",
  "항목5",
  "항목6",
] as const;

export const RATING_COUNT = RATING_LABELS.length;
export const RATING_MAX = 5;

export const EMPTY_SCORES: number[] = Array(RATING_COUNT).fill(0);
