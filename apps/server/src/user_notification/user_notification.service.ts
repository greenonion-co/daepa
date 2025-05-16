import { Injectable } from '@nestjs/common';
import { UserNotificationEntity } from './user_notification.entity';
import { Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import {
  CreateUserNotificationDto,
  UpdateUserNotificationDto,
} from './user_notification.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserNotificationService {
  constructor(
    @InjectRepository(UserNotificationEntity)
    private readonly userNotificationRepository: Repository<UserNotificationEntity>,
  ) {}

  async createUserNotification(
    dto: CreateUserNotificationDto,
  ): Promise<UserNotificationEntity> {
    const userNotification = plainToInstance(UserNotificationEntity, dto);
    console.log('here: ', userNotification);
    return await this.userNotificationRepository.save(userNotification);
  }

  async getAllReceiverNotifications(
    dto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<UserNotificationEntity>> {
    const queryBuilder =
      this.userNotificationRepository.createQueryBuilder('user_notification');

    queryBuilder
      .where('user_notification.receiver_id = :userId', { userId })
      .orderBy('user_notification.created_at', dto.order)
      .skip(dto.skip)
      .take(dto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto: dto });

    return new PageDto(entities, pageMetaDto);
  }

  async updateUserNotification(
    userId: string,
    dto: UpdateUserNotificationDto,
  ): Promise<UpdateResult> {
    return await this.userNotificationRepository.update(
      { id: dto.id, receiver_id: userId },
      dto,
    );
  }
}
