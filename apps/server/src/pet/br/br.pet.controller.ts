import { Controller, Get, Query, Param } from '@nestjs/common';
import { PetService } from '../pet.service';
import { PageMetaDto, PageDto } from 'src/common/page.dto';
import {
  ApiResponse,
  getSchemaPath,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  PetDto,
  PetFilterDto,
  PetHatchingDateRangeDto,
  FilterPetListResponseDto,
} from '../pet.dto';
import { ApiExtraModels } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';

@Controller('/v1/br/pet')
@BrAccessOnly()
export class BrPetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @ApiExtraModels(PetDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: 'BR룸 펫 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(PetDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async findAll(
    @Query() pageOptionsDto: PetFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<PetDto>> {
    console.log('here: ', token);
    return this.petService.getPetListFull(pageOptionsDto, token.userId);
  }

  @Get('hatching/year/:year')
  @ApiParam({
    name: 'year',
    description: '연도',
    example: 2024,
  })
  @ApiResponse({
    status: 200,
    description: '연도별 해칭 펫 목록 조회 성공',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: getSchemaPath(PetDto) },
      },
    },
  })
  async getPetsByYear(
    @Param('year') year: string,
    @JwtUser() token: JwtUserPayload,
  ): Promise<Record<string, PetDto[]>> {
    return this.petService.getPetListByYear(Number(year), token.userId);
  }

  @Get('hatching/month')
  @ApiQuery({
    name: 'year',
    description: '연도',
    example: 2024,
  })
  @ApiQuery({
    name: 'month',
    description: '월 (0-11)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: '월별 해칭 펫 목록 조회 성공',
    type: FilterPetListResponseDto,
  })
  async getPetsByMonth(
    @JwtUser() token: JwtUserPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<FilterPetListResponseDto> {
    const monthDate = new Date(Number(year), Number(month), 1);
    const data = await this.petService.getPetListByMonth(
      monthDate,
      token.userId,
    );
    return {
      success: true,
      message: '월별 해칭 펫 목록 조회 성공',
      data,
    };
  }

  @Get('hatching/date-range')
  @ApiQuery({
    name: 'startDate',
    description: '시작 날짜 (yyyy-MM-dd)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: '종료 날짜 (yyyy-MM-dd)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: '날짜 범위별 해칭 펫 목록 조회 성공',
    type: FilterPetListResponseDto,
  })
  async getPetsByDateRange(
    @Query() query: PetHatchingDateRangeDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<FilterPetListResponseDto> {
    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;

    const data = await this.petService.getPetListByHatchingDate(
      { startDate: start, endDate: end },
      token.userId,
    );
    return {
      success: true,
      message: '날짜 범위별 해칭 펫 목록 조회 성공',
      data,
    };
  }
}
