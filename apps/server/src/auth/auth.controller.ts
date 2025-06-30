import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Post,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, ValidatedUser } from './auth.service';
import { ApiResponse } from '@nestjs/swagger';
import { UserDto } from 'src/user/user.dto';
import { AuthenticatedUser, Public } from './auth.decorator';
import { TokenResponseDto } from './auth.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('sign-in/kakao')
  @Public()
  @UseGuards(AuthGuard('kakao'))
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 성공',
    type: UserDto,
  })
  async kakaoLogin(
    @AuthenticatedUser() validatedUser: ValidatedUser,
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
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiResponse({
    status: 302,
    description: '구글 로그인 성공',
    type: UserDto,
  })
  async googleLogin(
    @AuthenticatedUser() validatedUser: ValidatedUser,
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
  @Public()
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

  @Post('sign-out')
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
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
  })
  async deleteAccount(
    @AuthenticatedUser() user: ValidatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteUserSoft(user.userId, user.status);

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
