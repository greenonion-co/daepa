import {
  IsArray,
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { PET_SEX, PET_SPECIES } from './pet.constants';
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { PARENT_STATUS } from 'src/parent/parent.constant';
import { UserDto } from 'src/user/user.dto';
import { CreateParentDto } from 'src/parent/parent.dto';

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
  owner: UserDto;

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
  birthdate?: number;

  @ApiProperty({
    description: '펫 성장단계',
    example: '준성체',
    required: false,
  })
  @IsOptional()
  @IsString()
  growth?: string;

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
]) {
  @Exclude()
  declare birthdate?: string;

  @Exclude()
  declare growth?: string;

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
  owner: UserDto;

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
  })
  @IsString()
  status: PARENT_STATUS;
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
