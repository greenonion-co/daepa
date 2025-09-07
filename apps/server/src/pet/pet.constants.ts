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
  NOT_MY = 'NOT_MY',
}
