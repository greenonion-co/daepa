import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementEntity, ANNOUNCEMENT_STATUS } from './announcement.entity';
import { BroadcastResult, FcmService } from './fcm.service';
import { CreateAnnouncementDto, TestAnnouncementDto } from './announcement.dto';

// path 미입력 시 알림 탭 fallback 경로 (앱이 data.path 없으면 이동하지 않으므로 기본값 제공)
const DEFAULT_ANNOUNCEMENT_PATH = '/';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepository: Repository<AnnouncementEntity>,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * 공지 이력을 먼저 저장하고, 전체 broadcast는 백그라운드(fire-and-forget)로 실행한다.
   * 관리자는 발송 완료를 기다리지 않고 즉시 응답을 받는다.
   */
  async createAndBroadcast(
    dto: CreateAnnouncementDto,
    sentBy: string,
  ): Promise<AnnouncementEntity> {
    const announcement = await this.announcementRepository.save(
      this.announcementRepository.create({
        title: dto.title,
        body: dto.body,
        dataPath: dto.path,
        sentBy,
        status: ANNOUNCEMENT_STATUS.SENDING,
      }),
    );

    // 백그라운드 발송 (응답 블로킹하지 않음)
    void this.broadcastInBackground(announcement);

    return announcement;
  }

  /**
   * 테스트 발송 — 이력을 남기지 않고, 지정한 유저(기본: 관리자 본인)에게만
   * broadcast 코드 경로로 동기 전송 후 결과를 즉시 반환한다.
   */
  async sendTest(
    dto: TestAnnouncementDto,
    fallbackUserId: string,
  ): Promise<BroadcastResult> {
    const targetUserId = dto.targetUserId ?? fallbackUserId;
    const data: Record<string, string> = {
      type: 'ANNOUNCEMENT',
      path: dto.path ?? DEFAULT_ANNOUNCEMENT_PATH,
    };

    return this.fcmService.sendBroadcastToUser(
      targetUserId,
      dto.title,
      dto.body,
      data,
    );
  }

  private async broadcastInBackground(
    announcement: AnnouncementEntity,
  ): Promise<void> {
    const data: Record<string, string> = {
      type: 'ANNOUNCEMENT',
      path: announcement.dataPath ?? DEFAULT_ANNOUNCEMENT_PATH,
    };

    try {
      const result = await this.fcmService.sendBroadcast(
        announcement.title,
        announcement.body,
        data,
      );

      await this.announcementRepository.update(announcement.id, {
        status: ANNOUNCEMENT_STATUS.SENT,
        targetCount: result.targetCount,
        successCount: result.successCount,
        failureCount: result.failureCount,
        failuresByCode: result.failuresByCode,
      });
    } catch (error) {
      this.logger.error(
        `Announcement ${announcement.id} broadcast failed: ${(error as Error).message}`,
      );
      // fire-and-forget 경로이므로 상태 갱신 실패가 unhandled rejection 으로 새어
      // 나가지 않도록 방어. 갱신까지 실패하면 status 가 'sending' 에 고착되므로
      // 수동 점검이 가능하도록 명확히 로깅한다.
      try {
        await this.announcementRepository.update(announcement.id, {
          status: ANNOUNCEMENT_STATUS.FAILED,
        });
      } catch (updateError) {
        this.logger.error(
          `Announcement ${announcement.id} left in 'sending' (status update failed): ${(updateError as Error).message}`,
        );
      }
    }
  }
}
