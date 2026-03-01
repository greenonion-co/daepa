import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  PET_ADOPTION_STATUS,
  PET_GROWTH,
  PET_SEX,
  PET_SPECIES,
} from './pet.constants';

export class BulkCreatePetRowDto {
  @ApiProperty({ description: '개체 이름', example: '대파' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '종',
    example: PET_SPECIES.CRESTED,
    enum: PET_SPECIES,
  })
  @IsNotEmpty()
  @IsEnum(PET_SPECIES)
  species: PET_SPECIES;

  @ApiProperty({ description: '성별', enum: PET_SEX, required: false })
  @IsOptional()
  @IsEnum(PET_SEX)
  sex?: PET_SEX;

  @ApiProperty({ description: '성장단계', enum: PET_GROWTH, required: false })
  @IsOptional()
  @IsEnum(PET_GROWTH)
  growth?: PET_GROWTH;

  @ApiProperty({
    description: '해칭일 (yyyy-MM-dd)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  hatchingDate?: string;

  @ApiProperty({ description: '공개 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: '모프', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  morphs?: string[];

  @ApiProperty({ description: '형질', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traits?: string[];

  @ApiProperty({ description: '먹이', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foods?: string[];

  @ApiProperty({ description: '몸무게(g)', required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    description: '분양상태',
    enum: PET_ADOPTION_STATUS,
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_ADOPTION_STATUS)
  adoptionStatus?: PET_ADOPTION_STATUS;

  @ApiProperty({ description: '부개체 이름', required: false })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiProperty({ description: '모개체 이름', required: false })
  @IsOptional()
  @IsString()
  motherName?: string;
}

export class BulkCreatePetDto {
  @ApiProperty({ description: '개체 목록', type: [BulkCreatePetRowDto] })
  @IsArray()
  @ArrayMaxSize(500, { message: '최대 500개까지 등록할 수 있습니다.' })
  @ValidateNested({ each: true })
  @Type(() => BulkCreatePetRowDto)
  pets: BulkCreatePetRowDto[];
}
