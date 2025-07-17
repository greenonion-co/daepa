import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserNotificationEntity } from './user_notification.entity';
import {
  DeleteResult,
  FindOptionsWhere,
  Repository,
  UpdateResult,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import {
  CreateUserNotificationDto,
  DeleteUserNotificationDto,
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
    userId: string,
    dto: CreateUserNotificationDto,
  ): Promise<UserNotificationEntity> {
    const userNotificationEntity = plainToInstance(UserNotificationEntity, {
      ...dto,
      senderId: userId,
    });
    return await this.userNotificationRepository.save(userNotificationEntity);
  }

  async getAllReceiverNotifications(
    dto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<UserNotificationEntity>> {
    const queryBuilder =
      this.userNotificationRepository.createQueryBuilder('user_notification');

    queryBuilder
      .where('user_notification.receiver_id = :userId', { userId })
      .andWhere('user_notification.is_deleted = :isDeleted', {
        isDeleted: false,
      })
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
    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }
    const userNotificationEntity =
      await this.userNotificationRepository.findOne({
        where: { id: dto.id },
      });
    if (!userNotificationEntity) {
      throw new NotFoundException('User notification not found');
    }
    return await this.userNotificationRepository.update(
      { id: dto.id },
      { status: dto.status },
    );
  }

  async updateWhere(
    where: FindOptionsWhere<UserNotificationEntity>,
    payload: Partial<UserNotificationEntity>,
  ) {
    await this.userNotificationRepository.update(where, payload);
    return await this.userNotificationRepository.findOne({
      where: {
        ...where,
        ...payload,
      },
    });
  }

  async deleteUserNotification(
    dto: DeleteUserNotificationDto,
  ): Promise<DeleteResult> {
    return await this.userNotificationRepository.update(
      { id: dto.id, receiver_id: dto.receiverId, is_deleted: false },
      { is_deleted: true },
    );
  }
}
