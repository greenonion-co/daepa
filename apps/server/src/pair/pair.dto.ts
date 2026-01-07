import { ApiExtraModels, ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PageOptionsDto } from 'src/common/page.dto';
import { EGG_STATUS } from 'src/egg_detail/egg_detail.constants';
import { LayingBaseDto, LayingByDateDto } from 'src/laying/laying.dto';
import { PET_SPECIES } from 'src/pet/pet.constants';
import { PetDto, PetLayingDto, PetSummaryLayingDto } from 'src/pet/pet.dto';
import { PetImageItem } from 'src/pet_image/pet_image.dto';

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
    description: '해칭 메모',
    example: '메이팅 메모입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;

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
]) {
  @ApiProperty({
    description: '펫 대표 이미지',
    required: false,
    type: PetImageItem,
  })
  @IsOptional()
  @IsObject()
  @Type(() => PetImageItem)
  thumbnail?: PetImageItem;
}

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
    required: false,
  })
  @IsString()
  @IsOptional()
  layingDate?: string;

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
    required: false,
  })
  @IsOptional()
  @IsString()
  matingDate?: string;

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

export class PairFilterDto extends PageOptionsDto {
  @ApiProperty({
    description: '펫 종',
    example: PET_SPECIES.CRESTED,
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SPECIES)
  species?: PET_SPECIES;

  @ApiProperty({
    description: '메이팅 최소 날짜',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startYmd?: string;

  @ApiProperty({
    description: '메이팅 최대 날짜',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endYmd?: string;

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

  @ApiProperty({
    description: '알 상태',
    example: EGG_STATUS.UNFERTILIZED,
    enum: EGG_STATUS,
    'x-enumNames': Object.keys(EGG_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(EGG_STATUS)
  eggStatus?: EGG_STATUS;
}

export class UpdatePairDto extends PickType(PairBaseDto, ['desc']) {}

class MatingByDateDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '메이팅 날짜',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  matingDate?: string;

  @ApiProperty({
    description: '산란 정보',
    required: false,
    isArray: true,
    type: LayingByDateDto,
  })
  @IsOptional()
  @IsArray()
  layingsByDate?: LayingByDateDto[];
}

export class MatingByParentsDto {
  @ApiProperty({
    description: '아빠 펫 정보',
    type: PetSummaryLayingDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  father?: PetSummaryLayingDto;

  @ApiProperty({
    description: '엄마 펫 정보',
    type: PetSummaryLayingDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  mother?: PetSummaryLayingDto;

  @ApiProperty({
    description: '메이팅 정보',
    type: MatingByDateDto,
    isArray: true,
  })
  @IsArray()
  matingsByDate: MatingByDateDto[];

  @ApiProperty({
    description: '페어 메모',
    example: '이 페어에 대한 메모입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({
    description: '펫 쌍 ID',
    example: 1,
  })
  @IsNumber()
  pairId: number;
}
