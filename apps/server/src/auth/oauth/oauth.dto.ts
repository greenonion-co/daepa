import { ApiProperty } from '@nestjs/swagger';
import { OAUTH_PROVIDER } from '../auth.constants';
import { IsDate, IsEnum, IsString } from 'class-validator';

export class OauthDto {
  @ApiProperty({
    description: 'OAuth 계정 이메일',
  })
  @IsString()
  email: string;

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
  providerId: string;

  @ApiProperty({
    description: '유저 ID',
  })
  @IsString()
  userId: string;

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
