import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Public, OptionalJwtUser } from '../auth/auth.decorator';
import { OptionalJwtAuthGuard } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { ViewLogService } from './view_log.service';
import { VIEW_RESOURCE_TYPE } from './view_log.constants';

const ALLOWED_RESOURCE_TYPES = new Set(Object.values(VIEW_RESOURCE_TYPE));

@Controller('v1/view')
export class ViewLogController {
  constructor(private readonly viewLogService: ViewLogService) {}

  @Post(':resourceType/:resourceId')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(204)
  async recordView(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @OptionalJwtUser() user: JwtUserPayload | null,
    @Req() req: Request,
  ) {
    if (!ALLOWED_RESOURCE_TYPES.has(resourceType as VIEW_RESOURCE_TYPE)) {
      throw new BadRequestException(`Invalid resource type: ${resourceType}`);
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
      req.socket.remoteAddress ||
      null;

    await this.viewLogService.recordView(
      resourceType,
      resourceId,
      user?.userId ?? null,
      ip,
    );
  }
}
