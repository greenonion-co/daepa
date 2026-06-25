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
import {
  ApiExtraModels,
  ApiProperty,
  getSchemaPath,
  PickType,
} from '@nestjs/swagger';
import {
  PARENT_ROLE,
  PARENT_STATUS,
} from 'src/parent_request/parent_request.constants';
import { PET_ADOPTION_METHOD } from 'src/pet/pet.constants';

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
}

export class DetailJson {
  @ApiProperty({
    description: '메시지',
    example: '뽀삐 부모 인증 요청',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  [key: string]: unknown;
}

/**
 * 부모 인증 알림 상세 JSON.
 * - primaryPet: 자식 개체 (헤더 썸네일 + 클릭 대상)
 * - secondaryPet: 부모 개체
 */
export class ParentLinkDetailJson extends DetailJson {
  @ApiProperty({
    description: '부모 인증 상태',
    example: PARENT_STATUS.PENDING,
    enum: PARENT_STATUS,
    required: false,
    'x-enumNames': Object.keys(PARENT_STATUS),
  })
  @IsEnum(PARENT_STATUS)
  status?: PARENT_STATUS;

  @ApiProperty({
    description: '주 개체 (부모 인증: 자식 개체)',
    type: NotificationPetDto,
    required: false,
  })
  @IsOptional()
  primaryPet?: NotificationPetDto;

  @ApiProperty({
    description: '보조 개체 (부모 인증: 부모 개체)',
    type: NotificationPetDto,
    required: false,
  })
  @IsOptional()
  secondaryPet?: NotificationPetDto;

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
    description: '거절 이유',
    example: '뽀삐 부모 인증 거절',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}

export class NotificationSellerDto {
  @ApiProperty({ description: '판매자 ID', example: 'XXXXXXXX' })
  @IsString()
  id: string;

  @ApiProperty({
    description: '판매자 이름',
    example: '브리더A',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}

/**
 * 소유권 이전 알림 상세 JSON.
 * - primaryPet: 이전 대상 개체 (헤더 썸네일 + 클릭 대상)
 */
export class AdoptionCompleteDetailJson extends DetailJson {
  @ApiProperty({
    description: '판매자 정보',
    type: NotificationSellerDto,
    required: false,
  })
  @IsOptional()
  seller?: NotificationSellerDto;

  @ApiProperty({
    description: '이전 대상 개체 정보',
    type: NotificationPetDto,
    required: false,
  })
  @IsOptional()
  primaryPet?: NotificationPetDto;

  @ApiProperty({
    description: '분양 날짜',
    example: '2026-04-12',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  adoptionDate?: string | null;

  @ApiProperty({
    description: '분양 가격',
    example: 50000,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiProperty({
    description: '분양 방식',
    example: 'PICKUP',
    enum: PET_ADOPTION_METHOD,
    'x-enumNames': Object.keys(PET_ADOPTION_METHOD),
    required: false,
    nullable: true,
  })
  @IsEnum(PET_ADOPTION_METHOD)
  @IsOptional()
  method?: PET_ADOPTION_METHOD | null;
}

@ApiExtraModels(DetailJson, ParentLinkDetailJson, AdoptionCompleteDetailJson)
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
    oneOf: [
      { $ref: getSchemaPath(DetailJson) },
      { $ref: getSchemaPath(ParentLinkDetailJson) },
      { $ref: getSchemaPath(AdoptionCompleteDetailJson) },
    ],
    example: {},
  })
  @IsOptional()
  @IsJSON()
  detailJson?: DetailJson | ParentLinkDetailJson | AdoptionCompleteDetailJson;

  @ApiProperty({
    description: '알림 발신 유저 이름',
    example: '브리더',
    required: false,
  })
  @IsString()
  @IsOptional()
  senderName?: string;

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
