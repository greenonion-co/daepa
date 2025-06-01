import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateParentDto } from 'src/parent/parent.dto';
import { PET_SPECIES } from 'src/pet/pet.constants';
import { PetParentDto } from 'src/pet/pet.dto';
import { UserDto } from 'src/user/user.dto';

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
  owner: UserDto;

  @ApiProperty({
    description: '알 종',
    example: '크레스티드게코',
  })
  @IsString()
  @IsEnum(PET_SPECIES)
  species: keyof typeof PET_SPECIES;

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
  @IsOptional()
  @IsNumber()
  clutch?: number;

  @ApiProperty({
    description: '동배 번호(차수 내 구분 - 순서 무관)',
    example: 1,
  })
  @IsNumber()
  clutchOrder: number;

  @ApiProperty({
    description: '알 이름',
    example: '대파아빠x대파엄마(1-1)',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '알 정보',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({
    description: '해칭된 펫 아이디',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  hatchedPetId?: string;
}

export class EggSummaryDto extends PickType(EggBaseDto, [
  'eggId',
  'species',
  'name',
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

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}

export class CreateEggDto extends OmitType(EggBaseDto, [
  'eggId',
  'name',
  'owner',
  'clutchOrder',
  'hatchedPetId',
] as const) {
  @Exclude()
  declare eggId: string;

  @Exclude()
  declare clutchOrder: number;

  @Exclude()
  declare hatchedPetId?: string;

  @ApiProperty({
    description: '해당 클러치 알 개수',
  })
  @IsNumber()
  clutchCount: number;

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

export class UpdateEggDto extends PartialType(
  PickType(EggBaseDto, [
    'layingDate',
    'clutch',
    'clutchOrder',
    'desc',
  ] as const),
) {
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
