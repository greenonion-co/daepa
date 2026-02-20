import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
import { UserProfilePublicDto } from '../user/user.dto';
import { PetSummaryDto } from '../pet/pet.dto';
import {
  PET_ADOPTION_METHOD,
  PET_GROWTH,
  PET_SEX,
  PET_SPECIES,
} from 'src/pet/pet.constants';
import { PageOptionsDto } from 'src/common/page.dto';

// completeAdoption 시점에 JSON으로 저장되는 펫 스냅샷
export interface PetSnapshotData {
  petId: string;
  type?: string;
  name?: string;
  species: string;
  sex?: string;
  growth?: string;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isDeleted?: boolean;
  father?: { petId: string; name?: string } | null;
  mother?: { petId: string; name?: string } | null;
}

// 분양완료 처리 요청 DTO
export class CompleteAdoptionDto {
  @ApiProperty({
    description: '거래가',
    example: 50000,
    required: false,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiProperty({
    description: '입양자 ID',
    example: 'USER_XXXXXXXX',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  buyerId?: string | null;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-15',
    required: false,
    nullable: true,
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  adoptionDate?: Date | null;

  @ApiProperty({
    description: '거래 방식',
    example: 'DELIVERY',
    enum: PET_ADOPTION_METHOD,
    'x-enumNames': Object.keys(PET_ADOPTION_METHOD),
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_METHOD)
  method?: PET_ADOPTION_METHOD | null;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  memo?: string | null;
}

// 분양 완료 시점의 부/모 개체 스냅샷
export class PetSnapshotParentDto {
  @ApiProperty({ description: '부/모 개체 ID' })
  @IsString()
  petId: string;

  @ApiProperty({ description: '부/모 개체 이름', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

// 분양 완료 시점의 펫 스냅샷
export class PetAdoptionCompletedDto extends PickType(PetSummaryDto, [
  'petId',
  'type',
  'name',
  'species',
  'sex',
  'growth',
  'morphs',
  'traits',
  'isDeleted',
]) {
  @ApiProperty({
    description: '해칭일 (yyyy-MM-dd)',
    type: 'string',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  hatchingDate?: string;

  @ApiProperty({
    description: '아빠 개체 정보',
    type: PetSnapshotParentDto,
    required: false,
  })
  @IsOptional()
  father?: PetSnapshotParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    type: PetSnapshotParentDto,
    required: false,
  })
  @IsOptional()
  mother?: PetSnapshotParentDto;

  @Exclude()
  declare desc?: string;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;
}

// 분양 이력 수정 DTO (현재 memo만 수정 가능)
export class UpdateAdoptionHistoryDto {
  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    type: 'string',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  memo?: string | null;
}

// 분양 이력 (판매완료 기록) 조회용 DTO
export class AdoptionHistoryDto {
  @ApiProperty({ description: '분양 이력 ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '펫 ID' })
  @IsString()
  petId: string;

  @ApiProperty({ description: '거래가', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: '분양 날짜', required: false })
  @IsOptional()
  @IsDate()
  adoptionDate?: Date;

  @ApiProperty({ description: '메모', required: false })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '거래 방식',
    enum: PET_ADOPTION_METHOD,
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_METHOD)
  method?: PET_ADOPTION_METHOD;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '분양자 정보', required: false })
  @IsOptional()
  seller?: UserProfilePublicDto;

  @ApiProperty({ description: '입양자 정보', required: false })
  @IsOptional()
  buyer?: UserProfilePublicDto;

  @ApiProperty({
    description: '펫 정보 (스냅샷이 없으면 {})',
    type: PetAdoptionCompletedDto,
  })
  @ValidateNested()
  @Type(() => PetAdoptionCompletedDto)
  pet: PetAdoptionCompletedDto;
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

  @ApiProperty({
    description: '부 개체 ID',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string; // 부 개체 필터

  @ApiProperty({
    description: '모 개체 ID',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string; // 모 개체 필터
}
