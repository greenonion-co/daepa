import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateInitUserInfoDto,
  UserProfileResponseDto,
  VerifyNameDto,
} from './user.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';
import { JwtUser, Public } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { VerifyEmailDto } from './user.dto';

@Controller('/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  @ApiResponse({
    status: 200,
    description: '사용자 프로필 조회 성공',
    type: UserProfileResponseDto,
  })
  async getUserProfile(
    @JwtUser() token: JwtUserPayload,
  ): Promise<UserProfileResponseDto> {
    const userProfile = await this.userService.findOneProfile(token.userId);
    return {
      success: true,
      message: '사용자 프로필 조회 성공',
      data: userProfile,
    };
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
  ): Promise<CommonResponseDto> {
    await this.userService.createInitUserInfo(
      token.userId,
      createInitUserInfoDto,
    );
    return {
      success: true,
      message: '사용자명이 성공적으로 등록되었습니다.',
    };
  }

  @Post('/verify-name')
  @Public()
  @ApiResponse({
    status: 200,
    description: '닉네임 중복 확인 성공',
    type: CommonResponseDto,
  })
  async verifyName(
    @Body() verifyNameDto: VerifyNameDto,
  ): Promise<CommonResponseDto> {
    const isExist = await this.userService.isNameExist(verifyNameDto.name);
    if (!isExist) {
      return {
        success: true,
        message: '사용 가능한 닉네임입니다.',
      };
    } else {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: '이미 사용중인 닉네임입니다.',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  @Post('/verify-email')
  @Public()
  @ApiResponse({
    status: 200,
    description: '이메일 중복 확인 성공',
    type: CommonResponseDto,
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<CommonResponseDto> {
    const isExist = await this.userService.isEmailExist(dto.email);
    if (!isExist) {
      return {
        success: true,
        message: '사용 가능한 이메일입니다.',
      };
    }
    throw new HttpException(
      {
        statusCode: HttpStatus.CONFLICT,
        message: '이미 사용중인 이메일입니다.',
      },
      HttpStatus.CONFLICT,
    );
  }
}
