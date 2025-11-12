import { ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PET_GROWTH, PET_SEX } from 'src/pet/pet.constants';

export class PetDetailBaseDto {
  @ApiProperty({
    description: '펫 성장단계',
    example: 'JUNIOR',
    required: false,
    enum: PET_GROWTH,
    'x-enumNames': Object.keys(PET_GROWTH),
  })
  @IsOptional()
  @IsEnum(PET_GROWTH)
  growth?: PET_GROWTH;

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
    description: '펫 모프',
    example: ['릴리화이트', '아잔틱헷100%'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  morphs?: string[];

  @ApiProperty({
    description: '펫 형질',
    example: ['트익할', '풀핀'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traits?: string[];

  @ApiProperty({
    description: '펫 먹이',
    example: ['판게아 인섹트', '귀뚜라미'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foods?: string[];

  @ApiProperty({
    description: '펫 몸무게(g)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  weight?: number;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}

export class PetDetailSummaryDto extends PickType(PetDetailBaseDto, [
  'sex',
  'morphs',
  'traits',
]) {}
