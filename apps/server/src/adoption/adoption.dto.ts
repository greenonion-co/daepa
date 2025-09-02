import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { UserProfilePublicDto } from '../user/user.dto';

import { PetSummaryWithoutOwnerDto } from '../pet/pet.dto';
import {
  ADOPTION_SALE_STATUS,
  PET_ADOPTION_LOCATION,
  PET_SPECIES,
} from 'src/pet/pet.constants';
import { CommonResponseDto } from 'src/common/response.dto';
import { PageOptionsDto } from 'src/common/page.dto';

export class AdoptionBaseDto {
  @ApiProperty({
    description: '분양 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  adoptionId: string;

  @ApiProperty({
    description: '펫 ID',
    example: 'PET_XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '분양 가격',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : Math.floor(num);
  })
  price?: number;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDate()
  adoptionDate?: Date;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @IsOptional()
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
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '펫 판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
  })
  status?: ADOPTION_SALE_STATUS;
}

export class CreateAdoptionDto {
  @ApiProperty({
    description: '펫 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '분양 가격',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : Math.floor(num);
  })
  price?: number;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-15',
    required: false,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  adoptionDate?: Date;

  @ApiProperty({
    description: '입양자 ID',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @IsOptional()
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
    description: '판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(ADOPTION_SALE_STATUS)
  status?: ADOPTION_SALE_STATUS;
}

export class UpdateAdoptionDto extends PartialType(CreateAdoptionDto) {
  @ApiProperty({
    description: '입양자 ID',
    example: 'USER_XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  buyerId?: string;
}

export class AdoptionDto extends PickType(AdoptionBaseDto, [
  'adoptionId',
  'petId',
  'price',
  'adoptionDate',
  'memo',
  'location',
  'status',
] as const) {
  @ApiProperty({
    description: '분양자 정보',
  })
  seller: UserProfilePublicDto;

  @ApiProperty({
    description: '입양자 정보',
    required: false,
  })
  @IsOptional()
  buyer?: UserProfilePublicDto;

  @ApiProperty({
    description: '펫 정보',
  })
  pet: PetSummaryWithoutOwnerDto;
}

export class AdoptionDetailResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '분양 정보',
  })
  data: AdoptionDto;
}

export class AdoptionFilterDto extends PageOptionsDto {
  @ApiProperty({
    description: '검색 키워드',
    example: '대파',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '펫 종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SPECIES)
  species?: PET_SPECIES;

  @ApiProperty({
    description: '펫 판매 상태',
    example: 'ON_SALE',
    enum: ADOPTION_SALE_STATUS,
    'x-enumNames': Object.keys(ADOPTION_SALE_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(ADOPTION_SALE_STATUS)
  status?: ADOPTION_SALE_STATUS;
}
