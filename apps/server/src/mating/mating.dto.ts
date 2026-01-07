import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsDate,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsNumber()
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
]) {
  @ApiProperty({
    description: '해칭 메모',
    example: '메이팅 메모입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;
}
