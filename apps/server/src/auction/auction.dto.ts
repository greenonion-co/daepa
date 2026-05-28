import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CommonResponseDto } from '../common/response.dto';
import { AUCTION_STATUS } from './auction.constants';

export class CreateAuctionDto {
  @ApiProperty({ description: '경매 대상 펫 ID' })
  @IsString()
  petId: string;

  @ApiProperty({ description: '시작가 (원 단위)', minimum: 0 })
  @IsInt()
  @Min(0)
  startingPrice: number;

  @ApiProperty({ description: '최소 입찰 단위 (원)', minimum: 100 })
  @IsInt()
  @Min(100)
  minIncrement: number;

  @ApiProperty({ description: '연장 분 (1~10)', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  extensionMinutes: number;

  @ApiProperty({ description: '시작 시각 ISO8601' })
  @IsISO8601()
  startTime: string;

  @ApiProperty({ description: '종료 시각 ISO8601' })
  @IsISO8601()
  endTime: string;
}

export class AuctionBidDto {
  @ApiProperty() bidderUserId: string;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  bidderNickname?: string | null;

  @ApiProperty() amount: number;
  @ApiProperty() serverTsMs: number;
  @ApiProperty() triggeredExtension: boolean;
}

export class AuctionHighestBidderDto {
  @ApiProperty() userId: string;
  @ApiProperty({ type: 'string', nullable: true }) nickname: string | null;
}

export class AuctionStateDto {
  @ApiProperty() auctionId: string;
  @ApiProperty() shareToken: string;
  @ApiProperty() petId: string;
  @ApiProperty() hostUserId: string;

  @ApiProperty({ enum: AUCTION_STATUS })
  @IsEnum(AUCTION_STATUS)
  status: AUCTION_STATUS;

  @ApiProperty() startingPrice: number;
  @ApiProperty() minIncrement: number;
  @ApiProperty() extensionMinutes: number;
  @ApiProperty() startTimeMs: number;
  @ApiProperty() originalEndTimeMs: number;
  @ApiProperty() currentEndTimeMs: number;
  @ApiProperty() highestBid: number;

  @ApiProperty({ type: AuctionHighestBidderDto, nullable: true })
  @Type(() => AuctionHighestBidderDto)
  highestBidder: AuctionHighestBidderDto | null;

  @ApiProperty({ type: [AuctionBidDto] })
  @Type(() => AuctionBidDto)
  recentBids: AuctionBidDto[];

  @ApiProperty() serverNowMs: number;

  @ApiProperty({ type: 'number', nullable: true }) finalPrice: number | null;
  @ApiProperty({ type: 'string', nullable: true }) winnerUserId: string | null;
}

export class AuctionResponseDto extends CommonResponseDto {
  @ApiProperty({ type: AuctionStateDto, nullable: true })
  @Type(() => AuctionStateDto)
  data: AuctionStateDto | null;
}

export class CreateAuctionResultDto {
  @ApiProperty() auctionId: string;
  @ApiProperty() shareToken: string;
  @ApiProperty() shareUrl: string;
}

export class CreateAuctionResponseDto extends CommonResponseDto {
  @ApiProperty({ type: CreateAuctionResultDto })
  @Type(() => CreateAuctionResultDto)
  data: CreateAuctionResultDto;
}

export class BidHistoryItemDto {
  @ApiProperty() bidderUserId: string;
  @ApiProperty({ type: 'string', nullable: true }) bidderNickname:
    | string
    | null;
  @ApiProperty() amount: number;
  @ApiProperty() serverTsMs: number;
  @ApiProperty() triggeredExtension: boolean;
}

export class BidHistoryResponseDto extends CommonResponseDto {
  @ApiProperty({ type: [BidHistoryItemDto] })
  @Type(() => BidHistoryItemDto)
  data: BidHistoryItemDto[];

  @ApiProperty({
    description: '다음 페이지 cursor (다음 호출 시 cursor 쿼리로 전달)',
    type: 'string',
    nullable: true,
  })
  nextCursor: string | null;
}

export class MyAuctionItemDto {
  @ApiProperty() auctionId: string;
  @ApiProperty() shareToken: string;
  @ApiProperty() petId: string;
  @ApiProperty({ enum: AUCTION_STATUS }) status: AUCTION_STATUS;
  @ApiProperty() startTimeMs: number;
  @ApiProperty() currentEndTimeMs: number;
  @ApiProperty() startingPrice: number;
  @ApiProperty({ type: 'number', nullable: true }) highestBid: number | null;
  @ApiProperty({ type: 'number', nullable: true }) finalPrice: number | null;
}

export class MyAuctionListResponseDto extends CommonResponseDto {
  @ApiProperty({ type: [MyAuctionItemDto] })
  @Type(() => MyAuctionItemDto)
  data: MyAuctionItemDto[];
}

export class BidHistoryQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
