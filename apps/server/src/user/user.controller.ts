import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateInitUserInfoDto, UserProfileDto } from './user.dto';
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
    const userProfile = await this.userService.findOneProfile(token.userId);
    return userProfile;
  }

  @Post('/init-info')
  @ApiResponse({
    status: 200,
    description: '사용자명 등록 성공',
    type: CommonResponseDto,
  })
  async createInitUserInfo(
    @JwtUser() token: JwtUserPayload,
    @Body() createInitUserInfoDto: CreateInitUserInfoDto,
  ) {
    await this.userService.createInitUserInfo(
      token.userId,
      createInitUserInfoDto,
    );
    return {
      success: true,
      message: '사용자명이 성공적으로 등록되었습니다.',
    };
  }
}
