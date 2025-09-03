import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsDate,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PageOptionsDto } from 'src/common/page.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { LayingByDateDto } from 'src/laying/laying.dto';
import { PetSummaryDto } from 'src/pet/pet.dto';
import { PET_SPECIES } from 'src/pet/pet.constants';

export class MatingBaseDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '펫 쌍 ID',
    example: 'PAIR_XXXXXXXX',
  })
  @IsString()
  pairId: number;

  @ApiProperty({
    description: '아빠 펫 ID',
    example: 'PET_XXXXXXXX',
    required: false,
  })
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '엄마 펫 ID',
    example: 'PET_XXXXXXXX',
    required: false,
  })
  @IsString()
  motherId?: string;

  @ApiProperty({
    description: '메이팅 날짜',
    example: '2025-01-01',
  })
  @IsDateString()
  matingDate: string;

  @ApiProperty({
    description: '생성일',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  @IsDate()
  updatedAt: Date;
}

export class MatingDto extends PickType(MatingBaseDto, [
  'id',
  'fatherId',
  'motherId',
  'matingDate',
]) {}

export class CreateMatingDto extends PickType(MatingBaseDto, [
  'fatherId',
  'motherId',
  'matingDate',
]) {
  @ApiProperty({
    description: '종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
  })
  @IsEnum(PET_SPECIES)
  species?: PET_SPECIES;
}

export class UpdateMatingDto extends PickType(MatingBaseDto, [
  'fatherId',
  'motherId',
  'matingDate',
]) {}

class MatingByDateDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '메이팅 날짜',
    example: '2025-01-01',
  })
  @IsDateString()
  matingDate: string;

  @ApiProperty({
    description: '산란 정보',
    required: false,
    isArray: true,
    type: LayingByDateDto,
  })
  layingsByDate?: LayingByDateDto[];
}

export class MatingByParentsDto {
  @ApiProperty({
    description: '아빠 펫 정보',
    type: PetSummaryDto,
    required: false,
  })
  father?: PetSummaryDto;

  @ApiProperty({
    description: '엄마 펫 정보',
    type: PetSummaryDto,
    required: false,
  })
  mother?: PetSummaryDto;

  @ApiProperty({
    description: '메이팅 정보',
    type: MatingByDateDto,
    isArray: true,
  })
  matingsByDate: MatingByDateDto[];
}

export class MatingDetailResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '메이팅 정보',
    type: [MatingByParentsDto],
  })
  data: MatingByParentsDto[];
}

export class MatingFilterDto extends PageOptionsDto {
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
    description: '펫 최소 생년월일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startYmd?: string; // 최소 생년월일

  @ApiProperty({
    description: '펫 최대 생년월일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endYmd?: string; // 최대 생년월일

  @ApiProperty({
    description: '아빠 펫 ID',
    example: 'PET_XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '엄마 펫 ID',
    example: 'PET_XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string;
}
