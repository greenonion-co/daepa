import {
  IsArray,
  IsDateString,
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { SEX_ENUM, SPECIES_ENUM } from './pet.constants';

export class PetSummaryDto {
  id: number;
  name: string;
  owner: any;
  morphs: string[];
  traits?: string[];
  sex: string;
  photo?: any;
}

export class PetBaseDto {
  id: number;
  name: string; // 이름
  owner: any; // TODO: 주인 정보
  species: string; // 종
  morphs?: string[]; // 모프
  traits?: string[]; // 형질
  birthdate?: string; // 생년월일
  sex?: 'M' | 'F' | 'N'; // 성별
  weight?: number; // 몸무게
  food?: string[]; // 먹이
  father?: PetSummaryDto; // TODO: 부개체 요약
  mother?: PetSummaryDto; // TODO: 모개체 요약
  photos?: any[]; // TODO: 사진
  desc?: string; // 소개말
}

export class PetMatingDto {
  status: string; // 메이팅 상태: 배란, 발정, 임신
  deliveryCount: number; // 산란 횟수
  pair: Array<PetSummaryDto & { matingDate: string }>; // 페어 정보
}

export class PetSalesDto {
  status: string; // 분양 상태: NFS, 예약중, 분양완료, 분양중, 보류(TBD)
  price?: number; // 분양 가격
}

export class CreatePetDto {
  @IsString()
  name: string;

  @IsString()
  @IsEnum(SPECIES_ENUM)
  species: (typeof SPECIES_ENUM)[number];

  @IsOptional()
  @IsArray()
  morphs?: string[];

  @IsOptional()
  @IsArray()
  traits?: string[];

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsEnum(SEX_ENUM)
  sex?: (typeof SEX_ENUM)[number];

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsArray()
  foods?: string[];

  @IsOptional()
  @IsObject()
  father?: PetSummaryDto;

  @IsOptional()
  @IsObject()
  mother?: PetSummaryDto;

  @IsOptional()
  @IsArray()
  photos?: any[];

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsObject()
  mating?: PetMatingDto;

  @IsOptional()
  @IsObject()
  sales?: PetSalesDto;
}

export class PetInfoDto extends PetBaseDto {
  mating?: PetMatingDto;
  sales?: PetSalesDto;
}
