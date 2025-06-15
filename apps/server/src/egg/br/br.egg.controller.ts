import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { EggService } from '../egg.service';
import { DateRangeDto, PageOptionsDtoWithDateRange } from 'src/common/page.dto';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EggDto } from '../egg.dto';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { DateRangeValidationPipe } from 'src/common/pipes/date-range.pipe';

@Controller('/v1/br/egg')
@UseInterceptors(ExcludeNilInterceptor)
export class BrEggController {
  constructor(private readonly eggService: EggService) {}

  @Get()
  async findAll(
    @Query(new DateRangeValidationPipe())
    dateRange: DateRangeDto,
  ) {
    return this.eggService.getEggListByDate(dateRange);
  }
}
