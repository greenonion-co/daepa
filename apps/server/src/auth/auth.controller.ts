import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, ValidatedUser } from './auth.service';
import { UserService } from 'src/user/user.service';
import { ApiResponse } from '@nestjs/swagger';
import { UserDto } from 'src/user/user.dto';
import { JwtUser, PassportValidatedUser, Public } from './auth.decorator';
import {
  AppleNativeLoginRequestDto,
  KakaoNativeLoginRequestDto,
  TokenResponseDto,
} from './auth.dto';
import { JwtUserPayload } from './strategies/jwt.strategy';
import { RequestWithCookies } from 'src/types/request';
import { CommonResponseDto } from 'src/common/response.dto';
import { OAUTH_PROVIDER } from './auth.constants';
import { ConfigService } from '@nestjs/config';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('sign-in/kakao/native')
  @Public()
  @ApiResponse({
    status: 200,
    description: '카카오 네이티브 로그인 성공',
    type: UserDto,
  })
  async kakaoNative(
    @Req() _req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: KakaoNativeLoginRequestDto,
  ) {
    const { email, id, refreshToken } = body;

    const validatedUser = await this.authService.validateUser({
      email,
      provider: OAUTH_PROVIDER.KAKAO,
      providerId: id,
      refreshToken,
    });

    const jwtRefreshToken = await this.authService.createJwtRefreshToken(
      validatedUser.userId,
    );

    res.cookie('refreshToken', jwtRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 * 1000,
    });

    const user = await this.userService.findOne({
      userId: validatedUser.userId,
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  @Post('sign-in/apple/native')
  @Public()
  @ApiResponse({
    status: 200,
    description: '애플 네이티브 로그인 성공',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: '애플 네이티브 로그인 실패',
    type: CommonResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: '애플 네이티브 로그인 실패',
    type: CommonResponseDto,
  })
  async appleNative(
    @Req() _req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: AppleNativeLoginRequestDto,
  ) {
    const { identityToken, email, authorizationCode, name, isBiz } = body;

    const validatedUser = await this.authService.validateAppleNativeAndGetUser({
      identityToken,
      email,
      authorizationCode,
    });

    const jwtRefreshToken = await this.authService.createJwtRefreshToken(
      validatedUser.userId,
    );

    res.cookie('refreshToken', jwtRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 * 1000,
    });

    const user = await this.userService.findOne({
      userId: validatedUser.userId,
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    if (typeof name === 'string' && name.trim().length > 0) {
      await this.userService.createInitUserInfo(validatedUser.userId, {
        name: name.trim(),
        isBiz,
      });
      const updated = await this.userService.findOne({
        userId: validatedUser.userId,
      });
      return updated;
    } else if (typeof isBiz !== 'undefined') {
      await this.userService.update(validatedUser.userId, {
        isBiz,
      });
      const updated = await this.userService.findOne({
        userId: validatedUser.userId,
      });
      return updated;
    }
    return user;
  }

  @Get('sign-in/kakao')
  @Public()
  @UseGuards(AuthGuard('kakao'))
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 성공',
    type: UserDto,
  })
  async kakaoLogin(
    @PassportValidatedUser() validatedUser: ValidatedUser,
    @Res() res: Response,
  ) {
    if (!validatedUser) {
      throw new UnauthorizedException('로그인 실패');
    }

    const refreshToken = await this.authService.createJwtRefreshToken(
      validatedUser.userId,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180일
    });

    const clientBaseUrl =
      this.configService.getOrThrow<string>('CLIENT_BASE_URL');
    return res.redirect(
      `${clientBaseUrl}/sign-in/auth?status=${validatedUser.userStatus}`,
    );
  }

  @Get('sign-in/google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiResponse({
    status: 302,
    description: '구글 로그인 성공',
    type: UserDto,
  })
  async googleLogin(
    @PassportValidatedUser() validatedUser: ValidatedUser,
    @Res() res: Response,
  ) {
    if (!validatedUser) {
      throw new UnauthorizedException('로그인 실패');
    }

    const refreshToken = await this.authService.createJwtRefreshToken(
      validatedUser.userId,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180일
    });

    const clientBaseUrl =
      this.configService.getOrThrow<string>('CLIENT_BASE_URL');
    return res.redirect(
      `${clientBaseUrl}/sign-in/auth?status=${validatedUser.userStatus}`,
    );
  }

  @Get('token')
  @Public()
  @ApiResponse({
    status: 200,
    description: 'token 발급 성공',
    type: TokenResponseDto,
  })
  async getToken(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token이 유효하지 않습니다.');
    }

    const { newAccessToken, newRefreshToken } =
      await this.authService.refresh(refreshToken);

    if (newRefreshToken) {
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 180 * 24 * 60 * 60 * 1000, // 180일
      });
    }

    return {
      token: newAccessToken,
    };
  }

  @Post('sign-out')
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    type: CommonResponseDto,
  })
  async signOut(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonResponseDto> {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken && typeof refreshToken === 'string') {
      await this.authService.invalidateRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      success: true,
      message: '로그아웃되었습니다.',
    };
  }

  @Post('delete-account')
  @ApiResponse({
    status: 200,
    description: '탈퇴가 처리되었습니다.',
    type: CommonResponseDto,
  })
  async deleteAccount(
    @JwtUser() user: JwtUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonResponseDto> {
    await this.authService.deleteUser(user.userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      success: true,
      message: '탈퇴가 처리되었습니다.',
    };
  }
}
