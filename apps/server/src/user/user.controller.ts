import {
  Body,
  ConflictException,
  Controller,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateInitUserInfoDto,
  UpdateUserPrivateInfoDto,
  UserFilterDto,
  UserPrivateInfoResponseDto,
  UserProfileResponseDto,
  VerifyNameDto,
  UserProfilePublicDto,
} from './user.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtUser, Public } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { VerifyEmailDto } from './user.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';

@Controller('/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/simple')
  @ApiExtraModels(UserProfilePublicDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '사용자 간단정보 목록 조회',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(UserProfilePublicDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async getUserListSimple(
    @Query() query: UserFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<UserProfilePublicDto>> {
    return this.userService.getUserListSimple(query, token.userId);
  }

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

  @Get('/private-info')
  @ApiResponse({
    status: 200,
    description: '사용자 개인정보 조회 성공',
    type: UserPrivateInfoResponseDto,
  })
  async getUserPrivateInfo(
    @JwtUser() token: JwtUserPayload,
  ): Promise<UserPrivateInfoResponseDto> {
    const privateInfo = await this.userService.findPrivateInfo(token.userId);
    return {
      success: true,
      message: '사용자 개인정보 조회 성공',
      data: privateInfo,
    };
  }

  @Patch('/private-info')
  @ApiResponse({
    status: 200,
    description: '사용자 개인정보 수정 성공',
    type: CommonResponseDto,
  })
  async updateUserPrivateInfo(
    @JwtUser() token: JwtUserPayload,
    @Body() dto: UpdateUserPrivateInfoDto,
  ): Promise<CommonResponseDto> {
    await this.userService.updatePrivateInfo(token.userId, dto);
    return {
      success: true,
      message: '사용자 개인정보가 수정되었습니다.',
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
      throw new ConflictException('이미 사용중인 닉네임입니다.');
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
    throw new ConflictException('이미 사용중인 이메일입니다.');
  }
}
