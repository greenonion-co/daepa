import {
  BadRequestException,
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
  UserNotificationDetailJson,
  UserNotificationDto,
} from './user_notification.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserNotificationService {
  constructor(
    @InjectRepository(UserNotificationEntity)
    private readonly userNotificationRepository: Repository<UserNotificationEntity>,
  ) {}

  async createUserNotification(
    entityManager: EntityManager,
    dto: CreateUserNotificationDto,
  ): Promise<UserNotificationEntity> {
    const userNotificationEntity = plainToInstance(UserNotificationEntity, dto);
    return await entityManager.save(
      UserNotificationEntity,
      userNotificationEntity,
    );
  }

  async getAllReceiverNotifications(
    dto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<UserNotificationEntity>> {
    const queryBuilder =
      this.userNotificationRepository.createQueryBuilder('userNotification');

    queryBuilder
      .where('userNotification.receiverId = :userId', { userId })
      .andWhere('userNotification.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .orderBy('userNotification.createdAt', dto.order)
      .skip(dto.skip)
      .take(dto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto: dto });

    return new PageDto(entities, pageMetaDto);
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
  ): Promise<DeleteResult> {
    return await this.userNotificationRepository.update(
      { id: dto.id, receiverId: dto.receiverId, isDeleted: false },
      { isDeleted: true },
    );
  }

  async findOne(
    id: number,
    userId: string,
  ): Promise<UserNotificationDto | null> {
    try {
      const userNotificationEntity =
        await this.userNotificationRepository.findOne({
          where: { id, isDeleted: false, receiverId: userId },
        });

      if (!userNotificationEntity) {
        return null;
      }

      return plainToInstance(UserNotificationDto, userNotificationEntity);
    } catch {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }
  }

  async updateUserNotificationDetailJson(
    entityManager: EntityManager,
    id: number,
    detailJson: Partial<UserNotificationDetailJson>,
  ) {
    const existingNotification = await entityManager.findOne(
      UserNotificationEntity,
      {
        where: { id },
        select: ['detailJson'],
        lock: { mode: 'pessimistic_write' },
      },
    );

    if (!existingNotification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    const updatedDetailJson: UserNotificationDetailJson = {
      ...existingNotification.detailJson,
      ...detailJson,
    };

    return await entityManager.update(
      UserNotificationEntity,
      { id },
      { detailJson: updatedDetailJson },
    );
  }
}
