import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DEVICE_PLATFORM } from './fcm_token.entity';

export class RegisterFcmTokenDto {
  @ApiProperty({ description: 'FCM 토큰' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '기기 고유 ID' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: '플랫폼', enum: DEVICE_PLATFORM })
  @IsEnum(DEVICE_PLATFORM)
  platform: DEVICE_PLATFORM;
}

export class SendPushNotificationDto {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class TestPushNotificationDto {
  @ApiProperty({ description: '알림 제목', example: '테스트 알림' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '알림 내용', example: '푸시 알림이 작동합니다!' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class DeactivateTokenQueryDto {
  @ApiProperty({ description: '기기 고유 ID' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
