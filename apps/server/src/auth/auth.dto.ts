import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
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
