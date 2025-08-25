import { ApiProperty } from '@nestjs/swagger';

export class CommonResponseDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '메시지',
    example: '성공',
  })
  message: string;
}

export class CommonIdResponseDto extends CommonResponseDto {
  @ApiProperty({ description: '자원 식별자', example: 'XXXXXXXX' })
  id: string;
}
