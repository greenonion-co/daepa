import { Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public, OptionalJwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { ViewLogService } from './view_log.service';

@Controller('v1/view')
export class ViewLogController {
  constructor(private readonly viewLogService: ViewLogService) {}

  @Post(':resourceType/:resourceId')
  @Public()
  @HttpCode(204)
  async recordView(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @OptionalJwtUser() user: JwtUserPayload | null,
    @Req() req: Request,
  ) {
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
