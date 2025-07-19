import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { MatingEntity } from './mating.entity';

export class MatingBaseDto {
  @ApiProperty({
    description: 'Mating ID',
    example: 1,
  })
  @Transform(({ obj }: { obj: MatingEntity }) => obj.id)
  @IsNumber()
  matingId: number;

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

export class CreateMatingDto extends PickType(MatingBaseDto, [
  'fatherId',
  'motherId',
  'matingDate',
]) {}
