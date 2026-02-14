import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PageOptionsDto } from 'src/common/page.dto';

export class FeedingBaseDto {
  @ApiProperty({
    description: '피딩 ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '펫 ID',
    example: 'abc12345',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '피딩 날짜',
    example: '2025-01-01',
  })
  @IsDateString()
  feedingAt: string;

  @ApiProperty({
    description: '피딩한 음식',
    example: '귀뚜라미',
    required: false,
  })
  @IsString()
  @IsOptional()
  food?: string;

  @ApiProperty({
    description: '급여량',
    example: 1.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: '메모',
    example: '잘 먹었음',
    required: false,
  })
  @IsString()
  @IsOptional()
  memo?: string;
}

export class CreateFeedingDto extends PickType(FeedingBaseDto, [
  'petId',
  'feedingAt',
  'food',
  'amount',
  'memo',
]) {}

export class UpdateFeedingDto {
  @ApiProperty({
    description: '피딩 날짜',
    example: '2025-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  feedingAt?: string;

  @ApiProperty({
    description: '피딩한 음식',
    example: '귀뚜라미',
    required: false,
  })
  @IsString()
  @IsOptional()
  food?: string;

  @ApiProperty({
    description: '급여량',
    example: 1.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: '메모',
    example: '잘 먹었음',
    required: false,
  })
  @IsString()
  @IsOptional()
  memo?: string;
}

export class FeedingFilterDto extends PageOptionsDto {
  @ApiProperty({
    description: '펫 ID',
    example: 'abc12345',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '조회 시작일 (yyyy-MM-dd)',
    example: '2025-01-01',
    required: false,
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: '조회 종료일 (yyyy-MM-dd)',
    example: '2025-01-31',
    required: false,
  })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class FeedingDto extends PickType(FeedingBaseDto, [
  'id',
  'petId',
  'feedingAt',
  'food',
  'amount',
  'memo',
]) {}
