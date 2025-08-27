import {
  IsArray,
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
import { CommonResponseDto } from 'src/common/response.dto';
import {
  PARENT_ROLE,
  PARENT_STATUS,
} from 'src/parent_request/parent_request.constants';

export class NotificationPetDto {
  @ApiProperty({
    description: '개체 아이디',
    example: 'XXXXXXXX',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '개체 이름',
    example: '뽀삐',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: '개체 이미지',
    example: ['example.com/image1.jpg', 'example.com/image2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class UserNotificationDetailJson {
  @ApiProperty({
    description: '부모 연동 상태',
    example: PARENT_STATUS.PENDING,
    enum: PARENT_STATUS,
    required: false,
    'x-enumNames': Object.keys(PARENT_STATUS),
  })
  @IsEnum(PARENT_STATUS)
  status?: PARENT_STATUS;

  @ApiProperty({
    description: '자식 개체 정보',
    type: NotificationPetDto,
    required: false,
  })
  @IsOptional()
  childPet?: NotificationPetDto;

  @ApiProperty({
    description: '부모 개체 정보',
    type: NotificationPetDto,
    required: false,
  })
  @IsOptional()
  parentPet?: NotificationPetDto;

  @ApiProperty({
    description: '부모 역할',
    example: PARENT_ROLE.FATHER,
    enum: PARENT_ROLE,
    'x-enumNames': Object.keys(PARENT_ROLE),
    required: false,
  })
  @IsEnum(PARENT_ROLE)
  @IsOptional()
  role?: PARENT_ROLE;

  @ApiProperty({
    description: '메시지',
    example: '뽀삐 부모 연동 요청',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: '거절 이유',
    example: '뽀삐 부모 연동 거절',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}

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
  @IsNumber()
  @IsOptional()
  targetId?: number;

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
  detailJson?: UserNotificationDetailJson;

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

export class UserNotificationResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '알림 정보',
    type: UserNotificationDto,
    nullable: true,
  })
  data: UserNotificationDto | null;
}
