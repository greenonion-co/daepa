import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FcmTokenEntity } from './fcm_token.entity';
import { RegisterFcmTokenDto, SendPushNotificationDto } from './fcm.dto';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

// 토큰 자체가 영구 무효(앱 삭제/토큰 만료/형식 오류)인 경우에만 비활성화.
// invalid-argument 는 payload 문제일 때도 반환되어(모든 토큰 동일 실패) 대량 비활성화
// 위험이 있으므로 제외한다. 서버 일시 장애/rate limit 등도 유지하고 다음 발송 때 재시도.
const DEAD_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

export interface BroadcastResult {
  targetCount: number;
  successCount: number;
  failureCount: number;
  failuresByCode: Record<string, number>; // FCM 에러 코드별 실패 토큰 수
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    @InjectRepository(FcmTokenEntity)
    private readonly fcmTokenRepository: Repository<FcmTokenEntity>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // Firebase Admin 초기화
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );

    if (serviceAccountPath) {
      try {
        // 상대 경로를 절대 경로로 변환
        const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

        if (!fs.existsSync(absolutePath)) {
          this.logger.warn(
            `Firebase service account file not found at: ${absolutePath}`,
          );
          return;
        }

        const serviceAccountJson = JSON.parse(
          fs.readFileSync(absolutePath, 'utf8'),
        ) as {
          project_id: string;
          client_email: string;
          private_key: string;
        };

        // 이미 초기화된 경우 스킵 (핫 리로드 시 중복 초기화 방지)
        if (admin.apps.length > 0) {
          this.logger.log('Firebase Admin already initialized, skipping.');
          return;
        }

        // cert()에 명시적으로 필요한 필드만 전달
        const credential = admin.credential.cert({
          projectId: serviceAccountJson.project_id,
          clientEmail: serviceAccountJson.client_email,
          privateKey: serviceAccountJson.private_key,
        });

        admin.initializeApp({ credential });

        this.logger.log(
          `Firebase Admin initialized for project: ${serviceAccountJson.project_id}`,
        );
      } catch (error) {
        this.logger.warn(
          'Firebase Admin initialization failed. Push notifications will not work.',
          error,
        );
      }
    } else {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH not configured. Push notifications disabled.',
      );
    }
  }

  /**
   * FCM 토큰 등록 또는 업데이트
   */
  async registerToken(
    userId: string,
    dto: RegisterFcmTokenDto,
  ): Promise<FcmTokenEntity> {
    const existingToken = await this.fcmTokenRepository.findOne({
      where: { userId, deviceId: dto.deviceId },
    });

    if (existingToken) {
      // 토큰 업데이트
      existingToken.token = dto.token;
      existingToken.platform = dto.platform;
      existingToken.isActive = true;
      return await this.fcmTokenRepository.save(existingToken);
    }

    // 새 토큰 등록
    const newToken = this.fcmTokenRepository.create({
      userId,
      deviceId: dto.deviceId,
      token: dto.token,
      platform: dto.platform,
      isActive: true,
    });

    return await this.fcmTokenRepository.save(newToken);
  }

  /**
   * FCM 토큰 비활성화
   */
  async deactivateToken(userId: string, deviceId: string): Promise<void> {
    await this.fcmTokenRepository.update(
      { userId, deviceId },
      { isActive: false },
    );
  }

  /**
   * 사용자의 모든 활성 토큰 조회
   */
  async getActiveTokens(userId: string): Promise<FcmTokenEntity[]> {
    return await this.fcmTokenRepository.find({
      where: { userId, isActive: true },
    });
  }

  /**
   * 푸시 알림 전송
   */
  async sendPushNotification(dto: SendPushNotificationDto): Promise<void> {
    if (!admin.apps.length) {
      this.logger.warn('Firebase Admin not initialized. Skipping push.');
      return;
    }

    const tokens = await this.getActiveTokens(dto.userId);

    if (tokens.length === 0) {
      return;
    }

    const tokenStrings = tokens.map((t) => t.token);

    try {
      let successCount = 0;
      let failureCount = 0;
      const failedTokens: string[] = [];

      for (const token of tokenStrings) {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: dto.title,
              body: dto.body,
            },
            data: dto.data,
            apns: {
              payload: {
                aps: {
                  alert: {
                    title: dto.title,
                    body: dto.body,
                  },
                  sound: 'default',
                  badge: 1,
                  'content-available': 1,
                },
              },
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'default',
              },
            },
          });
          successCount++;
        } catch (sendError) {
          failureCount++;
          failedTokens.push(token);
          this.logger.warn(
            `Failed to send to token: ${token}, error: ${(sendError as Error).message}`,
          );
        }
      }

      // 실패한 토큰들 비활성화
      for (const token of failedTokens) {
        await this.fcmTokenRepository.update({ token }, { isActive: false });
      }

      this.logger.log(
        `Push sent to user ${dto.userId}: ${successCount} success, ${failureCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 여러 사용자에게 푸시 알림 전송
   */
  async sendPushToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendPushNotification({ userId, title, body, data });
    }
  }

  /**
   * 전체 사용자 broadcast (공지 발송용)
   * - production: 활성 토큰 전체를 조회해 멀티캐스트로 전송
   * - 그 외(dev 등): 실유저 발송을 막기 위해 ANNOUNCEMENT_TEST_USER_ID 에게만 발송.
   *   해당 env 미설정 시 아무에게도 보내지 않음 (fail-safe).
   */
  async sendBroadcast(
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<BroadcastResult> {
    if (process.env.NODE_ENV !== 'production') {
      const testUserId = this.configService.get<string>(
        'ANNOUNCEMENT_TEST_USER_ID',
      );
      if (!testUserId) {
        this.logger.warn(
          'Non-production broadcast blocked: ANNOUNCEMENT_TEST_USER_ID not set. Skipping.',
        );
        return {
          targetCount: 0,
          successCount: 0,
          failureCount: 0,
          failuresByCode: {},
        };
      }
      this.logger.warn(
        `Non-production broadcast restricted to test user ${testUserId}.`,
      );
      return this.sendBroadcastToUser(testUserId, title, body, data);
    }

    const tokens = await this.fcmTokenRepository.find({
      where: { isActive: true },
      select: ['token', 'userId', 'deviceId', 'platform'],
    });
    return this.sendMulticast(tokens, title, body, data);
  }

  /**
   * 특정 사용자에게만 broadcast 코드 경로로 전송 (테스트용)
   * - 라이브 DB에서도 대상 유저의 활성 토큰에만 발송되어 안전
   */
  async sendBroadcastToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<BroadcastResult> {
    const tokens = await this.getActiveTokens(userId);
    return this.sendMulticast(tokens, title, body, data);
  }

  /**
   * 토큰 목록에 500개씩 멀티캐스트 발송. 실패한 토큰은 비활성화.
   */
  private async sendMulticast(
    tokens: FcmTokenEntity[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<BroadcastResult> {
    if (!admin.apps.length) {
      this.logger.warn('Firebase Admin not initialized. Skipping broadcast.');
      return {
        targetCount: 0,
        successCount: 0,
        failureCount: 0,
        failuresByCode: {},
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const failuresByCode: Record<string, number> = {};

    // FCM 멀티캐스트는 1회 최대 500개 토큰
    const BATCH_SIZE = 500;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch.map((t) => t.token),
          notification: { title, body },
          data,
          apns: {
            payload: {
              aps: {
                alert: { title, body },
                sound: 'default',
                badge: 1,
                'content-available': 1,
              },
            },
          },
          android: {
            priority: 'high',
            notification: { sound: 'default', channelId: 'default' },
          },
        });

        successCount += response.successCount;
        failureCount += response.failureCount;

        // 토큰별 실패 사유 로깅 — 영구 무효 토큰만 비활성화
        const deadTokens: string[] = [];
        response.responses.forEach((r, idx) => {
          if (r.success) return;
          const t = batch[idx];
          const code = r.error?.code ?? 'unknown';
          failuresByCode[code] = (failuresByCode[code] ?? 0) + 1;
          this.logger.warn(
            `FCM send failed [${code}] user=${t.userId} device=${t.deviceId} (${t.platform}): ${r.error?.message ?? ''}`,
          );
          if (DEAD_TOKEN_ERROR_CODES.has(code)) {
            deadTokens.push(t.token);
          }
        });

        if (deadTokens.length > 0) {
          await this.fcmTokenRepository.update(
            { token: In(deadTokens) },
            { isActive: false },
          );
        }
      } catch (error) {
        failureCount += batch.length;
        failuresByCode['messaging/batch-error'] =
          (failuresByCode['messaging/batch-error'] ?? 0) + batch.length;
        this.logger.error(
          `Broadcast batch failed: ${(error as Error).message}`,
        );
      }
    }

    return {
      targetCount: tokens.length,
      successCount,
      failureCount,
      failuresByCode,
    };
  }
}
