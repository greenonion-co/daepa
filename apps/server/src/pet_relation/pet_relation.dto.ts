import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { PetSummaryDto, PetHiddenStatusDto } from 'src/pet/pet.dto';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import { PET_TYPE } from 'src/pet/pet.constants';

/**
 * Raw query result interface for getSiblingsWithDetails (내부 변환용)
 */
export interface RawSiblingQueryResult {
  // pet_relations
  petId: string;
  // pets
  name: string | null;
  species: string;
  hatchingDate: Date | null;
  layingId: number | null;
  type: string;
  ownerId: string | null;
  isPublic: boolean;
  isDeleted: boolean;
  // pet_details
  sex: string | null;
  morphs: string[] | null;
  traits: string[] | null;
  weight: number | null;
  growth: string | null;
  // users (owner)
  owner_userId: string | null;
  owner_name: string | null;
  owner_role: string | null;
  owner_isBiz: boolean | null;
  owner_status: string | null;
  // layings
  laying_id: number | null;
  laying_matingId: number | null;
  laying_layingDate: Date | null;
  laying_clutch: number | null;
  // matings
  mating_id: number | null;
  mating_pairId: number | null;
  mating_matingDate: Date | null;
}

/**
 * 형제 펫의 산란 정보
 */
export class SiblingLayingInfoDto {
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
    required: false,
  })
  @IsDate()
  @IsOptional()
  layingDate?: Date;

  @ApiProperty({
    description: '차수(클러치)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clutch?: number;
}

/**
 * 형제 펫의 메이팅 정보
 */
export class SiblingMatingInfoDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '펫 쌍 ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  pairId?: number;

  @ApiProperty({
    description: '메이팅 날짜',
    example: '2025-01-01',
    required: false,
  })
  @IsDate()
  @IsOptional()
  matingDate?: Date;
}

/**
 * 자식 펫 상세 정보 (PetSummaryDto 확장, laying/mating 제외)
 */
export class ChildPetDetailDto extends PetSummaryDto {}

/**
 * Raw query result interface for getChildrenWithDetails (내부 변환용)
 */
export interface RawChildQueryResult {
  // pet_relations
  petId: string;
  // pets
  name: string | null;
  species: string;
  hatchingDate: Date | null;
  type: string;
  ownerId: string | null;
  isPublic: boolean;
  isDeleted: boolean;
  // pet_details
  sex: string | null;
  morphs: string[] | null;
  traits: string[] | null;
  weight: number | null;
  growth: string | null;
  // users (owner)
  owner_userId: string | null;
  owner_name: string | null;
  owner_role: string | null;
  owner_isBiz: boolean | null;
  owner_status: string | null;
}

/**
 * 형제 펫 조회 응답 (페이지네이션)
 */
@ApiExtraModels(PetSummaryDto, PetHiddenStatusDto, PageMetaDto)
export class GetSiblingsPageResponseDto {
  @ApiProperty({
    description: '형제 펫 목록 (비공개인 경우 hiddenStatus만 포함)',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(PetSummaryDto) },
        { $ref: getSchemaPath(PetHiddenStatusDto) },
      ],
    },
  })
  @IsArray()
  data: (PetSummaryDto | PetHiddenStatusDto)[];

  @ApiProperty({
    description: '페이지 메타 정보',
    type: PageMetaDto,
  })
  @IsObject()
  meta: PageMetaDto;
}

/**
 * 자식 펫 조회 응답 (페이지네이션)
 */
@ApiExtraModels(ChildPetDetailDto, PetHiddenStatusDto, PageMetaDto)
export class GetChildrenPageResponseDto {
  @ApiProperty({
    description: '자식 펫 목록 (비공개인 경우 hiddenStatus만 포함)',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(ChildPetDetailDto) },
        { $ref: getSchemaPath(PetHiddenStatusDto) },
      ],
    },
  })
  @IsArray()
  data: (ChildPetDetailDto | PetHiddenStatusDto)[];

  @ApiProperty({
    description: '페이지 메타 정보',
    type: PageMetaDto,
  })
  @IsObject()
  meta: PageMetaDto;
}

/**
 * 클러치 메이트 (같은 layingId 또는 부모가 같고 layingDate/hatchingDate가 같은 형제) 조회 응답
 */
@ApiExtraModels(PetSummaryDto, PetHiddenStatusDto)
export class GetClutchMatesResponseDto {
  @ApiProperty({
    description: '클러치 메이트 목록 (비공개인 경우 hiddenStatus만 포함)',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(PetSummaryDto) },
        { $ref: getSchemaPath(PetHiddenStatusDto) },
      ],
    },
  })
  @IsArray()
  data: (PetSummaryDto | PetHiddenStatusDto)[];
}

/**
 * 형제 펫 조회 쿼리 파라미터 (페이지네이션 + type 필터)
 */
export class GetSiblingsQueryDto extends PageOptionsDto {
  @ApiProperty({
    description: '펫 타입 필터 (EGG, PET)',
    enum: PET_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_TYPE)
  readonly type?: PET_TYPE;
}

/**
 * 클러치 메이트 조회 쿼리 파라미터 (type 필터만)
 */
export class GetClutchMatesQueryDto {
  @ApiProperty({
    description: '펫 타입 필터 (EGG, PET)',
    enum: PET_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_TYPE)
  readonly type?: PET_TYPE;
}
