import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PageOptionsDto {
  @ApiProperty({
    description: '정렬 순서',
    enum: Order,
    default: Order.ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(Order)
  readonly order?: Order = Order.ASC;

  @ApiProperty({
    description: '페이지 번호',
    type: Number,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수',
    type: Number,
    minimum: 1,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly itemPerPage: number = 10;

  get skip(): number {
    return (this.page - 1) * this.itemPerPage;
  }
}

export class PageOptionsDtoWithDateRange extends PageOptionsDto {
  @ApiProperty({
    description: '조회 범위 시작일',
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  readonly startYmd?: number;

  @ApiProperty({
    description: '조회 범위 종료일',
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  readonly endYmd?: number;
}

export class PageMetaDto {
  @ApiProperty({
    description: '페이지 번호',
    type: Number,
    default: 1,
  })
  readonly page?: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    type: Number,
    default: 10,
  })
  readonly itemPerPage?: number;

  @ApiProperty({
    description: '총 항목 수',
    type: Number,
    default: 0,
  })
  readonly totalCount: number;

  @ApiProperty({
    description: '총 페이지 수',
    type: Number,
    default: 0,
  })
  readonly totalPage: number;

  @ApiProperty({
    description: '이전 페이지 존재 여부',
    type: Boolean,
  })
  readonly hasPreviousPage: boolean;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    type: Boolean,
  })
  readonly hasNextPage: boolean;

  constructor({
    pageOptionsDto,
    totalCount,
  }: {
    pageOptionsDto: PageOptionsDto;
    totalCount: number;
  }) {
    this.page = pageOptionsDto.page;
    this.itemPerPage = pageOptionsDto.itemPerPage;
    this.totalCount = totalCount;
    this.totalPage = Math.ceil(this.totalCount / this.itemPerPage);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.totalPage;
  }
}

export class PageDto<T> {
  @ApiProperty({
    description: '페이징된 데이터',
    type: 'array',
    items: {
      type: 'object',
    },
  })
  @IsArray()
  readonly data: T[];

  @ApiProperty({
    description: '페이지 메타 정보',
    type: PageMetaDto,
  })
  @IsObject()
  readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}

export class DateRangeDto {
  @ApiProperty({
    description: '조회 범위 시작일',
    type: Date,
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  readonly startYmd?: Date;

  @ApiProperty({
    description: '조회 범위 종료일',
    type: Date,
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  readonly endYmd?: Date;
}
