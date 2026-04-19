import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  PET_ADOPTION_STATUS,
  PET_GROWTH,
  PET_SEX,
  PET_SPECIES,
} from './pet.constants';
import { PetImageItem } from '../pet_image/pet_image.dto';

export class BulkCreatePetRowDto {
  @ApiProperty({ description: '개체 이름', example: '대파' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '종',
    example: PET_SPECIES.CRESTED,
    enum: PET_SPECIES,
  })
  @IsNotEmpty()
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({ description: '성별', enum: PET_SEX, required: false })
  @IsOptional()
  @IsEnum(PET_SEX)
  sex?: PET_SEX;

  @ApiProperty({ description: '성장단계', enum: PET_GROWTH, required: false })
  @IsOptional()
  @IsEnum(PET_GROWTH)
  growth?: PET_GROWTH;

  @ApiProperty({
    description: '해칭일 (yyyy-MM-dd)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  hatchingDate?: string;

  @ApiProperty({ description: '공개 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: '브리더펫 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isBreeder?: boolean;

  @ApiProperty({ description: '모프', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  morphs?: string[];

  @ApiProperty({ description: '형질', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traits?: string[];

  @ApiProperty({ description: '먹이', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foods?: string[];

  @ApiProperty({ description: '몸무게(g)', required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    description: '분양상태',
    enum: PET_ADOPTION_STATUS,
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_STATUS)
  adoptionStatus?: PET_ADOPTION_STATUS;

  @ApiProperty({ description: '부개체 이름', required: false })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiProperty({ description: '모개체 이름', required: false })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiProperty({
    description: '펫 이미지 (PENDING/* 키 사용 — 서버가 {petId}/*로 복사)',
    type: [PetImageItem],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: '이미지는 최대 3장까지 등록 가능합니다.' })
  @ValidateNested({ each: true })
  @Type(() => PetImageItem)
  images?: PetImageItem[];
}

export class BulkCreatePetDto {
  @ApiProperty({ description: '개체 목록', type: [BulkCreatePetRowDto] })
  @IsArray()
  @ArrayMaxSize(100, { message: '최대 100개까지 등록할 수 있습니다.' })
  @ValidateNested({ each: true })
  @Type(() => BulkCreatePetRowDto)
  pets: BulkCreatePetRowDto[];
}

/** 대량 등록 시 발생한 행 단위 검증 오류 */
export class BulkCreatePetErrorItem {
  @ApiProperty({
    description: '오류가 발생한 행 인덱스 (0-based). 전역 오류는 생략',
    required: false,
  })
  rowIndex?: number;

  @ApiProperty({ description: '오류 필드명', required: false })
  field?: string;

  @ApiProperty({ description: '오류 코드' })
  code: string;

  @ApiProperty({ description: '오류 메시지' })
  message: string;
}

/** 대량 등록 성공 응답 */
export class BulkCreatePetResultDto {
  @ApiProperty({ description: '성공적으로 생성된 개체 수' })
  successCount: number;

  @ApiProperty({ description: '생성된 개체의 petId 목록', type: [String] })
  createdPetIds: string[];
}
