import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { LayingEntity } from './laying.entity';
import { Transform } from 'class-transformer';
import { LAYING_EGG_TYPE } from './laying.constants';

export class LayingBaseDto {
  @ApiProperty({
    description: 'Laying ID',
    example: 1,
  })
  @Transform(({ obj }: { obj: LayingEntity }) => obj.id)
  @IsNumber()
  layingId: number;

  @ApiProperty({
    description: 'Mating ID',
    example: 1,
  })
  @IsNumber()
  matingId: number;

  @ApiProperty({
    description: 'Laying Date',
    example: 'yyyyMMdd',
  })
  @IsNumber()
  layingDate: number;

  @ApiProperty({
    description: '클러치 순서',
    example: 1,
  })
  @IsNumber()
  layingOrder: number;

  @ApiProperty({
    description: '알 상태',
    example: '유정란',
    required: false,
    enum: LAYING_EGG_TYPE,
    'x-enumNames': Object.keys(LAYING_EGG_TYPE),
  })
  @IsEnum(LAYING_EGG_TYPE)
  eggType?: LAYING_EGG_TYPE;

  @ApiProperty({
    description: '알 ID',
    example: 'XXXXXXXX',
  })
  @IsString()
  eggId: string;

  @ApiProperty({
    description: '해칭 온도',
    example: 35,
    required: false,
  })
  @IsNumber()
  temperture?: number;

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

export class CreateLayingDto extends PickType(LayingBaseDto, [
  'matingId',
  'layingDate',
  'eggId',
  'eggType',
  'temperture',
]) {}
