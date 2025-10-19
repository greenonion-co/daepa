import { Controller, Get, Param, Query } from '@nestjs/common';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';
import { PairDto, PairFilterDto } from './pair.dto';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { PairService } from './pair.service';

@Controller('v1/pairs')
@BrAccessOnly()
export class PairController {
  constructor(private readonly pairService: PairService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: '페어 목록 조회 성공',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(PairDto) },
    },
  })
  async getPairList(
    @Query() query: PairFilterDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    return this.pairService.getPairList(token.userId, query.species);
  }

  @Get(':pairId')
  @ApiResponse({
    status: 200,
    description: '페어 상세 정보 조회 성공',
  })
  async getPairById(
    @Param('pairId') pairId: string,
    @JwtUser() token: JwtUserPayload,
  ) {
    return this.pairService.getPairById(pairId, token.userId);
  }
}
