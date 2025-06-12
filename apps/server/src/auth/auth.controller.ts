import {
  Controller,
  Get,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
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
    @OAuthAuthenticatedUser() user: UserDto,
    @Res() res: Response,
  ) {
    if (!user) {
      throw new UnauthorizedException('로그인 실패');
    }

    const { accessToken, refreshToken } =
      await this.authService.getJwtToken(user);

    // Authorization 헤더에 accessToken 설정
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 60 * 60 * 1000, // 1시간
    });

    // 쿠키에 refreshToken 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1년
    });

    // TODO: 클라이언트에서 status가 pending인 경우 이름 입력으로, 아닌 경우 서비스로
    return res.redirect('http://localhost:3000/sign-in/success');
  }
}
