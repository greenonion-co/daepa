import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { UserProfilePublicDto } from '../user/user.dto';

import { PetSummaryAdoptionDto } from '../pet/pet.dto';
import {
  ADOPTION_SALE_STATUS,
  PET_ADOPTION_METHOD,
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
    description: '분양 방식',
    example: 'ONLINE',
    enum: PET_ADOPTION_METHOD,
    'x-enumNames': Object.keys(PET_ADOPTION_METHOD),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_METHOD)
  method?: PET_ADOPTION_METHOD;

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
    description: '분양 방식',
    example: 'DELIVERY',
    enum: PET_ADOPTION_METHOD,
    'x-enumNames': Object.keys(PET_ADOPTION_METHOD),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_METHOD)
  method?: PET_ADOPTION_METHOD;

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
  'method',
  'status',
] as const) {
  @ApiProperty({
    description: '분양자 정보',
  })
  @IsOptional()
  seller?: UserProfilePublicDto;

  @ApiProperty({
    description: '입양자 정보',
    required: false,
  })
  @IsOptional()
  buyer?: UserProfilePublicDto;

  @ApiProperty({
    description: '펫 정보',
    type: PetSummaryAdoptionDto,
  })
  @ValidateNested()
  @Type(() => PetSummaryAdoptionDto)
  pet: PetSummaryAdoptionDto;
}

export class AdoptionDetailResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '분양 정보',
  })
  data: AdoptionDto;
}

export class AdoptionFilterDto extends PageOptionsDto {
  @ApiProperty({
    description: '검색 키워드',
    example: '대파',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '펫 종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SPECIES)
  species?: PET_SPECIES;

  @ApiProperty({
    description: '펫 모프',
    example: ['릴리화이트', '아잔틱헷100%'],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(
        (v): v is string => typeof v === 'string' && v.trim().length > 0,
      );
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) return undefined;
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v): v is string => typeof v === 'string' && v.trim().length > 0,
          );
        }
      } catch {
        // ignore parse error and fallback to comma-split
      }
      return trimmed
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    return undefined;
  })
  @IsArray()
  morphs?: string[];

  @ApiProperty({
    description: '펫 형질',
    example: ['트익할', '풀핀'],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(
        (v): v is string => typeof v === 'string' && v.trim().length > 0,
      );
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) return undefined;
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v): v is string => typeof v === 'string' && v.trim().length > 0,
          );
        }
      } catch {
        // ignore parse error and fallback to comma-split
      }
      return trimmed
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    return undefined;
  })
  @IsArray()
  traits?: string[];

  @ApiProperty({
    description: '펫 성별',
    example: ['M', 'F'],
    type: 'array',
    items: {
      enum: Object.values(PET_SEX),
      type: 'string',
      'x-enumNames': Object.keys(PET_SEX),
    },
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(
        (v): v is PET_SEX =>
          typeof v === 'string' &&
          v.trim().length > 0 &&
          Object.values(PET_SEX).includes(v as PET_SEX),
      );
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) return undefined;
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v): v is PET_SEX =>
              typeof v === 'string' &&
              v.trim().length > 0 &&
              Object.values(PET_SEX).includes(v as PET_SEX),
          );
        }
      } catch {
        // ignore parse error and fallback to comma-split
      }
      return trimmed
        .split(',')
        .map((v) => v.trim())
        .filter(
          (v): v is PET_SEX =>
            v.length > 0 && Object.values(PET_SEX).includes(v as PET_SEX),
        );
    }
    return undefined;
  })
  @IsArray()
  @IsEnum(PET_SEX, { each: true })
  sex?: PET_SEX[]; // 성별 필터

  @ApiProperty({
    description: '펫 성장단계',
    example: ['BABY', 'JUVENILE'],
    type: 'array',
    items: {
      enum: Object.values(PET_GROWTH),
      type: 'string',
      'x-enumNames': Object.keys(PET_GROWTH),
    },
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(
        (v): v is PET_GROWTH =>
          typeof v === 'string' &&
          v.trim().length > 0 &&
          Object.values(PET_GROWTH).includes(v as PET_GROWTH),
      );
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) return undefined;
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v): v is PET_GROWTH =>
              typeof v === 'string' &&
              v.trim().length > 0 &&
              Object.values(PET_GROWTH).includes(v as PET_GROWTH),
          );
        }
      } catch {
        // ignore parse error and fallback to comma-split
      }
      return trimmed
        .split(',')
        .map((v) => v.trim())
        .filter(
          (v): v is PET_GROWTH =>
            v.length > 0 && Object.values(PET_GROWTH).includes(v as PET_GROWTH),
        );
    }
    return undefined;
  })
  @IsArray()
  @IsEnum(PET_GROWTH, { each: true })
  growth?: PET_GROWTH[]; // 크기 검색

  @ApiProperty({
    description: '펫 판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(ADOPTION_SALE_STATUS)
  status?: ADOPTION_SALE_STATUS;

  @ApiProperty({
    description: '분양 방식',
    example: 'PICKUP',
    enum: PET_ADOPTION_METHOD,
    'x-enumNames': Object.keys(PET_ADOPTION_METHOD),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_METHOD)
  method?: PET_ADOPTION_METHOD;

  @ApiProperty({
    description: '최소 분양 가격',
    example: 100000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiProperty({
    description: '최대 분양 가격',
    example: 200000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({
    description: '최소 분양 날짜',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date; // 최소 분양 날짜

  @ApiProperty({
    description: '최대 분양 날짜',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date; // 최대 분양 날짜
}
