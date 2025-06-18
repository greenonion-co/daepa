import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { EggService } from '../egg.service';
import { DateRangeDto } from 'src/common/page.dto';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { DateRangeValidationPipe } from 'src/common/pipes/date-range.pipe';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EggDto } from '../egg.dto';

@Controller('/v1/br/egg')
@UseInterceptors(ExcludeNilInterceptor)
export class BrEggController {
  constructor(private readonly eggService: EggService) {}

  @Get()
  @ApiExtraModels(EggDto)
  @ApiResponse({
    status: 200,
    description: 'Get egg list by date',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          $ref: getSchemaPath(EggDto),
        },
      },
    },
  })
  async findAll(
    @Query(new DateRangeValidationPipe())
    dateRange: DateRangeDto,
  ) {
    return this.eggService.getEggListByDate(dateRange);
  }
}
