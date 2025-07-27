import {
  IsArray,
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import {
  PET_ADOPTION_LOCATION,
  ADOPTION_SALE_STATUS,
  PET_SEX,
  PET_SPECIES,
  PET_GROWTH,
} from './pet.constants';
import {
  ApiProperty,
  OmitType,
  PartialType,
  PickType,
  getSchemaPath,
} from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import { PARENT_STATUS } from 'src/parent/parent.constant';
import { UserProfilePublicDto } from 'src/user/user.dto';
import { CreateParentDto } from 'src/parent/parent.dto';
import { PageOptionsDto } from 'src/common/page.dto';

export class PetBaseDto {
  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '펫 주인 정보',
  })
  @IsObject()
  owner: UserProfilePublicDto;

  @ApiProperty({
    description: '펫 이름',
    example: '대파',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '펫 종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
  })
  @IsString()
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({
    description: '펫 모프',
    example: ['릴리화이트', '아잔틱헷100%'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  morphs?: string[];

  @ApiProperty({
    description: '펫 형질',
    example: ['트익할', '풀핀'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  traits?: string[];

  @ApiProperty({
    description: '펫 출생일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  birthdate?: number;

  @ApiProperty({
    description: '펫 성장단계',
    example: 'JUNIOR',
    required: false,
    enum: PET_GROWTH,
    'x-enumNames': Object.keys(PET_GROWTH),
  })
  @IsOptional()
  @IsEnum(PET_GROWTH)
  growth?: PET_GROWTH;

  @ApiProperty({
    description: '펫 공개 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '펫 성별(수컷, 암컷, 미구분)',
    example: 'M',
    required: false,
    enum: PET_SEX,
    'x-enumNames': Object.keys(PET_SEX),
  })
  @IsOptional()
  @IsEnum(PET_SEX)
  sex?: PET_SEX;

  @ApiProperty({
    description: '펫 몸무게(g)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  weight?: number;

  @ApiProperty({
    description: '펫 먹이',
    example: ['판게아 인섹트', '귀뚜라미'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  foods?: string[];

  @IsOptional()
  @IsArray()
  photos?: any[];

  @ApiProperty({
    description: '펫 소개말',
    example: '저희 대파는 혈통있는 가문 출신의 헷100% 릴리화이트 입니다',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;
}

export class PetSummaryDto extends PickType(PetBaseDto, [
  'petId',
  'name',
  'owner',
  'species',
  'morphs',
  'traits',
  'sex',
  'photos',
  'birthdate',
]) {
  @Exclude()
  declare growth?: PET_GROWTH;

  @Exclude()
  declare weight?: number;

  @Exclude()
  declare foods?: string[];

  @Exclude()
  declare desc?: string;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}

export class PetParentDto extends PartialType(PetSummaryDto) {
  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
    required: true,
  })
  @IsString()
  petId: string;

  @ApiProperty({ description: '부모 관계 테이블 row id' })
  @IsNumber()
  relationId: number;

  @ApiProperty({
    description: '펫 주인 정보',
    required: true,
  })
  @IsObject()
  owner: UserProfilePublicDto;

  @ApiProperty({
    description: '펫 이름',
    example: '대파',
    required: true,
  })
  @IsString()
  name: string;

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
    description: '부모 관계 상태',
    enum: PARENT_STATUS,
    'x-enumNames': Object.keys(PARENT_STATUS),
  })
  @IsEnum(PARENT_STATUS)
  status: PARENT_STATUS;
}

export class PetAdoptionDto {
  @ApiProperty({
    description: '분양 아이디',
    example: 'XXXXXXXX',
    required: true,
  })
  @IsString()
  adoptionId: string;

  @ApiProperty({
    description: '분양 가격',
    example: 100000,
  })
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : Math.floor(num);
  })
  price?: number;

  @ApiProperty({
    description: '분양 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
  })
  @IsEnum(ADOPTION_SALE_STATUS)
  status?: ADOPTION_SALE_STATUS;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-01',
  })
  @IsNumber()
  adoptionDate?: Date;

  @ApiProperty({
    description: '메모',
    example: '대파는 혈통있는 가문 출신의 헷100% 릴리화이트 입니다',
  })
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '분양 위치',
    example: 'ONLINE',
    enum: PET_ADOPTION_LOCATION,
    'x-enumNames': Object.keys(PET_ADOPTION_LOCATION),
  })
  @IsEnum(PET_ADOPTION_LOCATION)
  location?: PET_ADOPTION_LOCATION;

  @ApiProperty({
    description: '분양 구매자 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  buyerId?: string;
}

export class PetDto extends PetBaseDto {
  @ApiProperty({
    description: '아빠 개체 정보',
    example: {},
    required: false,
  })
  @IsOptional()
  @IsObject()
  father?: PetParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    example: {},
    required: false,
  })
  @IsOptional()
  @IsObject()
  mother?: PetParentDto;

  @ApiProperty({
    description: '분양 정보',
    required: false,
  })
  @IsOptional()
  @IsObject()
  adoption?: PetAdoptionDto;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;
}

export class CreatePetDto extends OmitType(PetBaseDto, [
  'petId',
  'owner',
] as const) {
  @ApiProperty({
    description: '아빠 개체 정보',
    required: false,
  })
  @IsOptional()
  @IsObject()
  father?: CreateParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    required: false,
  })
  @IsOptional()
  @IsObject()
  mother?: CreateParentDto;
}

export class UpdatePetDto extends PartialType(CreatePetDto) {}

export class ParentWithChildrenDto {
  @ApiProperty({
    description: '부모 펫 정보',
    type: PetSummaryDto,
  })
  @IsObject()
  parent: PetSummaryDto;

  @ApiProperty({
    description: '자식 펫 목록',
    type: 'array',
    items: { $ref: getSchemaPath(PetSummaryDto) },
  })
  @IsArray()
  children: PetSummaryDto[];

  @ApiProperty({
    description: '자식 펫 수',
    example: 5,
  })
  @IsNumber()
  childrenCount: number;
}

export class PetFilterDto extends PageOptionsDto {
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
    description: '펫 소유자 아이디',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  ownerId?: string; // 소유자별 필터

  @ApiProperty({
    description: '펫 공개 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean; // 공개 여부 필터

  @ApiProperty({
    description: '펫 최소 몸무게',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minWeight?: number; // 최소 몸무게

  @ApiProperty({
    description: '펫 최대 몸무게',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxWeight?: number; // 최대 몸무게

  @ApiProperty({
    description: '펫 최소 생년월일',
    example: 20240101,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minBirthdate?: number; // 최소 생년월일

  @ApiProperty({
    description: '펫 최대 생년월일',
    example: 20240101,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxBirthdate?: number; // 최대 생년월일

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

  @ApiProperty({
    description: '타인 펫 포함 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeOthers?: boolean;
}
