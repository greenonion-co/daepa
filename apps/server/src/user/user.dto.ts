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
  })
  @IsString()
  @IsOptional()
  refreshToken?: string | null;

  @ApiProperty({
    description: 'refresh token 만료 시간',
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

export class SafeUserDto extends PickType(UserBaseDto, [
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
  'refreshToken',
  'refreshTokenExpiresAt',
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
  declare refreshToken?: string | null;

  @Exclude()
  declare refreshTokenExpiresAt?: Date | null;

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
  declare provider?: OAUTH_PROVIDER[];

  @Exclude()
  declare refreshToken?: string | null;

  @Exclude()
  declare refreshTokenExpiresAt?: Date | null;

  @Exclude()
  declare updatedAt?: Date;

  @Exclude()
  declare lastLoginAt?: Date;

  @Exclude()
  declare createdAt?: Date;
}

export class VerifyNameDto {
  @ApiProperty({
    description: '닉네임',
  })
  @IsString()
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
