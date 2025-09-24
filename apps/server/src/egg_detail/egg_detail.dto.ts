import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { EGG_STATUS } from './egg_detail.constants';
import { Exclude } from 'class-transformer';

export class EggDetailDto {
  @ApiProperty({
    description: '부화 온도',
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({
    description: '알 상태',
    example: EGG_STATUS.UNFERTILIZED,
    enum: EGG_STATUS,
    required: false,
    'x-enumNames': Object.keys(EGG_STATUS),
  })
  @IsOptional()
  @IsEnum(EGG_STATUS)
  status?: EGG_STATUS;

  @Exclude()
  declare createdAt?: Date;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare isDeleted?: boolean;
}
