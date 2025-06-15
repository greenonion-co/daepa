import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { EggService } from '../egg.service';
import { PageOptionsDtoWithDateRange } from 'src/common/page.dto';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EggDto } from '../egg.dto';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { DateRangeValidationPipe } from 'src/common/pipes/date-range.pipe';

@Controller('/v1/br/egg')
@UseInterceptors(ExcludeNilInterceptor)
export class BrEggController {
  constructor(private readonly eggService: EggService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'BR룸 알 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        20250101: {
          type: 'array',
          items: {
            $ref: getSchemaPath(EggDto),
          },
        },
      },
    },
  })
  async findAll(
    @Query(new DateRangeValidationPipe())
    pageOptionsDtoWithDateRange: PageOptionsDtoWithDateRange,
  ) {
    return this.eggService.getEggListByDate(pageOptionsDtoWithDateRange);
  }
}
