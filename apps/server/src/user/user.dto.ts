import { ApiProperty, PickType } from '@nestjs/swagger';
import { USER_ROLE, USER_STATUS } from './user.constant';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  Matches,
} from 'class-validator';
import { OAUTH_PROVIDER } from 'src/auth/auth.constants';
import { Exclude } from 'class-transformer';
import { CommonResponseDto } from 'src/common/response.dto';
import { PageOptionsDto } from 'src/common/page.dto';

class UserBaseDto {
  @ApiProperty({
    description: '회원 고유 ID',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: '회원 이름',
  })
  @IsString()
  @Matches(/^(?!DELETED_).*$/, {
    message: '사용자 이름은 "DELETED_"로 시작할 수 없습니다.',
  })
  name: string;

  @ApiProperty({
    description: '회원 이메일',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: '회원 역할',
    enum: USER_ROLE,
    'x-enumNames': Object.keys(USER_ROLE),
  })
  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  @ApiProperty({
    description: '사업자 여부',
    example: true,
  })
  @IsBoolean()
  isBiz: boolean;

  @ApiProperty({
    description: 'Oauth 제공자',
    enum: OAUTH_PROVIDER,
    isArray: true,
    'x-enumNames': Object.keys(OAUTH_PROVIDER),
  })
  @IsArray()
  provider: OAUTH_PROVIDER[];

  @ApiProperty({
    description: 'refresh token',
    type: 'string',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  refreshToken?: string | null;

  @ApiProperty({
    description: 'refresh token 만료 시간',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  refreshTokenExpiresAt?: Date | null;

  @ApiProperty({
    description: '유저 상태',
    enum: USER_STATUS,
    'x-enumNames': Object.keys(USER_STATUS),
  })
  @IsEnum(USER_STATUS)
  status: USER_STATUS;

  @ApiProperty({
    description: '생성 시간',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '수정 시간',
  })
  @IsDate()
  updatedAt: Date;
}

export class UserSimpleDto extends PickType(UserBaseDto, [
  'userId',
  'name',
  'email',
  'isBiz',
]) {}

export class UserDto extends PickType(UserBaseDto, [
  'userId',
  'name',
  'email',
  'role',
  'isBiz',
  'status',
  'createdAt',
  'updatedAt',
]) {}

export class CreateInitUserInfoDto extends PickType(UserBaseDto, ['name']) {
  @ApiProperty({
    description: '사업자 여부',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isBiz?: boolean;
}

export class UserProfileDto extends PickType(UserBaseDto, [
  'userId',
  'name',
  'email',
  'role',
  'isBiz',
  'provider',
  'status',
  'createdAt',
]) {
  @Exclude()
  declare updatedAt?: Date;
}

// 타인에게 노출되는 사용자 정보
export class UserProfilePublicDto extends PickType(UserBaseDto, ['status']) {
  @ApiProperty({
    description: '회원 고유 ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: '회원 이름',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: '회원 역할',
    enum: USER_ROLE,
    'x-enumNames': Object.keys(USER_ROLE),
    required: false,
  })
  @IsEnum(USER_ROLE)
  @IsOptional()
  role?: USER_ROLE;

  @ApiProperty({
    description: '사업자 여부',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isBiz?: boolean;

  @Exclude()
  declare email?: string;

  @Exclude()
  declare provider?: OAUTH_PROVIDER[];

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare lastLoginAt?: Date;

  @Exclude()
  declare createdAt?: Date;
}

export class UserPrivateInfoDto {
  @ApiProperty({
    description: '본명',
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  realName?: string | null;

  @ApiProperty({
    description: '전화번호',
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({
    description: '주소',
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiProperty({
    description: '본명 공개 여부',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isRealNamePublic?: boolean;

  @ApiProperty({
    description: '전화번호 공개 여부',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPhonePublic?: boolean;

  @ApiProperty({
    description: '주소 공개 여부',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isAddressPublic?: boolean;
}

export class UserPrivateInfoResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '사용자 개인정보',
    type: UserPrivateInfoDto,
  })
  data: UserPrivateInfoDto;
}

export class UpdateUserPrivateInfoDto {
  @ApiProperty({
    description: '본명',
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  realName?: string | null;

  @ApiProperty({
    description: '전화번호',
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({
    description: '주소',
    type: 'string',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiProperty({
    description: '본명 공개 여부',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRealNamePublic?: boolean;

  @ApiProperty({
    description: '전화번호 공개 여부',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPhonePublic?: boolean;

  @ApiProperty({
    description: '주소 공개 여부',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isAddressPublic?: boolean;
}

export class VerifyNameDto {
  @ApiProperty({
    description: '닉네임',
  })
  @IsString()
  @Matches(/^(?!DELETED_).*$/, {
    message: '사용자 이름은 "DELETED_"로 시작할 수 없습니다.',
  })
  name: string;
}

export class UserFilterDto extends PageOptionsDto {
  @ApiProperty({
    description: '검색 키워드',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword?: string;
}
export class UserProfileResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '사용자 프로필',
    type: UserProfileDto,
  })
  data: UserProfileDto;
}

export class VerifyEmailDto {
  @ApiProperty({ description: '이메일' })
  @IsEmail()
  email: string;
}

export class BreederPublicProfileDto extends UserProfilePublicDto {
  @ApiProperty({
    description: '공개 펫 수',
    example: 12,
  })
  petCount: number;

  @ApiProperty({
    description: '실명/상호 (공개 설정 시)',
    required: false,
  })
  realName?: string | null;

  @ApiProperty({
    description: '연락처 (공개 설정 시)',
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    description: '주소 (공개 설정 시)',
    required: false,
  })
  address?: string | null;
}

export class BreederPublicProfileResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '브리더 공개 프로필',
    type: BreederPublicProfileDto,
  })
  data: BreederPublicProfileDto;
}
