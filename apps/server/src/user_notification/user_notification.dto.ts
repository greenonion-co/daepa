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
import { ApiProperty, PickType } from '@nestjs/swagger';

export class UserNotificationDto {
  @ApiProperty({
    description: '알림 아이디',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '알림 발신 유저 아이디',
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
    enum: USER_NOTIFICATION_TYPE,
    'x-enumNames': Object.keys(USER_NOTIFICATION_TYPE),
  })
  @IsEnum(USER_NOTIFICATION_TYPE)
  type: USER_NOTIFICATION_TYPE;

  @ApiProperty({
    description: '알림 대상 이벤트 아이디 ex) 부모 개체 아이디, 댓글 아이디 등',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetId?: string;

  @ApiProperty({
    description: `알림 상태
      - unread: 읽지 않음
      - read: 읽음
      - deleted: 삭제`,
    enum: USER_NOTIFICATION_STATUS,
    'x-enumNames': Object.keys(USER_NOTIFICATION_STATUS),
  })
  @IsEnum(USER_NOTIFICATION_STATUS)
  @IsOptional()
  status: USER_NOTIFICATION_STATUS;

  @ApiProperty({
    required: false,
    description: '알림 상세 정보 JSON',
    example: {},
  })
  @IsOptional()
  @IsJSON()
  detailJson?: Record<string, any>;

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

export class CreateUserNotificationDto extends PickType(UserNotificationDto, [
  'receiverId',
  'type',
  'targetId',
  'detailJson',
]) {}

export class UpdateUserNotificationDto extends PickType(UserNotificationDto, [
  'id',
  'status',
]) {}

export class DeleteUserNotificationDto extends PickType(UserNotificationDto, [
  'id',
  'receiverId',
]) {}
