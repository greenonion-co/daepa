import {
  IsArray,
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import {
  PET_ADOPTION_LOCATION,
  ADOPTION_SALE_STATUS,
  PET_SEX,
  PET_SPECIES,
  PET_GROWTH,
  PET_LIST_FILTER_TYPE,
} from './pet.constants';
import {
  ApiProperty,
  OmitType,
  PartialType,
  PickType,
  getSchemaPath,
} from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
import {
  PARENT_ROLE,
  PARENT_STATUS,
} from 'src/parent_request/parent_request.constants';
import { UserProfilePublicDto } from 'src/user/user.dto';
import { CreateParentDto } from 'src/parent_request/parent_request.dto';
import { PageOptionsDto } from 'src/common/page.dto';
import { PetEntity } from './pet.entity';

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
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

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
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hatchingDate?: Date;

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
  'hatchingDate',
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

export class PetSummaryWithLayingDto extends PetSummaryDto {
  @ApiProperty({
    description: '산란 아이디',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  layingId?: number;

  @ApiProperty({
    description: '산란 클러치',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutch?: number;

  @ApiProperty({
    description: '산란 클러치 순서',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutchOrder?: number;

  @ApiProperty({
    description: '펫 온도',
    example: 37.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    if (isNaN(num)) return undefined;
    // 소수점이 있으면 그대로, 없으면 .0 제거
    return num % 1 === 0 ? Math.floor(num) : num;
  })
  temperature?: number;
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
    example: 20240101,
  })
  @IsNumber()
  adoptionDate?: number;

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

  @ApiProperty({
    description: '알 클러치 개수',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutchCount?: number;

  @ApiProperty({
    description: '알 클러치',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutch?: number;

  @ApiProperty({
    description: '산란일',
    required: false,
  })
  @IsOptional()
  layingDate?: Date;

  @ApiProperty({
    description: '온도',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({
    description: '산란 아이디',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  layingId?: number;

  @ApiProperty({
    description: '클러치 순서',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutchOrder?: number;
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
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  startYmd?: Date; // 최소 생년월일

  @ApiProperty({
    description: '펫 최대 생년월일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  endYmd?: Date; // 최대 생년월일

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
    description: '펫 목록 필터링 타입',
    example: 'ALL',
    enum: PET_LIST_FILTER_TYPE,
    'x-enumNames': Object.keys(PET_LIST_FILTER_TYPE),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_LIST_FILTER_TYPE)
  filterType?: PET_LIST_FILTER_TYPE;
}

export class LinkParentDto {
  @ApiProperty({
    description: '부모 펫 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    description: '부모 역할',
    enum: PARENT_ROLE,
    'x-enumNames': Object.keys(PARENT_ROLE),
    example: PARENT_ROLE.FATHER,
  })
  @IsEnum(PARENT_ROLE)
  @IsNotEmpty()
  role: PARENT_ROLE;

  @ApiProperty({
    description: '연동 요청 메시지',
    required: false,
    example: '혈통 정보를 위해 연동 요청합니다.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CompleteHatchingDto {
  @ApiProperty({
    description: '해칭 날짜',
    example: '2024-01-01',
  })
  @IsDate()
  hatchingDate?: Date;
}

export class PetHatchingDateRangeDto {
  @ApiProperty({
    description: '해칭 날짜 범위',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: '해칭 날짜 범위',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class PetFamilyPairGroupDto {
  @ApiProperty({
    description: '해당 pair에 속한 펫 리스트',
    type: 'array',
    items: { $ref: getSchemaPath(PetEntity) },
  })
  @IsArray()
  petList: PetEntity[];

  @ApiProperty({
    description: '아버지 펫 정보',
    type: () => PetFamilyParentDto,
    nullable: true,
  })
  @IsOptional()
  father: PetFamilyParentDto | null;

  @ApiProperty({
    description: '어머니 펫 정보',
    type: () => PetFamilyParentDto,
    nullable: true,
  })
  @IsOptional()
  mother: PetFamilyParentDto | null;
}

export class PetFamilyParentDto {
  @ApiProperty({ description: '펫 ID', example: 'abc123' })
  @IsString()
  petId: string;

  @ApiProperty({ description: '펫 이름', example: '잠원동대파' })
  @IsString()
  name: string;
}

export class PetFamilyTreeResponseDto {
  @ApiProperty({
    description: 'pairId별로 그룹화된 펫 데이터',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath(PetFamilyPairGroupDto),
    },
  })
  pairData: Record<string, PetFamilyPairGroupDto>;
}
