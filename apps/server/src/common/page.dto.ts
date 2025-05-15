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

export class PageMetaDto {
  readonly page?: number;
  readonly itemPerPage?: number;
  readonly totalCount: number;
  readonly totalPage: number;
  readonly hasPreviousPage: boolean;
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
  @IsArray()
  readonly data: T[];

  @IsObject()
  readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
