import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { UserProfilePublicDto } from '../user/user.dto';

import { PetSummaryWithoutOwnerDto } from '../pet/pet.dto';
import {
  ADOPTION_SALE_STATUS,
  PET_ADOPTION_LOCATION,
  PET_GROWTH,
  PET_SEX,
  PET_SPECIES,
} from 'src/pet/pet.constants';
import { CommonResponseDto } from 'src/common/response.dto';
import { PageOptionsDto } from 'src/common/page.dto';

export class AdoptionBaseDto {
  @ApiProperty({
    description: '분양 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  adoptionId: string;

  @ApiProperty({
    description: '펫 ID',
    example: 'PET_XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '분양 가격',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : Math.floor(num);
  })
  price?: number;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDate()
  adoptionDate?: Date;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '분양 위치',
    example: 'ONLINE',
    enum: PET_ADOPTION_LOCATION,
    'x-enumNames': Object.keys(PET_ADOPTION_LOCATION),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_LOCATION)
  location?: PET_ADOPTION_LOCATION;

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '펫 판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
  })
  status?: ADOPTION_SALE_STATUS;
}

export class CreateAdoptionDto {
  @ApiProperty({
    description: '펫 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '분양 가격',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : Math.floor(num);
  })
  price?: number;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-15',
    required: false,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  adoptionDate?: Date;

  @ApiProperty({
    description: '입양자 ID',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '분양 위치',
    example: 'ONLINE',
    enum: PET_ADOPTION_LOCATION,
    'x-enumNames': Object.keys(PET_ADOPTION_LOCATION),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_LOCATION)
  location?: PET_ADOPTION_LOCATION;

  @ApiProperty({
    description: '판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(ADOPTION_SALE_STATUS)
  status?: ADOPTION_SALE_STATUS;
}

export class UpdateAdoptionDto extends PartialType(CreateAdoptionDto) {
  @ApiProperty({
    description: '입양자 ID',
    example: 'USER_XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  buyerId?: string;
}

export class AdoptionDto extends PickType(AdoptionBaseDto, [
  'adoptionId',
  'petId',
  'price',
  'adoptionDate',
  'memo',
  'location',
  'status',
] as const) {
  @ApiProperty({
    description: '분양자 정보',
  })
  seller: UserProfilePublicDto;

  @ApiProperty({
    description: '입양자 정보',
    required: false,
  })
  @IsOptional()
  buyer?: UserProfilePublicDto;

  @ApiProperty({
    description: '펫 정보',
  })
  pet: PetSummaryWithoutOwnerDto;
}

export class AdoptionDetailResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '분양 정보',
  })
  data: AdoptionDto;
}

export class AdoptionFilterDto extends PageOptionsDto {
  @ApiProperty({
    description: '검색 키워드 (이름, 설명 등)',
    example: '대파',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string; // 이름, 설명 등 텍스트 검색

  @ApiProperty({
    description: '펫 종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SPECIES)
  species?: PET_SPECIES; // 종별 필터

  @ApiProperty({
    description: '펫 성별',
    example: 'M',
    enum: PET_SEX,
    'x-enumNames': Object.keys(PET_SEX),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SEX)
  sex?: PET_SEX; // 성별 필터

  @ApiProperty({
    description: '펫 공개 여부',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  isPublic?: number; // 공개 여부 필터

  @ApiProperty({
    description: '펫 최소 생년월일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDate()
  startYmd?: Date; // 최소 생년월일

  @ApiProperty({
    description: '펫 최대 생년월일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDate()
  endYmd?: Date; // 최대 생년월일

  @ApiProperty({
    description: '펫 모프',
    example: ['릴리화이트', '아잔틱헷100%'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  morphs?: string[]; // 모프 검색

  @ApiProperty({
    description: '펫 형질',
    example: ['트익할', '풀핀'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  traits?: string[]; // 형질 검색

  @ApiProperty({
    description: '펫 먹이',
    example: '판게아 인섹트',
    required: false,
  })
  @IsOptional()
  @IsString()
  foods?: string; // 먹이 검색

  @ApiProperty({
    description: '판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(ADOPTION_SALE_STATUS)
  status?: ADOPTION_SALE_STATUS; // 판매 상태 검색

  @ApiProperty({
    description: '펫 성장단계',
    example: 'BABY',
    enum: PET_GROWTH,
    'x-enumNames': Object.keys(PET_GROWTH),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_GROWTH)
  growth?: PET_GROWTH; // 크기 검색
}
