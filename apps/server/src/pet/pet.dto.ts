import {
  IsArray,
  IsDateString,
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { PET_SEX, PET_SPECIES } from './pet.constants';
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';

class Pet {
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '펫 주인 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  ownerId: string;

  @ApiProperty({
    description: '펫 이름',
    example: '대파',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '펫 종',
    example: '크레스티드게코',
  })
  @IsString()
  @IsEnum(PET_SPECIES)
  species: keyof typeof PET_SPECIES;

  @ApiProperty({
    description: '펫 모프',
    example: ['릴리화이트', '아잔틱헷100%'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  morphs?: string[];

  @ApiProperty({
    description: '펫 형질',
    example: ['트익할', '풀핀'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  traits?: string[];

  @ApiProperty({
    description: '펫 출생일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiProperty({
    description: '펫 성장단계',
    example: '준성체',
    required: false,
  })
  @IsOptional()
  @IsString()
  growth?: string;

  @ApiProperty({
    description: '펫 성별(수컷, 암컷, 미구분)',
    example: 'M',
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SEX)
  sex?: keyof typeof PET_SEX;

  @ApiProperty({
    description: '펫 몸무게(g)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    description: '펫 먹이',
    example: ['판게아 인섹트', '귀뚜라미'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  foods?: string[];

  @IsOptional()
  @IsArray()
  photos?: any[];

  @ApiProperty({
    description: '펫 소개말',
    example: '저희 대파는 혈통있는 가문 출신의 헷100% 릴리화이트 입니다',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  fatherId?: string;

  @IsOptional()
  @IsString()
  motherId?: string;
}

export class PetSummaryDto extends PickType(Pet, [
  'petId',
  'name',
  'ownerId',
  'species',
  'morphs',
  'traits',
  'sex',
  'photos',
]) {}

export class PetMatingDto {
  status: string; // 메이팅 상태: 배란, 발정, 임신
  deliveryCount: number; // 산란 횟수
  pair: Array<PetSummaryDto & { matingDate: string }>; // 페어 정보
}

export class PetSalesDto {
  status: string; // 분양 상태: NFS, 예약중, 분양완료, 분양중, 보류(TBD)
  price?: number; // 분양 가격
}

export class PetDto extends OmitType(Pet, ['id']) {
  @IsOptional()
  @IsObject()
  father?: PetSummaryDto;

  @IsOptional()
  @IsObject()
  mother?: PetSummaryDto;

  @IsOptional()
  @IsObject()
  mating?: PetMatingDto;

  @IsOptional()
  @IsObject()
  sales?: PetSalesDto;
}

export class CreatePetDto extends OmitType(PetDto, ['petId', 'ownerId']) {}
export class UpdatePetDto extends PartialType(CreatePetDto) {}
