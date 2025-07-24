import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { IsOptionalExcludeNil } from 'src/common/decorators/exclude-nil.decorator';
import { CommonResponseDto } from 'src/common/response.dto';
import { CreateParentDto } from 'src/parent/parent.dto';
import { PET_SPECIES } from 'src/pet/pet.constants';
import { PetParentDto } from 'src/pet/pet.dto';
import { UserProfilePublicDto } from 'src/user/user.dto';

export class EggBaseDto {
  @ApiProperty({
    description: '알 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  eggId: string;

  @ApiProperty({
    description: '알 주인 정보',
  })
  @IsObject()
  owner: UserProfilePublicDto;

  @ApiProperty({
    description: '메이팅 아이디',
    example: 1,
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsNumber()
  matingId?: number;

  @ApiProperty({
    description: '알 종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
  })
  @IsString()
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({
    description: '산란일(yyyyMMdd)',
    example: 20250101,
  })
  @IsNumber()
  layingDate: number;

  @ApiProperty({
    description: '차수(클러치)',
    example: 1,
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsNumber()
  clutch?: number;

  @ApiProperty({
    description: '동배 번호(차수 내 구분 - 순서 무관)',
    example: 1,
  })
  @IsNumber()
  clutchOrder: number;

  @ApiProperty({
    description: '알 보관 온도',
    example: 25,
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsNumber()
  temperature?: number;

  @ApiProperty({
    description: '알 정보',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsString()
  desc?: string;

  @ApiProperty({
    description: '해칭된 펫 아이디',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsString()
  hatchedPetId?: string;
}

export class EggSummaryDto extends PickType(EggBaseDto, [
  'eggId',
  'species',
  'owner',
  'layingDate',
  'clutch',
  'clutchOrder',
]) {
  @Exclude()
  declare hatchedPetId?: string;

  @Exclude()
  declare desc?: string;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;
}

export class EggDto extends EggBaseDto {
  @ApiProperty({
    description: '아빠 개체 정보',
    example: {},
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsObject()
  father?: PetParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    example: {},
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsObject()
  mother?: PetParentDto;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}

export class CreateEggDto {
  @ApiProperty({
    description: '알 종',
    example: '크레스티드게코',
    enum: PET_SPECIES,
    'x-enumNames': Object.keys(PET_SPECIES),
  })
  @IsString()
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({
    description: '산란일(yyyyMMdd)',
    example: 20250101,
  })
  @IsNumber()
  layingDate: number;

  @ApiProperty({
    description: '차수(클러치)',
    example: 1,
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsNumber()
  clutch?: number;

  @ApiProperty({
    description: '알 정보',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsString()
  desc?: string;

  @ApiProperty({
    description: '해당 클러치 알 개수',
  })
  @IsNumber()
  clutchCount: number;

  @ApiProperty({
    description: '아빠 개체 정보',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsObject()
  father?: CreateParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsObject()
  mother?: CreateParentDto;

  @ApiProperty({
    description: '메이팅 아이디',
    example: 1,
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsNumber()
  matingId?: number;

  @ApiProperty({
    description: '해칭 온도',
    example: 25,
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsNumber()
  temperature?: number;
}

export class UpdateEggDto extends PartialType(
  PickType(EggBaseDto, [
    'layingDate',
    'clutch',
    'clutchOrder',
    'desc',
    'temperature',
  ] as const),
) {
  @ApiProperty({
    description: '아빠 개체 정보',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsObject()
  father?: CreateParentDto;

  @ApiProperty({
    description: '엄마 개체 정보',
    required: false,
  })
  @IsOptionalExcludeNil()
  @IsObject()
  mother?: CreateParentDto;
}

export class HatchedResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '해당 알이 펫으로 전환된 펫 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  hatchedPetId: string;
}

export class LayingDto extends PickType(EggBaseDto, [
  'eggId',
  'clutchOrder',
  'clutch',
  'temperature',
  'hatchedPetId',
]) {}

export class UpdateLayingDateDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  @IsNumber()
  matingId: number;

  @ApiProperty({
    description: '기존 산란일(yyyyMMdd)',
    example: 20250101,
  })
  @IsNumber()
  currentLayingDate: number;

  @ApiProperty({
    description: '새로운 산란일(yyyyMMdd)',
    example: 20250102,
  })
  @IsNumber()
  newLayingDate: number;
}
