import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLE } from './user.constant';
import { IsEnum, IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: '회원 고유 ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '회원 이름',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '회원 역할',
    enum: USER_ROLE,
  })
  @IsEnum(USER_ROLE)
  @IsNotEmpty()
  role: USER_ROLE;
}
