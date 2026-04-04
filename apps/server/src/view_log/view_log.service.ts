import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViewLogEntity } from './view_log.entity';

@Injectable()
export class ViewLogService {
  private readonly logger = new Logger(ViewLogService.name);

  constructor(
    @InjectRepository(ViewLogEntity)
    private readonly viewLogRepository: Repository<ViewLogEntity>,
  ) {}

  async recordView(
    resourceType: string,
    resourceId: string,
    viewerId: string | null,
    ip: string | null,
  ): Promise<void> {
    try {
      await this.viewLogRepository.insert({
        resourceType,
        resourceId,
        viewerId,
        ip,
      });
    } catch (e) {
      this.logger.warn(
        `Failed to record view: ${resourceType}/${resourceId}`,
        e,
      );
    }
  }
}
