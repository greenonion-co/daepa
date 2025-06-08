import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { EggService } from '../egg.service';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDtoWithDateRange,
} from 'src/common/page.dto';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EggDto } from '../egg.dto';
import { ApiExtraModels } from '@nestjs/swagger';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';

@Controller('/v1/br/egg')
@UseInterceptors(ExcludeNilInterceptor)
export class BrEggController {
  constructor(private readonly eggService: EggService) {}

  @Get()
  @ApiExtraModels(EggDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: 'BR룸 알 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(EggDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async findAll(
    @Query() options: PageOptionsDtoWithDateRange,
  ): Promise<PageDto<EggDto>> {
    return this.eggService.getEggListFull(options);
  }
}
