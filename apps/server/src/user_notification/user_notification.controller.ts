import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { UserNotificationService } from './user_notification.service';
import { PageOptionsDto } from 'src/common/page.dto';
import {
  CreateUserNotificationDto,
  UpdateUserNotificationDto,
} from './user_notification.dto';

@Controller('/v1/user-notification')
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) {}

  @Get()
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    const userId = 'ZUCOPIA';
    return this.userNotificationService.getAllReceiverNotifications(
      pageOptionsDto,
      userId,
    );
  }

  @Post()
  async create(@Body() createUserNotificationDto: CreateUserNotificationDto) {
    return this.userNotificationService.createUserNotification(
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
