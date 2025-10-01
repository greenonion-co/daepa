import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UserNotificationService } from './user_notification.service';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import {
  DeleteUserNotificationDto,
  UpdateUserNotificationDto,
  UserNotificationDto,
  UserNotificationResponseDto,
} from './user_notification.dto';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';

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
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    return this.userNotificationService.getUserNotifications(
      pageOptionsDto,
      token.userId,
    );
  }

  @Patch()
  @ApiResponse({
    status: 200,
    description: '알림 상태가 변경되었습니다.',
    type: CommonResponseDto,
  })
  async update(
    @Body() updateUserNotificationDto: UpdateUserNotificationDto,
  ): Promise<CommonResponseDto> {
    await this.userNotificationService.updateUserNotification(
      updateUserNotificationDto,
    );
    return {
      success: true,
      message: '알림 상태가 변경되었습니다.',
    };
  }

  @Delete()
  @ApiResponse({
    status: 200,
    description: '알림이 삭제되었습니다.',
    type: CommonResponseDto,
  })
  async delete(
    @JwtUser() token: JwtUserPayload,
    @Body() deleteUserNotificationDto: DeleteUserNotificationDto,
  ): Promise<CommonResponseDto> {
    await this.userNotificationService.deleteUserNotification(
      deleteUserNotificationDto,
      token.userId,
    );
    return {
      success: true,
      message: '알림이 삭제되었습니다.',
    };
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: '알림 상세 조회',
    type: UserNotificationResponseDto,
  })
  async findOne(
    @Param('id') id: number,
    @JwtUser() token: JwtUserPayload,
  ): Promise<UserNotificationResponseDto> {
    const userNotification = await this.userNotificationService.findOne(
      id,
      token.userId,
    );
    return {
      success: true,
      message: '알림 상세 조회',
      data: userNotification,
    };
  }
}
