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
import { AuthService } from './auth.service';
import { ApiResponse } from '@nestjs/swagger';
import { UserDto } from 'src/user/user.dto';
import { OAuthAuthenticatedUser } from './auth.decorator';

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
    @OAuthAuthenticatedUser() userId: string,
    @Res() res: Response,
  ) {
    if (!userId) {
      throw new UnauthorizedException('로그인 실패');
    }

    const { accessToken, refreshToken } =
      await this.authService.getJwtToken(userId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180일
    });
    // TODO: 클라이언트에서 status가 pending인 경우 이름 입력으로, 아닌 경우 서비스로
    return res.redirect(
      `http://localhost:3000/sign-in/auth?token=${encodeURIComponent(
        accessToken,
      )}`,
    );
  }

  @Get('sign-in/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(
    @OAuthAuthenticatedUser() userId: string,
    @Res() res: Response,
  ) {
    if (!userId) {
      throw new UnauthorizedException('로그인 실패');
    }

    const { accessToken, refreshToken } =
      await this.authService.getJwtToken(userId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180일
    });
    // TODO: 클라이언트에서 status가 pending인 경우 이름 입력으로, 아닌 경우 서비스로
    return res.redirect(
      `http://localhost:3000/sign-in/auth?token=${encodeURIComponent(
        accessToken,
      )}`,
    );
  }

  @Get('refresh')
  @ApiResponse({
    status: 200,
    description: 'refresh token 재발급 성공',
    type: String,
  })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
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
