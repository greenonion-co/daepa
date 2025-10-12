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
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import {
  PET_ADOPTION_LOCATION,
  ADOPTION_SALE_STATUS,
  PET_SEX,
  PET_SPECIES,
  PET_GROWTH,
  PET_LIST_FILTER_TYPE,
  PET_TYPE,
} from './pet.constants';
import {
  ApiExtraModels,
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
import { CommonResponseDto } from 'src/common/response.dto';
import { PetImageItem, UpsertPetImageDto } from 'src/pet_image/pet_image.dto';
import { EGG_STATUS } from 'src/egg_detail/egg_detail.constants';
import { PetDetailDto } from 'src/pet_detail/pet_detail.dto';
import { EggDetailDto } from 'src/egg_detail/egg_detail.dto';

export class HiddenParentDto {
  @ApiProperty({
    description: '숨김 여부',
    example: true,
  })
  @IsBoolean()
  isHidden: boolean;
}

export class PetBaseDto {
  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '펫 타입(egg/pet)',
    example: 'PET',
    enum: PET_TYPE,
    'x-enumNames': Object.keys(PET_TYPE),
    required: false,
  })
  @IsEnum(PET_TYPE)
  type?: PET_TYPE;

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
    description: '펫 이미지 목록',
    example: ['fileName1', 'fileName2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  photoOrder?: string[];

  @ApiProperty({
    description: '펫 소개말',
    example: '저희 대파는 혈통있는 가문 출신의 헷100% 릴리화이트 입니다',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({
    description: '펫 공개 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '펫 삭제 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @ApiProperty({
    description: '펫 상세 정보',
    type: PetDetailDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => PetDetailDto)
  @IsOptional()
  petDetail?: PetDetailDto;

  @ApiProperty({
    description: '알 상세 정보',
    type: EggDetailDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => EggDetailDto)
  @IsOptional()
  eggDetail?: EggDetailDto;
}

export class PetSummaryDto extends PickType(PetBaseDto, [
  'petId',
  'type',
  'name',
  'owner',
  'species',
  'photoOrder',
  'hatchingDate',
  'isPublic',
  'isDeleted',
]) {
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
    description: '펫 이미지 목록',
    required: false,
    type: 'array',
    items: { $ref: getSchemaPath(PetImageItem) },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetImageItem)
  photos?: PetImageItem[];

  @Exclude()
  declare desc?: string;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}

export class PetSummaryAdoptionDto extends PickType(PetSummaryDto, [
  'petId',
  'type',
  'name',
  'species',
  'sex',
  'morphs',
  'traits',
  'hatchingDate',
]) {
  @ApiProperty({
    description: '펫 이미지 목록',
    required: false,
    type: 'array',
    items: { $ref: getSchemaPath(PetImageItem) },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetImageItem)
  photos?: PetImageItem[];

  @Exclude()
  declare desc?: string;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}

export class PetSummaryLayingDto extends PickType(PetSummaryDto, [
  'petId',
  'name',
  'species',
  'hatchingDate',
  'sex',
  'morphs',
  'traits',
  'weight',
]) {
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

  @ApiProperty({
    description: '알 상태',
    example: 'HATCHED',
    enum: EGG_STATUS,
    'x-enumNames': Object.keys(EGG_STATUS),
  })
  @ValidateIf((o: Pick<PetBaseDto, 'type'>) => o.type === PET_TYPE.EGG)
  @IsOptional()
  @IsEnum(EGG_STATUS)
  eggStatus?: EGG_STATUS;
}

export class PetParentDto extends PickType(PetSummaryDto, [
  'petId',
  'name',
  'owner',
  'species',
  'hatchingDate',
  'isPublic',
  'isDeleted',
]) {
  @ApiProperty({
    description: '부모 관계 상태',
    enum: PARENT_STATUS,
    'x-enumNames': Object.keys(PARENT_STATUS),
  })
  @IsEnum(PARENT_STATUS)
  status: PARENT_STATUS;

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
    description: '펫 이미지 목록',
    required: false,
    type: 'array',
    items: { $ref: getSchemaPath(PetImageItem) },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetImageItem)
  photos?: PetImageItem[];

  @ApiProperty({
    description: '숨김 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
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
  @IsOptional()
  @IsDate()
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
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_LOCATION)
  location?: PET_ADOPTION_LOCATION;

  @ApiProperty({
    description: '분양 구매자',
    example: {},
    required: false,
  })
  @IsOptional()
  @IsObject()
  buyer?: UserProfilePublicDto;

  @ApiProperty({
    description: '분양 펫 아이디',
    example: 'XXXXXXXX',
    required: true,
  })
  @IsString()
  petId: string;
}

@ApiExtraModels(PetParentDto, HiddenParentDto)
export class PetDto extends PetBaseDto {
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
    description: '펫 먹이',
    example: ['판게아 인섹트', '귀뚜라미'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  foods?: string[];

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
    description: '부화 온도',
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({
    description: '알 상태',
    example: EGG_STATUS.UNFERTILIZED,
    enum: EGG_STATUS,
    required: false,
    'x-enumNames': Object.keys(EGG_STATUS),
  })
  @IsOptional()
  @IsEnum(EGG_STATUS)
  eggStatus?: EGG_STATUS;

  @ApiProperty({
    description: '아빠 개체 정보',
    example: {},
    required: false,
    oneOf: [
      { $ref: getSchemaPath(PetParentDto) },
      { $ref: getSchemaPath(HiddenParentDto) },
    ],
  })
  @IsOptional()
  @IsObject()
  father?: PetParentDto | HiddenParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    example: {},
    required: false,
    oneOf: [
      { $ref: getSchemaPath(PetParentDto) },
      { $ref: getSchemaPath(HiddenParentDto) },
    ],
  })
  @IsOptional()
  @IsObject()
  mother?: PetParentDto | HiddenParentDto;

  @ApiProperty({
    description: '분양 정보',
    required: false,
  })
  @IsOptional()
  @IsObject()
  adoption?: PetAdoptionDto;

  @ApiProperty({
    description: '부모 관계 상태',
    enum: PARENT_STATUS,
    'x-enumNames': Object.keys(PARENT_STATUS),
  })
  @IsOptional()
  @IsEnum(PARENT_STATUS)
  status?: PARENT_STATUS;

  @ApiProperty({
    description: '펫 이미지 목록',
    required: false,
    type: 'array',
    items: { $ref: getSchemaPath(PetImageItem) },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetImageItem)
  photos?: PetImageItem[];

  @Exclude()
  declare petDetail?: PetDetailDto | undefined;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;
}

@ApiExtraModels(UpsertPetImageDto)
export class CreatePetDto extends OmitType(PetBaseDto, [
  'petId',
  'owner',
  'petDetail',
  'eggDetail',
] as const) {
  @ApiProperty({
    description: '펫 타입',
    example: 'PET',
    enum: PET_TYPE,
    'x-enumNames': Object.keys(PET_TYPE),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_TYPE)
  type?: PET_TYPE;

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
    description: '펫 모프',
    example: ['릴리화이트', '아잔틱헷100%'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  morphs?: string[];

  @ApiProperty({
    description: '펫 형질',
    example: ['트익할', '풀핀'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traits?: string[];

  @ApiProperty({
    description: '펫 먹이',
    example: ['판게아 인섹트', '귀뚜라미'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foods?: string[];

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
  @IsDate()
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

  @ApiProperty({
    description: '펫 이미지 목록',
    required: false,
    type: 'array',
    items: { $ref: getSchemaPath(UpsertPetImageDto) },
  })
  @IsOptional()
  @IsArray()
  photos?: UpsertPetImageDto[];

  @ApiProperty({
    description: '알 상태',
    example: EGG_STATUS.UNFERTILIZED,
    enum: EGG_STATUS,
    required: false,
    'x-enumNames': Object.keys(EGG_STATUS),
  })
  @IsOptional()
  @IsEnum(EGG_STATUS)
  eggStatus?: EGG_STATUS;
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
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  isPublic?: number; // 공개 여부 필터

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
  @IsDate()
  startYmd?: Date; // 최소 생년월일

  @ApiProperty({
    description: '펫 최대 생년월일',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDate()
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

export class CompleteHatchingDto extends PickType(UpdatePetDto, [
  'hatchingDate',
  'name',
  'desc',
]) {}

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

export class FindPetByPetIdResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '펫 정보',
    type: PetDto,
  })
  data: PetDto;
}

export class FilterPetListResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '날짜 범위별 해칭 펫 목록',
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: getSchemaPath(PetDto) },
    },
  })
  data: Record<string, PetDto[]>;
}

export class VerifyPetNameDto {
  @ApiProperty({
    description: '펫 이름',
    example: '대파',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
