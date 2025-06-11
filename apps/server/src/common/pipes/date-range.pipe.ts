import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PageOptionsDtoWithDateRange } from '../page.dto';

@Injectable()
export class DateRangeValidationPipe implements PipeTransform {
  transform(value: PageOptionsDtoWithDateRange) {
    if (
      value.startYmd !== undefined &&
      value.endYmd != undefined &&
      value.startYmd > value.endYmd
    ) {
      throw new BadRequestException('종료일은 시작일보다 이후여야 합니다.');
    }
    return value;
  }
}
