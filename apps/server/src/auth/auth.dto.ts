import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CommonResponseDto } from 'src/common/response.dto';

export class TokenResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '토큰 발급 성공',
    example: 'XXXXXXXX',
  })
  @IsString()
  token: string;
}

export class KakaoNativeLoginRequestDto {
  @ApiProperty({ description: '카카오 계정 이메일' })
  @IsString()
  email: string;

  @ApiProperty({ description: '카카오 사용자 ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: '카카오 Refresh Token', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class AppleNativeLoginRequestDto {
  @ApiProperty({ description: 'Apple identity token (JWT)' })
  @IsString()
  identityToken: string;

  @ApiProperty({ description: 'Authorization code', required: false })
  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @ApiProperty({ description: '사용자 이메일(없을 수 있음)', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'nonce(raw 또는 hashed)', required: false })
  @IsOptional()
  @IsString()
  nonce?: string;

  @ApiProperty({ description: '닉네임', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '사용자 유형', required: false })
  @IsOptional()
  @IsBoolean()
  isBiz?: boolean;
}
