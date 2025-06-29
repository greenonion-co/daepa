import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CommonResponseDto } from 'src/common/response.dto';

export class TokenResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '토큰 발급 성공',
    example: 'XXXXXXXX',
  })
  @IsString()
  token: string;
}
