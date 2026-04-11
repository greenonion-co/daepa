export enum PET_TYPE {
  EGG = 'EGG',
  PET = 'PET',
}

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

export enum PET_ADOPTION_STATUS {
  NFS = 'NFS', // 판매 안함
  ON_SALE = 'ON_SALE', // 판매 중
  ON_RESERVATION = 'ON_RESERVATION', // 예약 중
}

export enum PET_ADOPTION_METHOD {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  WHOLESALE = 'WHOLESALE',
  EXPORT = 'EXPORT',
}

export enum PET_GROWTH {
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

export enum PET_HIDDEN_STATUS {
  SECRET = 'SECRET',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

/**
 * Role별 공개 펫 슬롯 기본 한도.
 *
 * - 한도의 의미: `isPublic = true` 이면서 `type = PET` 이고 `isDeleted = false` 인 펫의 최대 수.
 * - EGG 는 카운트에 포함하지 않으며, hatching(EGG → PET) 시점부터 카운트 대상이 된다.
 * - 비공개 펫은 무제한으로 보유 가능 (데이터 손실 방지).
 * - 사용자별 예외는 `UserEntity.petLimitOverride` 로 관리.
 *
 * 결제 플랜이 도입되면 `PetLimitPolicy.compute()` 내부에서
 * `subscription` 우선순위를 끼워넣는 방식으로 확장한다.
 */
export const DEFAULT_PET_LIMIT_BY_ROLE = {
  user: 50,
  breeder: 9999,
  admin: Number.MAX_SAFE_INTEGER,
} as const;
