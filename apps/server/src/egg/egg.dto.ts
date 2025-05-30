import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { CreateParentDto } from 'src/parent/parent.dto';
import { CreatePetDto, PetParentDto } from 'src/pet/pet.dto';
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
    description: '산란일(yyyyMMdd)',
    example: 20250101,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  layingDate?: number;

  @ApiProperty({
    description: '차수(클러치)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutch?: number;

  @ApiProperty({
    description: '동배 번호(차수 내 순서)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clutchOrder?: number;

  @ApiProperty({
    description: '알 이름',
    example: '대파아빠_대파엄마_1',
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
    description: '해칭일(yyyyMMdd)',
    example: 20250202,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  hatchingDate?: number;

  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  petId?: string;
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
  'owner',
  'hatchingDate',
  'petId',
] as const) {
  @Exclude()
  declare eggId: string;

  @Exclude()
  declare hatchingDate?: number;

  @Exclude()
  declare petId?: string;

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

export class UpdateEggDto extends PartialType(CreateEggDto) {}

export class CreateEggHatchDto extends OmitType(CreatePetDto, [
  'growth',
  'sex',
  'father',
  'mother',
] as const) {}
