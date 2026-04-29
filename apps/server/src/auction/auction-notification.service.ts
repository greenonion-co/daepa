import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserNotificationEntity } from '../user_notification/user_notification.entity';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';
import { FcmService } from '../fcm/fcm.service';
import { AuctionEntity } from './auction.entity';
import { PetEntity } from '../pet/pet.entity';

@Injectable()
export class AuctionNotificationService {
  private readonly logger = new Logger(AuctionNotificationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly fcmService: FcmService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async notifyAuctionStarted(auction: AuctionEntity): Promise<void> {
    try {
      const pet = await this.dataSource
        .getRepository(PetEntity)
        .findOne({ where: { petId: auction.petId } });

      void this.fcmService.sendPushNotification({
        userId: auction.hostUserId,
        title: '경매가 시작되었습니다',
        body: `${pet?.name ?? '내 펫'}의 경매가 시작되었습니다.`,
        data: {
          type: 'AUCTION_STARTED',
          shareToken: auction.shareToken,
          auctionId: auction.auctionId,
          path: `/auction/${auction.shareToken}`,
        },
      });

      await this.sendDiscord(
        `:gavel: **경매 시작** — auctionId=\`${auction.auctionId}\`, host=\`${auction.hostUserId}\`, pet=\`${auction.petId}\`, end=${auction.currentEndTime.toISOString()}`,
      );
    } catch (err) {
      this.logger.warn('notifyAuctionStarted failed', err);
    }
  }

  async notifyAuctionEnded(
    auction: AuctionEntity,
    winner: { userId: string; price: number; bidId?: number } | null,
  ): Promise<void> {
    try {
      const pet = await this.dataSource
        .getRepository(PetEntity)
        .findOne({ where: { petId: auction.petId } });
      const petName = pet?.name ?? '펫';

      // 호스트 인앱 + 푸시
      await this.persistNotification(
        auction.hostUserId,
        auction.hostUserId,
        USER_NOTIFICATION_TYPE.AUCTION_ENDED_HOST,
        Number(auction.id),
        {
          auctionId: auction.auctionId,
          shareToken: auction.shareToken,
          petName,
          finalPrice: winner?.price ?? null,
          winnerUserId: winner?.userId ?? null,
        },
      );
      void this.fcmService.sendPushNotification({
        userId: auction.hostUserId,
        title: winner ? '경매가 낙찰되었습니다' : '경매가 종료되었습니다',
        body: winner
          ? `${petName} 경매가 ${winner.price.toLocaleString()}원에 낙찰되었습니다.`
          : `${petName} 경매가 입찰자 없이 종료되었습니다.`,
        data: {
          type: 'AUCTION_ENDED_HOST',
          shareToken: auction.shareToken,
          auctionId: auction.auctionId,
          path: `/auction/${auction.shareToken}`,
        },
      });

      // 낙찰자 인앱 + 푸시
      if (winner) {
        await this.persistNotification(
          auction.hostUserId,
          winner.userId,
          USER_NOTIFICATION_TYPE.AUCTION_ENDED_WINNER,
          Number(auction.id),
          {
            auctionId: auction.auctionId,
            shareToken: auction.shareToken,
            petName,
            finalPrice: winner.price,
          },
        );
        void this.fcmService.sendPushNotification({
          userId: winner.userId,
          title: '낙찰을 축하합니다',
          body: `${petName}을(를) ${winner.price.toLocaleString()}원에 낙찰받으셨습니다.`,
          data: {
            type: 'AUCTION_ENDED_WINNER',
            shareToken: auction.shareToken,
            auctionId: auction.auctionId,
            path: `/auction/${auction.shareToken}`,
          },
        });
      }

      const winnerLine = winner
        ? `winner=\`${winner.userId}\` price=${winner.price.toLocaleString()}원`
        : '입찰자 없음';
      await this.sendDiscord(
        `:trophy: **경매 종료** — auctionId=\`${auction.auctionId}\`, ${winnerLine}`,
      );
    } catch (err) {
      this.logger.warn('notifyAuctionEnded failed', err);
    }
  }

  private async persistNotification(
    senderId: string,
    receiverId: string,
    type: USER_NOTIFICATION_TYPE,
    targetId: number,
    detailJson: Record<string, unknown>,
  ): Promise<void> {
    try {
      const repo = this.dataSource.getRepository(UserNotificationEntity);
      // unique index: senderId+receiverId+type+targetId. 중복 시 무시.
      await repo
        .createQueryBuilder()
        .insert()
        .values({
          senderId,
          receiverId,
          type,
          targetId,
          detailJson: detailJson as never,
        })
        .orIgnore()
        .execute();
    } catch (err) {
      this.logger.warn(`persistNotification failed`, err);
    }
  }

  private async sendDiscord(content: string): Promise<void> {
    const url = this.configService.get<string>('DISCORD_AUCTION_WEBHOOK_URL');
    if (!url) return;
    try {
      await firstValueFrom(this.httpService.post(url, { content }));
    } catch (err) {
      this.logger.warn('discord webhook failed', err);
    }
  }
}
