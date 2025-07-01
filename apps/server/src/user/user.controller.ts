import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserNameDto, UserProfileDto } from './user.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';

@Controller('/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  @ApiResponse({
    status: 200,
    description: '사용자 프로필 조회 성공',
    type: UserProfileDto,
  })
  async getUserProfile(@JwtUser() token: JwtUserPayload) {
    const user = await this.userService.findOneProfile({
      user_id: token.userId,
    });
    return user;
  }

  @Post(':userId/name')
  @ApiResponse({
    status: 200,
    description: '사용자명 등록 성공',
    type: CommonResponseDto,
  })
  async registerUserName(
    @Param('userId') userId: string,
    @Body() registerUserNameDto: RegisterUserNameDto,
  ) {
    await this.userService.updateUserName(userId, registerUserNameDto.name);
    return {
      success: true,
      message: '사용자명이 성공적으로 등록되었습니다.',
    };
  }
}
