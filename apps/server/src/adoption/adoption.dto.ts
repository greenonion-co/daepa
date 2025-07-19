import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserProfilePublicDto } from '../user/user.dto';

import { PetDto, PetSummaryDto } from '../pet/pet.dto';
import { ADOPTION_SALE_STATUS } from 'src/pet/pet.constants';

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
    description: '거래 장소',
    example: '서울시 강남구',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

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
    description: '거래 장소',
    example: '서울시 강남구',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

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
  'createdAt',
  'updatedAt',
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
  pet: PetSummaryDto;
}
export class AdoptionWithPetDto extends OmitType(AdoptionBaseDto, [
  'location',
] as const) {
  @ApiProperty({
    description: '펫 정보',
  })
  pet: PetDto;
}

export class createAdoptionResponseDto {
  @ApiProperty({
    description: '분양 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  adoptionId: string;
}
