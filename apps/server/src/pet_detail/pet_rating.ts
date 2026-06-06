import { PetDetailEntity } from './pet_detail.entity';

/**
 * 펫 평가(육각형 능력치) 점수.
 * 저장은 인덱싱/필터링을 위해 개별 컬럼(score1~scoreN)으로 하고,
 * API/클라이언트 계약은 육각형 UI에 맞춰 number[] 배열로 노출한다.
 * 항목 라벨/순서는 클라이언트 상수에서 관리한다(여기는 위치=안정 키).
 */
export const RATING_COUNT = 6;
export const RATING_MIN = 0;
export const RATING_MAX = 5;

const SCORE_KEYS = [
  'score1',
  'score2',
  'score3',
  'score4',
  'score5',
  'score6',
] as const;

/** 개별 score 컬럼 → number[] 배열. 하나도 설정되지 않았으면 undefined. */
export function assembleRatingScores(
  detail: PetDetailEntity | null | undefined,
): number[] | undefined {
  if (!detail) return undefined;
  const values = SCORE_KEYS.map((key) => detail[key]);
  if (values.every((v) => v === null || v === undefined)) return undefined;
  return values.map((v) => v ?? 0);
}

/** number[] 배열 → 개별 score 컬럼 부분 업데이트 객체. */
export function decomposeRatingScores(
  scores: number[],
): Partial<PetDetailEntity> {
  const result: Partial<PetDetailEntity> = {};
  SCORE_KEYS.forEach((key, index) => {
    result[key] = scores[index] ?? null;
  });
  return result;
}
