export enum PET_SEX {
  MALE = 'M',
  FEMALE = 'F',
  NON = 'N',
}

export enum PET_SPECIES {
  CRESTED = 'CR', // 크레스티드게코
  LEOPARD = 'LE', // 레오파드게코
  FATTAIL = 'FT', // 펫테일게코
  KNOPTAIL = 'KN', // 납테일게코
  LEACH = 'LC', // 리키에너스
  GARGO = 'GG', // 가고일게코
}

export enum ADOPTION_SALE_STATUS {
  NFS = 'NFS', // 판매 안함
  ON_SALE = 'ON_SALE', // 판매 중
  ON_RESERVATION = 'ON_RESERVATION', // 예약 중
  SOLD = 'SOLD', // 판매 완료
}

export enum PET_ADOPTION_LOCATION {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum PET_GROWTH {
  EGG = 'EGG', // 알
  BABY = 'BABY', // 베이비
  JUVENILE = 'JUVENILE', // 아성체
  PRE_ADULT = 'PRE_ADULT', // 준성체
  ADULT = 'ADULT', // 성체
  DEAD = 'DEAD', // 사망
}

export enum PET_LIST_FILTER_TYPE {
  ALL = 'ALL',
  MY = 'MY',
}

export const CSV_FIELD_MAPPING: Record<string, string> = {
  이름: 'name',
  종: 'species',
  성별: 'sex',
  크기: 'growth',
  몸무게: 'weight',
  차수: 'clutchOrder',
  온도: 'temperature',
  해칭일: 'hatchingDate',
  메모: 'desc',
  모프: 'morphs',
};

export const SPECIES_MAPPING: Record<string, PET_SPECIES> = {
  크레스티드게코: PET_SPECIES.CRESTED,
  '크레스티드 게코': PET_SPECIES.CRESTED,
  레오파드게코: PET_SPECIES.LEOPARD,
  '레오파드 게코': PET_SPECIES.LEOPARD,
  펫테일게코: PET_SPECIES.FATTAIL,
  '펫테일 게코': PET_SPECIES.FATTAIL,
  납테일게코: PET_SPECIES.KNOPTAIL,
  '납테일 게코': PET_SPECIES.KNOPTAIL,
  리키에너스: PET_SPECIES.LEACH,
  가고일게코: PET_SPECIES.GARGO,
  '가고일 게코': PET_SPECIES.GARGO,
  CR: PET_SPECIES.CRESTED,
  LE: PET_SPECIES.LEOPARD,
  FT: PET_SPECIES.FATTAIL,
  KN: PET_SPECIES.KNOPTAIL,
  LC: PET_SPECIES.LEACH,
  GG: PET_SPECIES.GARGO,
};

export const SEX_MAPPING: Record<string, PET_SEX> = {
  수컷: PET_SEX.MALE,
  암컷: PET_SEX.FEMALE,
  미구분: PET_SEX.NON,
  MALE: PET_SEX.MALE,
  FEMALE: PET_SEX.FEMALE,
  M: PET_SEX.MALE,
  F: PET_SEX.FEMALE,
  N: PET_SEX.NON,
};

export const GROWTH_MAPPING: Record<string, PET_GROWTH> = {
  알: PET_GROWTH.EGG,
  베이비: PET_GROWTH.BABY,
  아성체: PET_GROWTH.JUVENILE,
  준성체: PET_GROWTH.PRE_ADULT,
  성체: PET_GROWTH.ADULT,
  사망: PET_GROWTH.DEAD,
  EGG: PET_GROWTH.EGG,
  BABY: PET_GROWTH.BABY,
  JUVENILE: PET_GROWTH.JUVENILE,
  PRE_ADULT: PET_GROWTH.PRE_ADULT,
  ADULT: PET_GROWTH.ADULT,
  DEAD: PET_GROWTH.DEAD,
};
