import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtUser, Public } from '../auth/auth.decorator';
import { OptionalJwtAuthGuard } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { CommonResponseDto } from '../common/response.dto';
import {
  AuctionResponseDto,
  BidHistoryQueryDto,
  BidHistoryResponseDto,
  CreateAuctionDto,
  CreateAuctionResponseDto,
  MyAuctionListResponseDto,
} from './auction.dto';
import { AuctionService } from './auction.service';
import { AuctionSchedulerService } from './auction-scheduler.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('경매')
@Controller('/v1/auction')
export class AuctionController {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly schedulerService: AuctionSchedulerService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ApiResponse({ status: 201, type: CreateAuctionResponseDto })
  async createAuction(
    @Body() dto: CreateAuctionDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CreateAuctionResponseDto> {
    const { auctionId, shareToken } = await this.auctionService.create(
      token.userId,
      dto,
    );
    // 생성 후 BullMQ에 start/finalize 잡 등록
    const auction = await this.auctionService.findByAuctionIdOrThrow(auctionId);
    await this.schedulerService.scheduleAuction(auction);

    const clientBase = this.configService.get<string>('CLIENT_BASE_URL') ?? '';
    return {
      success: true,
      message: '경매 생성 성공',
      data: {
        auctionId,
        shareToken,
        shareUrl: `${clientBase}/auction/${shareToken}`,
      },
    };
  }

  @Get('/:shareToken')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, type: AuctionResponseDto })
  async getByShareToken(
    @Param('shareToken') shareToken: string,
  ): Promise<AuctionResponseDto> {
    const auction =
      await this.auctionService.findByShareTokenOrThrow(shareToken);
    const data = await this.auctionService.getLiveState(auction);
    return {
      success: true,
      message: '경매 조회 성공',
      data,
    };
  }

  @Post('/:shareToken/cancel')
  @ApiResponse({ status: 200, type: CommonResponseDto })
  async cancel(
    @Param('shareToken') shareToken: string,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.auctionService.cancelByHost(shareToken, token.userId);
    return { success: true, message: '경매 취소 성공' };
  }

  @Get('/:auctionId/bids')
  @Public()
  @ApiResponse({ status: 200, type: BidHistoryResponseDto })
  async bids(
    @Param('auctionId') auctionId: string,
    @Query() query: BidHistoryQueryDto,
  ): Promise<BidHistoryResponseDto> {
    const { items, nextCursor } = await this.auctionService.getBidHistory(
      auctionId,
      query.cursor,
      query.limit ?? 50,
    );
    return {
      success: true,
      message: '입찰 히스토리 조회 성공',
      data: items,
      nextCursor,
    };
  }
}

@ApiTags('내 경매')
@Controller('/v1/me/auction')
export class MyAuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Get()
  @ApiResponse({ status: 200, type: MyAuctionListResponseDto })
  async myAuctions(
    @JwtUser() token: JwtUserPayload,
  ): Promise<MyAuctionListResponseDto> {
    const data = await this.auctionService.getMyAuctions(token.userId);
    return {
      success: true,
      message: '내 경매 목록 조회 성공',
      data,
    };
  }
}
