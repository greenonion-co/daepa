import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AdoptionHistoryService } from './adoption_history.service';
import {
  AdoptionHistoryDto,
  AdoptionFilterDto,
  CompleteAdoptionDto,
} from './adoption_history.dto';
import { JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { PageDto, PageMetaDto } from 'src/common/page.dto';

@ApiTags('분양 이력')
@Controller('/v1/adoption-history')
export class AdoptionHistoryController {
  constructor(
    private readonly adoptionHistoryService: AdoptionHistoryService,
  ) {}

  @Get()
  @ApiExtraModels(AdoptionHistoryDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '분양 이력 리스트 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(AdoptionHistoryDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async getAllAdoptions(
    @Query() pageOptionsDto: AdoptionFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<AdoptionHistoryDto>> {
    return this.adoptionHistoryService.findAll(pageOptionsDto, token.userId);
  }

  @Post('/:petId')
  @ApiParam({ name: 'petId', description: '펫 ID' })
  @ApiResponse({
    status: 201,
    description: '분양완료 처리 성공',
  })
  async completeAdoption(
    @Param('petId') petId: string,
    @Body() completeAdoptionDto: CompleteAdoptionDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<void> {
    return this.adoptionHistoryService.completeAdoption(
      petId,
      completeAdoptionDto,
      token.userId,
    );
  }
}
