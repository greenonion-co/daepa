import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PET_ADOPTION_STATUS } from 'src/pet/pet.constants';
import { CommonResponseDto } from 'src/common/response.dto';
import { UserProfilePublicDto } from 'src/user/user.dto';

export class PetAdoptionBaseDto {
  @ApiProperty({
    description: '펫 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '희망 분양가',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '예약자 ID',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsString()
  @IsOptional()
  reservedUserId?: string;

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '분양 상태 (null이면 미지정)',
    example: 'ON_SALE',
    enum: PET_ADOPTION_STATUS,
    'x-enumNames': Object.keys(PET_ADOPTION_STATUS),
    nullable: true,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_STATUS)
  status: PET_ADOPTION_STATUS | null;
}

export class CreateAdoptionDto {
  @ApiProperty({
    description: '펫 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '희망 분양가',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '분양 상태',
    example: 'ON_SALE',
    enum: PET_ADOPTION_STATUS,
    'x-enumNames': Object.keys(PET_ADOPTION_STATUS),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_STATUS)
  status?: PET_ADOPTION_STATUS;
}

export class UpdateAdoptionDto {
  @ApiProperty({
    description: '희망 분양가',
    example: 50000,
    required: false,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiProperty({
    description: '예약자 ID',
    example: 'USER_XXXXXXXX',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  reservedUserId?: string | null;

  @ApiProperty({
    description: '메모',
    example: '건강한 개체입니다.',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  memo?: string | null;

  @ApiProperty({
    description: '분양 상태',
    example: 'ON_SALE',
    enum: PET_ADOPTION_STATUS,
    'x-enumNames': Object.keys(PET_ADOPTION_STATUS),
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_STATUS)
  status?: PET_ADOPTION_STATUS | null;
}

export class AdoptionDto extends PickType(PetAdoptionBaseDto, [
  'petId',
  'price',
  'memo',
  'status',
  'createdAt',
] as const) {
  @ApiProperty({
    description: '예약자 정보',
    type: UserProfilePublicDto,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Type(() => UserProfilePublicDto)
  reservedUser?: UserProfilePublicDto | null;
}

export class AdoptionDetailResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '분양 정보 (없을 수 있음)',
    type: AdoptionDto,
    nullable: true,
    required: false,
  })
  @Type(() => AdoptionDto)
  data: AdoptionDto | null;
}
