import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ProviderInfo } from './auth.types';
import { JwtService } from '@nestjs/jwt';
import { USER_STATUS } from 'src/user/user.constant';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';

export type ValidatedUser = {
  userId: string;
  status: USER_STATUS;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(providerInfo: ProviderInfo): Promise<ValidatedUser> {
    const { provider, providerId } = providerInfo;

    const userFound = await this.userService.findOne({
      provider,
      provider_id: providerId,
    });

    if (!userFound) {
      const userCreated = await this.userService.createUser(
        providerInfo,
        USER_STATUS.PENDING,
      );
      return {
        userId: userCreated.userId,
        status: userCreated.status,
      };
    }

    return {
      userId: userFound.userId,
      status: userFound.status,
    };
  }

  createJwtAccessToken(userId: string) {
    const accessToken = this.jwtService.sign({
      sub: userId,
      status: 'authenticated',
    });
    return accessToken;
  }

  async createJwtRefreshToken(userId: string) {
    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        status: 'authenticated',
      },
      {
        expiresIn: '180d',
        secret: process.env.JWT_REFRESH_SECRET ?? '',
      },
    );

    await this.updateUserRefreshToken(userId, refreshToken);

    return refreshToken;
  }

  async refresh(refreshToken: string) {
    try {
      const tokenPayload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? '',
      });

      const user = await this.userService.findOne({
        user_id: tokenPayload.sub,
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken ?? '',
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('유효하지 않은 refresh token입니다.');
      }

      if (
        user.refreshTokenExpiresAt &&
        user.refreshTokenExpiresAt < new Date()
      ) {
        throw new UnauthorizedException('refresh token이 만료되었습니다.');
      }

      const newAccessToken = this.createJwtAccessToken(user.userId);

      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      let newRefreshToken: string | undefined;
      if (
        user.refreshTokenExpiresAt &&
        user.refreshTokenExpiresAt <= oneWeekFromNow
      ) {
        // TODO: 짧은 기간으로 설정하여 테스트해볼것
        newRefreshToken = await this.createJwtRefreshToken(user.userId);
      }

      return {
        newAccessToken,
        newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('refresh token 검증에 실패했습니다.');
    }
  }

  async updateUserRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const user = await this.userService.findOne({ user_id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // TODO: refresh token 해싱 하여 저장 필요
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // TODO: expire date의 end of day 계산하여 저장
    // TODO: duration을 환경변수화
    // Calculate expiration date
    const expiresIn = '1y'; // e.g., '7d'
    const expiresAt = new Date();
    // A simple way to parse expiration (you might need a more robust parser for '15m', '7d', etc.)
    // For simplicity, let's assume '7d' means adding 7 days.
    const duration = parseInt(expiresIn.slice(0, -1));
    const unit = expiresIn.slice(-1);

    if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + duration);
    else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + duration);
    else if (unit === 'm')
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    else if (unit === 'y')
      expiresAt.setFullYear(expiresAt.getFullYear() + duration);

    await this.userService.update(user.userId, {
      refreshToken: hashedRefreshToken,
      refreshTokenExpiresAt: expiresAt,
    });
  }

  async invalidateRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenPayload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? '',
      });

      await this.userService.update(tokenPayload.sub, {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      });
    } catch (error) {
      // 토큰이 이미 만료되었거나 유효하지 않은 경우 무시
    }
  }
}
