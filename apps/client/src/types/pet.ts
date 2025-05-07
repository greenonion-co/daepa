export interface PetSummaryDto {
  pet_id: number;
  name: string;
  owner: any;
  morphs: string[];
  traits?: string[];
  sex: string;
  photo?: any;
}

export interface PetMatingDto {
  status: string; // 메이팅 상태: 배란, 발정, 임신
  deliveryCount: number; // 산란 횟수
  pair: Array<PetSummaryDto & { matingDate: string }>; // 페어 정보
}

export interface PetSalesDto {
  status: string; // 분양 상태: NFS, 예약중, 분양완료, 분양중, 보류(TBD)
  price?: number; // 분양 가격
}

export type FOOD = "판게아 인섹트" | "귀뚜라미" | "누에" | "지렙 인섹트";

export interface Pet {
  pet_id: string;
  name: string; // 이름
  owner: any; // TODO: 주인 정보
  species: string; // 종
  morphs?: string[]; // 모프
  traits?: string[]; // 형질
  birthdate?: string; // 생년월일
  sex?: "M" | "F" | "N"; // 성별
  weight?: number; // 몸무게
  foods?: FOOD[]; // 먹이
  father?: PetSummaryDto; // TODO: 부개체 요약
  mother?: PetSummaryDto; // TODO: 모개체 요약
  photos?: any[]; // TODO: 사진
  desc?: string; // 소개말
  mating?: PetMatingDto;
  sales?: PetSalesDto;
}

export interface CreatePetDto {
  name: string; // 이름
  species: string; // 종
  morphs?: string[]; // 모프
  traits?: string[]; // 형질
  birthdate?: string; // 생년월일
  sex?: "M" | "F" | "N"; // 성별
  weight?: number; // 몸무게
  foods?: FOOD[]; // 먹이
  father?: PetSummaryDto; // TODO: 부개체 요약
  mother?: PetSummaryDto; // TODO: 모개체 요약
  photos?: any[]; // TODO: 사진
  desc?: string; // 소개말
  mating?: PetMatingDto;
  sales?: PetSalesDto;
}
