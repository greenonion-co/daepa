import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { StatisticsService } from './statistics.service';
import {
  ParentStatisticsDto,
  ParentStatisticsQueryDto,
  AdoptionStatisticsDto,
  AdoptionStatisticsQueryDto,
} from './statistics.dto';

@Controller('v1/statistics')
@ApiTags('Statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('pairs')
  @ApiOperation({ summary: '부모 개체 통계 조회 (부 또는 모 개체 기준)' })
  @ApiResponse({
    status: 200,
    description: '부모 개체 통계 조회 성공',
    type: ParentStatisticsDto,
  })
  async getPairStatistics(
    @Query() query: ParentStatisticsQueryDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<ParentStatisticsDto> {
    return this.statisticsService.getPairStatistics(token.userId, query);
  }

  @Get('adoptions')
  @ApiOperation({ summary: '분양 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '분양 통계 조회 성공',
    type: AdoptionStatisticsDto,
  })
  async getAdoptionStatistics(
    @Query() query: AdoptionStatisticsQueryDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<AdoptionStatisticsDto> {
    return this.statisticsService.getAdoptionStatistics(
      token.userId,
      query.species,
      query.year,
      query.month,
      query.fatherId,
      query.motherId,
    );
  }
}
