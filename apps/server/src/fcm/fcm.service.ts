import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmTokenEntity } from './fcm_token.entity';
import { RegisterFcmTokenDto, SendPushNotificationDto } from './fcm.dto';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

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
}
