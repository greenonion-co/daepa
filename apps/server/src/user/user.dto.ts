import { ApiProperty, PickType } from '@nestjs/swagger';
import { USER_ROLE, USER_STATUS } from './user.constant';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { OAUTH_PROVIDER } from 'src/auth/auth.constants';
import { Exclude } from 'class-transformer';

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
    'x-enumNames': Object.keys(OAUTH_PROVIDER),
  })
  @IsEnum(OAUTH_PROVIDER)
  provider: OAUTH_PROVIDER;

  @ApiProperty({
    description: 'Oauth 제공자 ID',
  })
  @IsString()
  @IsOptional()
  providerId?: string | null;

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
    description: '마지막 로그인 시간',
  })
  @IsDate()
  lastLoginAt: Date;

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

export class UserDto extends PickType(UserBaseDto, [
  'userId',
  'name',
  'role',
  'isBiz',
  'provider',
  'providerId',
  'refreshToken',
  'refreshTokenExpiresAt',
  'status',
  'lastLoginAt',
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
  'role',
  'isBiz',
  'provider',
  'status',
  'lastLoginAt',
  'createdAt',
]) {
  @Exclude()
  declare providerId?: string | null;

  @Exclude()
  declare refreshToken?: string | null;

  @Exclude()
  declare refreshTokenExpiresAt?: Date | null;

  @Exclude()
  declare updatedAt?: Date;
}
