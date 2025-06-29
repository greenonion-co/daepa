import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, ValidatedUser } from './auth.service';
import { ApiResponse } from '@nestjs/swagger';
import { UserDto } from 'src/user/user.dto';
import { OAuthAuthenticatedUser } from './auth.decorator';
import { TokenResponseDto } from './auth.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('sign-in/kakao')
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 성공',
    type: UserDto,
  })
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(
    @OAuthAuthenticatedUser() validatedUser: ValidatedUser,
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

    return res.redirect(
      `http://localhost:3000/sign-in/auth?status=${validatedUser.status}`,
    );
  }

  @Get('sign-in/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(
    @OAuthAuthenticatedUser() validatedUser: ValidatedUser,
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

    return res.redirect(
      `http://localhost:3000/sign-in/auth?status=${validatedUser.status}`,
    );
  }

  @Get('token')
  @ApiResponse({
    status: 200,
    description: 'token 발급 성공',
    type: TokenResponseDto,
  })
  async getToken(
    @Req() req: Request,
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
}
