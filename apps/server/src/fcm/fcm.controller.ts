import { Body, Controller, Delete, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FcmService } from './fcm.service';
import { RegisterFcmTokenDto, TestPushNotificationDto } from './fcm.dto';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CommonResponseDto } from 'src/common/response.dto';

@ApiTags('FCM')
@Controller('/v1/fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('token')
  @ApiResponse({
    status: 201,
    description: 'FCM 토큰 등록 성공',
    type: CommonResponseDto,
  })
  async registerToken(
    @JwtUser() token: JwtUserPayload,
    @Body() dto: RegisterFcmTokenDto,
  ): Promise<CommonResponseDto> {
    await this.fcmService.registerToken(token.userId, dto);
    return {
      success: true,
      message: 'FCM 토큰이 등록되었습니다.',
    };
  }

  @Delete('token')
  @ApiResponse({
    status: 200,
    description: 'FCM 토큰 비활성화 성공',
    type: CommonResponseDto,
  })
  async deactivateToken(
    @JwtUser() token: JwtUserPayload,
    @Query('deviceId') deviceId: string,
  ): Promise<CommonResponseDto> {
    await this.fcmService.deactivateToken(token.userId, deviceId);
    return {
      success: true,
      message: 'FCM 토큰이 비활성화되었습니다.',
    };
  }

  @Post('test')
  @ApiOperation({ summary: '푸시 알림 테스트 (현재 로그인한 사용자에게 전송)' })
  @ApiResponse({
    status: 201,
    description: '테스트 푸시 알림 전송 성공',
    type: CommonResponseDto,
  })
  async sendTestPush(
    @JwtUser() token: JwtUserPayload,
    @Body() dto: TestPushNotificationDto,
  ): Promise<CommonResponseDto> {
    await this.fcmService.sendPushNotification({
      userId: token.userId,
      title: dto.title,
      body: dto.body,
    });
    return {
      success: true,
      message: '테스트 푸시 알림이 전송되었습니다.',
    };
  }
}
