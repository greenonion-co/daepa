import { ApiProperty, getSchemaPath, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PET_SPECIES } from 'src/pet/pet.constants';

export class LayingBaseDto {
  @ApiProperty({
    description: '산란 ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  matingId?: number;

  @ApiProperty({
    description: '산란 날짜',
    example: '2025-01-01',
  })
  @IsDate()
  layingDate: Date;

  @ApiProperty({
    description: '차수(클러치)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clutch?: number;

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

export class LayingDto extends PickType(LayingBaseDto, [
  'id',
  'matingId',
  'layingDate',
  'clutch',
]) {
  @ApiProperty({
    description: '차수(클러치) 순서',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clutchOrder?: number;
}

export class CreateLayingDto extends PickType(LayingBaseDto, [
  'matingId',
  'layingDate',
  'clutch',
]) {
  @ApiProperty({
    description: '알 개수',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clutchCount?: number;

  @ApiProperty({
    description: '온도',
    example: 37.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({
    description: '펫 종',
    example: '크레스티드게코',
    required: true,
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
  })
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({
    description: '부 펫 ID',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  fatherId?: string;

  @ApiProperty({
    description: '모 펫 ID',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  motherId?: string;
}

export class UpdateLayingDto extends PickType(LayingBaseDto, ['clutch']) {
  @ApiProperty({
    description: '산란 날짜',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  layingDate?: string;
}

export class LayingByDateDto {
  @ApiProperty({
    description: '산란 ID',
    example: 1,
  })
  @IsNumber()
  layingId: number;

  @ApiProperty({
    description: '산란 날짜',
    example: '2025-01-01',
  })
  @IsString()
  layingDate: string;

  @ApiProperty({
    description: '산란 정보',
    type: 'array',
    items: { $ref: getSchemaPath('PetSummaryLayingDto') },
  })
  @IsArray()
  @IsObject({ each: true })
  layings: any[];
}
