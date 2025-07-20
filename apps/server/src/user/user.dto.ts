import { ApiProperty, PickType } from '@nestjs/swagger';
import { USER_ROLE, USER_STATUS } from './user.constant';
import {
  IsArray,
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

export class UserProfilePublicDto extends PickType(UserBaseDto, [
  'userId',
  'name',
  'role',
  'isBiz',
  'status',
]) {
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
