import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ADOPTION_STATUS } from './adoption.entity';
import { UserProfilePublicDto } from '../user/user.dto';

export class AdoptionBaseDto {
  @ApiProperty({
    description: '분양 ID',
    example: 'XXXXXXXX',
  })
  @Expose({ name: 'adoptionId' })
  @IsString()
  adoptionId: string;

  @ApiProperty({
    description: '펫 ID',
    example: 'PET_XXXXXXXX',
  })
  @Expose({ name: 'petId' })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '분양 가격',
    example: 50000,
    required: false,
  })
  @Expose({ name: 'price' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: '분양 날짜',
    example: '2024-01-15',
    required: false,
  })
  @Expose({ name: 'adoptionDate' })
  @IsOptional()
  @IsDate()
  adoptionDate?: Date;

  @ApiProperty({
    description: '분양자 정보',
  })
  @Expose({ name: 'seller' })
  seller: UserProfilePublicDto;

  @ApiProperty({
    description: '입양자 정보',
    required: false,
  })
  @Expose({ name: 'buyer' })
  @IsOptional()
  buyer?: UserProfilePublicDto;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @Expose({ name: 'memo' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '거래 장소',
    example: '서울시 강남구',
    required: false,
  })
  @Expose({ name: 'location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: '분양 상태',
    enum: ADOPTION_STATUS,
    example: ADOPTION_STATUS.PENDING,
  })
  @Expose({ name: 'status' })
  @IsEnum(ADOPTION_STATUS)
  status: ADOPTION_STATUS;

  @ApiProperty({
    description: '생성일',
  })
  @Expose({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  @Expose({ name: 'updatedAt' })
  updatedAt: Date;
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

  @ApiProperty({
    description: '분양 상태',
    enum: ADOPTION_STATUS,
    required: false,
  })
  @IsOptional()
  @IsEnum(ADOPTION_STATUS)
  status?: ADOPTION_STATUS;
}

export class AdoptionDto extends AdoptionBaseDto {}

export class AdoptionSummaryDto extends OmitType(AdoptionBaseDto, [
  'memo',
  'location',
] as const) {}
