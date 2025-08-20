import { PetDtoGrowth, PetDtoSex } from '@repo/api-client';

export const GENDER_KOREAN_INFO: Record<PetDtoSex | 'N', string> = {
  M: '수컷',
  F: '암컷',
  N: '미구분',
};
export const SPECIES_KOREAN_INFO: Record<string, string> = {
  CR: '크레스티드 게코',
  LE: '레오파드 게코',
  FT: '펫테일 게코',
  KN: '납테일 게코',
  LC: '리키에너스',
  GG: '가고일 게코',
};
export const GROWTH_KOREAN_INFO: Record<PetDtoGrowth | 'EGG', string> = {
  EGG: '알',
  BABY: '베이비',
  JUVENILE: '아성체',
  PRE_ADULT: '준성체',
  ADULT: '성체',
  DEAD: '사망',
};

export const FIELD_LABELS: Record<string, string> = {
  name: '이름',
  species: '종',
  morphs: '모프',
  traits: '형질',
  sex: '성별',
  growth: '크기',
  weight: '몸무게',
  mother: '모',
  father: '부',
  hatchingDate: '생년월일',
  desc: '설명',
  foods: '먹이',
  isPublic: '공개 여부',
  adoption_status: '분양 상태',
};
