import { ApiProperty, PickType } from '@nestjs/swagger';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { OAUTH_PROVIDER } from 'src/auth/auth.constants';

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
  })
  @IsEnum(USER_ROLE)
  role: (typeof USER_ROLE)[keyof typeof USER_ROLE];

  @ApiProperty({
    description: 'Oauth 제공자',
  })
  @IsEnum(OAUTH_PROVIDER)
  provider: (typeof OAUTH_PROVIDER)[keyof typeof OAUTH_PROVIDER];

  @ApiProperty({
    description: 'Oauth 제공자 ID',
  })
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'refresh token',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiProperty({
    description: 'refresh token 만료 시간',
  })
  @IsDate()
  @IsOptional()
  refreshTokenExpiresAt?: Date;

  @ApiProperty({
    description: '유저 상태',
    enum: USER_STATUS,
  })
  @IsEnum(USER_STATUS)
  status: (typeof USER_STATUS)[keyof typeof USER_STATUS];

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
  'provider',
  'providerId',
  'refreshToken',
  'refreshTokenExpiresAt',
  'status',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
]) {}
