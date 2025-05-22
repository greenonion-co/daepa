import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { UserNotificationService } from './user_notification.service';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import {
  CreateUserNotificationDto,
  UpdateUserNotificationDto,
  UserNotificationDto,
} from './user_notification.dto';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

@Controller('/v1/user-notification')
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) {}

  @Get()
  @ApiExtraModels(UserNotificationDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '알림 목록 조회',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(UserNotificationDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    const userId = 'ZUCOPIA';
    return this.userNotificationService.getAllReceiverNotifications(
      pageOptionsDto,
      userId,
    );
  }

  @Post()
  async create(@Body() createUserNotificationDto: CreateUserNotificationDto) {
    // TODO: 유저 토큰으로부터 senderId 획득
    const senderId = 'ADMIN';
    await this.userNotificationService.createUserNotification(
      senderId,
      createUserNotificationDto,
    );
    return {
      success: true,
      message: '알림이 생성되었습니다.',
    };
  }

  @Patch()
  async update(@Body() updateUserNotificationDto: UpdateUserNotificationDto) {
    // TODO: 유저 토큰으로부터 senderId 획득
    const senderId = 'ADMIN';
    await this.userNotificationService.updateUserNotification(
      senderId,
      updateUserNotificationDto,
    );
    return {
      success: true,
      message: '알림 상태가 변경되었습니다.',
    };
  }
}
