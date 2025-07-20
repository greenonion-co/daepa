import { ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { LayingDto } from 'src/laying/laying.dto';
import { PetSummaryDto } from 'src/pet/pet.dto';

export class MatingBaseDto {
  @ApiProperty({
    description: 'Mating ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'User ID',
    example: 'USER_XXXXXXXX',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Father ID',
    example: 'PET_XXXXXXXX',
    required: false,
  })
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: 'Mother ID',
    example: 'PET_XXXXXXXX',
    required: false,
  })
  @IsString()
  motherId?: string;

  @ApiProperty({
    description: 'Mating Date',
    example: 'yyyyMMdd',
  })
  @IsNumber()
  matingDate: number;

  @ApiProperty({
    description: '생성일',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  @IsDate()
  updatedAt: Date;
}

export class MatingDto extends PickType(MatingBaseDto, [
  'id',
  'fatherId',
  'motherId',
  'matingDate',
]) {}

export class CreateMatingDto extends PickType(MatingBaseDto, [
  'fatherId',
  'motherId',
  'matingDate',
]) {}

class LayingByDateDto {
  @ApiProperty({
    description: '산란 날짜',
    example: 'yyyyMMdd',
  })
  layingDate: number;

  @ApiProperty({
    description: '산란 정보',
    isArray: true,
    type: LayingDto,
  })
  layings: LayingDto[];
}

class MatingByDateDto {
  @ApiProperty({
    description: '메이팅 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '메이팅 날짜',
    example: 20250101,
  })
  matingDate: number;

  @ApiProperty({
    description: '산란 정보',
    required: false,
    isArray: true,
    type: LayingByDateDto,
  })
  layingsByDate?: LayingByDateDto[];
}

export class MatingByParentsDto {
  @ApiProperty({
    description: '아빠 펫 정보',
    type: PetSummaryDto,
    required: false,
  })
  father?: PetSummaryDto;

  @ApiProperty({
    description: '엄마 펫 정보',
    type: PetSummaryDto,
    required: false,
  })
  mother?: PetSummaryDto;

  @ApiProperty({
    description: '메이팅 정보',
    type: MatingByDateDto,
    isArray: true,
  })
  matingsByDate: MatingByDateDto[];
}
