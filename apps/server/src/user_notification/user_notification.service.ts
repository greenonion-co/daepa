import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserNotificationEntity } from './user_notification.entity';
import { DeleteResult, EntityManager, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import {
  CreateUserNotificationDto,
  DeleteUserNotificationDto,
  UpdateUserNotificationDto,
  UserNotificationDto,
} from './user_notification.dto';
import { plainToInstance } from 'class-transformer';
import {
  USER_NOTIFICATION_STATUS,
  USER_NOTIFICATION_TYPE,
} from './user_notification.constant';
import { FcmService } from '../fcm/fcm.service';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class UserNotificationService {
  constructor(
    @InjectRepository(UserNotificationEntity)
    private readonly userNotificationRepository: Repository<UserNotificationEntity>,
    private readonly fcmService: FcmService,
  ) {}

  async createUserNotification(
    entityManager: EntityManager,
    senderId: string,
    dto: CreateUserNotificationDto,
  ): Promise<UserNotificationEntity> {
    const userNotificationEntity = plainToInstance(UserNotificationEntity, {
      ...dto,
      senderId,
    });
    const savedNotification = await entityManager.save(
      UserNotificationEntity,
      userNotificationEntity,
    );

    return savedNotification;
  }

  /**
   * 푸시 알림 발송 (트랜잭션 커밋 후 호출부에서 사용)
   */
  sendPushNotificationForNotification(
    notification: UserNotificationEntity,
  ): void {
    void this.sendPushNotification(
      notification.id,
      notification.receiverId,
      notification.type,
      notification.detailJson,
    ).catch((err) => {
      console.error('Failed to send push notification:', err);
    });
  }

  /**
   * 알림 타입에 따른 푸시 알림 발송
   */
  private async sendPushNotification(
    notificationId: number,
    receiverId: string,
    type: USER_NOTIFICATION_TYPE,
    detailJson?: Record<string, unknown> | null,
  ): Promise<void> {
    const { title, body } = this.getPushMessage(type, detailJson);

    await this.fcmService.sendPushNotification({
      userId: receiverId,
      title,
      body,
      data: {
        notificationId: String(notificationId),
        type,
        ...(detailJson && { detailJson: JSON.stringify(detailJson) }),
      },
    });
  }

  /**
   * 알림 타입에 따른 푸시 메시지 생성
   */
  private getPushMessage(
    type: USER_NOTIFICATION_TYPE,
    detailJson?: Record<string, unknown> | null,
  ): { title: string; body: string } {
    const childPetName =
      (detailJson?.childPet as { name?: string })?.name ?? '펫';
    const parentPetName =
      (detailJson?.parentPet as { name?: string })?.name ?? '펫';

    switch (type) {
      case USER_NOTIFICATION_TYPE.PARENT_REQUEST:
        return {
          title: '부모 연동 요청',
          body: `${childPetName}의 부모로 ${parentPetName}을(를) 연동하고 싶어합니다.`,
        };
      case USER_NOTIFICATION_TYPE.PARENT_ACCEPT:
        return {
          title: '부모 연동 수락',
          body: `${parentPetName}이(가) ${childPetName}의 부모로 연동되었습니다.`,
        };
      case USER_NOTIFICATION_TYPE.PARENT_REJECT:
        return {
          title: '부모 연동 거절',
          body: `${parentPetName} 부모 연동 요청이 거절되었습니다.`,
        };
      case USER_NOTIFICATION_TYPE.PARENT_CANCEL:
        return {
          title: '부모 연동 취소',
          body: `${parentPetName} 부모 연동 요청이 취소되었습니다.`,
        };
      default:
        return {
          title: '알림',
          body: '새로운 알림이 있습니다.',
        };
    }
  }

  async getNotificationList(dto: PageOptionsDto, userId: string) {
    const baseWhere =
      'userNotification.receiverId = :userId AND userNotification.isDeleted = :isDeleted';
    const params = { userId, isDeleted: false };

    // COUNT 쿼리 (JOIN 불필요)
    const countQb = this.userNotificationRepository
      .createQueryBuilder('userNotification')
      .where(baseWhere, params);

    // 데이터 쿼리 (sender 이름 JOIN 포함)
    const dataQb = this.userNotificationRepository
      .createQueryBuilder('userNotification')
      .leftJoin(
        UserEntity,
        'sender',
        'sender.userId = userNotification.senderId',
      )
      .addSelect('sender.name', 'senderName')
      .where(baseWhere, params)
      .orderBy('userNotification.createdAt', dto.order)
      .skip(dto.skip)
      .take(dto.itemPerPage);

    // 병렬 실행
    const [totalCount, { entities, raw }] = await Promise.all([
      countQb.getCount(),
      dataQb.getRawAndEntities(),
    ]);
    const rawRows = raw as { senderName?: string }[];
    const data = entities.map((entity, i) => ({
      ...entity,
      senderName: rawRows[i]?.senderName ?? undefined,
    }));

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto: dto });

    return new PageDto(data, pageMetaDto);
  }

  async updateUserNotification(
    dto: UpdateUserNotificationDto,
  ): Promise<UpdateResult> {
    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }
    const userNotificationEntity =
      await this.userNotificationRepository.existsBy({ id: dto.id });
    if (!userNotificationEntity) {
      throw new NotFoundException('User notification not found');
    }
    return await this.userNotificationRepository.update(
      { id: dto.id },
      { status: dto.status },
    );
  }

  async deleteUserNotification(
    dto: DeleteUserNotificationDto,
    userId: string,
  ): Promise<DeleteResult> {
    if (dto.receiverId !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return await this.userNotificationRepository.update(
      { id: dto.id, receiverId: dto.receiverId, isDeleted: false },
      { isDeleted: true },
    );
  }

  async findOne(
    id: number,
    userId: string,
  ): Promise<UserNotificationDto | null> {
    const userNotificationEntity =
      await this.userNotificationRepository.findOne({
        where: { id, receiverId: userId, isDeleted: false },
      });

    if (!userNotificationEntity) {
      return null;
    }

    return plainToInstance(UserNotificationDto, userNotificationEntity);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.userNotificationRepository.count({
      where: {
        receiverId: userId,
        status: USER_NOTIFICATION_STATUS.UNREAD,
        isDeleted: false,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<UpdateResult> {
    return await this.userNotificationRepository.update(
      {
        receiverId: userId,
        status: USER_NOTIFICATION_STATUS.UNREAD,
        isDeleted: false,
      },
      { status: USER_NOTIFICATION_STATUS.READ },
    );
  }
}
