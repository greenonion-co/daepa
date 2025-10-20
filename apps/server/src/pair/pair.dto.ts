import { ApiExtraModels, ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { LayingBaseDto } from 'src/laying/laying.dto';
import { PET_SPECIES } from 'src/pet/pet.constants';
import { PetDto, PetLayingDto } from 'src/pet/pet.dto';

export class PairBaseDto {
  @ApiProperty({
    description: '페어 ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '주인 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  ownerId: string;

  @ApiProperty({
    description: '펫 종',
    example: PET_SPECIES.CRESTED,
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
  })
  @IsString()
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({
    description: '아빠 펫 ID',
    example: 'PET_XXXXXXXX',
  })
  @IsString()
  fatherId: string;

  @ApiProperty({
    description: '엄마 펫 ID',
    example: 'PET_XXXXXXXX',
  })
  @IsString()
  motherId: string;

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

class PairParentDto extends PickType(PetDto, [
  'petId',
  'name',
  'sex',
  'morphs',
  'traits',
  'weight',
  'growth',
  'photos',
]) {}

export class PairDto extends PickType(PairBaseDto, ['id', 'species']) {
  @ApiProperty({
    description: '아빠 펫 정보',
    example: {},
    required: false,
    type: PairParentDto,
  })
  @IsOptional()
  @IsObject()
  father?: PairParentDto;

  @ApiProperty({
    description: '엄마 펫 정보',
    example: {},
    required: false,
    type: PairParentDto,
  })
  @IsOptional()
  @IsObject()
  mother?: PairParentDto;

  @Exclude()
  declare ownerId: string;

  @Exclude()
  declare fatherId: string;

  @Exclude()
  declare motherId: string;
}

class LayingWithPetsDto extends PickType(LayingBaseDto, ['clutch']) {
  @ApiProperty({
    description: '산란 ID',
    example: 1,
  })
  @IsNumber()
  layingId: number;

  @ApiProperty({
    description: '산란 날짜',
    example: '2025-01-01',
    format: 'date',
  })
  @IsString()
  layingDate: string;

  @ApiProperty({
    description: '펫 정보',
    required: false,
    type: [PetLayingDto],
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  pets?: PetLayingDto[];
}

class MatingWithLayingsDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  @IsNumber()
  matingId: number;

  @ApiProperty({
    description: '메이팅 날짜',
    example: '2025-01-01',
    format: 'date',
  })
  @IsString()
  matingDate: string;

  @ApiProperty({
    description: '산란 정보',
    required: false,
    type: [LayingWithPetsDto],
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  layings?: LayingWithPetsDto[];
}

@ApiExtraModels(MatingWithLayingsDto)
export class PairDetailDto {
  @ApiProperty({
    description: '페어 ID',
    example: 1,
  })
  @IsNumber()
  pairId: number;

  @ApiProperty({
    description: '아빠 펫 ID',
    example: 'XXXXXX',
  })
  @IsString()
  fatherId: string;

  @ApiProperty({
    description: '엄마 펫 ID',
    example: 'YYYYYYY',
  })
  @IsString()
  motherId: string;

  @ApiProperty({
    description: '메이팅 정보',
    required: false,
    type: [MatingWithLayingsDto],
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  matings?: MatingWithLayingsDto[];
}

export class PairFilterDto extends PickType(PairBaseDto, ['species']) {}
