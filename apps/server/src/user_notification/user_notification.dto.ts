import {
  IsDate,
  IsEnum,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  USER_NOTIFICATION_STATUS,
  USER_NOTIFICATION_TYPE,
} from './user_notification.constant';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';

class UserNotificationDto {
  @ApiProperty({
    description: '알림 아이디',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '알림 전송 유저 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  senderId: string;

  @ApiProperty({
    description: '알림 수신 유저 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  receiverId: string;

  @ApiProperty({
    description: '알림 타입',
    example: 'XXXXXXXX',
  })
  @IsEnum(USER_NOTIFICATION_TYPE)
  type: string;

  @ApiProperty({
    description: '알림 대상 이벤트 아이디 ex) 부모 개체 아이디, 댓글 아이디 등',
    example: 'XXXXXXXX',
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    description: '알림 상태',
    example: USER_NOTIFICATION_STATUS.READ,
  })
  @IsEnum(USER_NOTIFICATION_STATUS)
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: '알림 상세 정보 JSON',
    example: {},
  })
  @IsJSON()
  detailJson: Record<string, any>;

  @ApiProperty({
    description: '알림 생성 시간',
    example: new Date(),
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '알림 수정 시간',
    example: new Date(),
  })
  @IsDate()
  updatedAt: Date;
}

export class CreateUserNotificationDto extends OmitType(UserNotificationDto, [
  'id',
  'createdAt',
  'updatedAt',
]) {}

export class UpdateUserNotificationDto extends PickType(UserNotificationDto, [
  'id',
  'status',
]) {}
