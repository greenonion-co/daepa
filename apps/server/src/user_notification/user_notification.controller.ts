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
    const userId = 'ZUCOPIA';
    return this.userNotificationService.createUserNotification(
      userId,
      createUserNotificationDto,
    );
  }

  @Patch()
  async update(@Body() updateUserNotificationDto: UpdateUserNotificationDto) {
    const userId = 'ZUCOPIA';
    return this.userNotificationService.updateUserNotification(
      userId,
      updateUserNotificationDto,
    );
  }
}
