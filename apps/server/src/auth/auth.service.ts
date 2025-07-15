import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ProviderInfo } from './auth.types';
import { JwtService } from '@nestjs/jwt';
import { USER_STATUS } from 'src/user/user.constant';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';
import { OauthService } from './oauth/oauth.service';

export type ValidatedUser = {
  userId: string;
  userStatus: USER_STATUS;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly oauthService: OauthService,
  ) {}

  async validateUser(providerInfo: ProviderInfo): Promise<ValidatedUser> {
    const { email, provider, providerId } = providerInfo;

    const oauthFound = await this.oauthService.findOne({
      email,
      provider,
      provider_id: providerId,
    });
    // 기존 사용자 로그인
    if (oauthFound) {
      const userFound = await this.userService.findOne({
        email,
      });

      if (userFound) {
        return {
          userId: userFound.userId,
          userStatus: userFound.status,
        };
      } else {
        throw new BadRequestException(
          'SNS 계정 정보와 사용자 정보가 일치하지 않습니다. 관리자에게 문의해주세요.',
        );
      }
    }

    // 새로운 OAuth 가입
    let newOAuthUser: { userId: string; status: USER_STATUS };

    const userFoundBySameEmail = await this.userService.findOne({
      email,
    });
    if (userFoundBySameEmail) {
      // 기존 동일한 이메일을 사용하는 유저가 있는 경우, 해당 유저에 OAuth 추가 연결
      newOAuthUser = {
        userId: userFoundBySameEmail.userId,
        status: userFoundBySameEmail.status,
      };
    } else {
      // 최초 가입
      const newUserCreated = await this.userService.createUser(
        providerInfo,
        USER_STATUS.PENDING,
      );
      newOAuthUser = {
        userId: newUserCreated.userId,
        status: newUserCreated.status,
      };
    }

    // OAuth 정보 생성 (공통 로직)
    await this.oauthService.createOauthInfo({
      email,
      provider,
      providerId,
      userId: newOAuthUser.userId,
    });

    // TODO: 둘 중 하나라도 실패하는 경우 회원가입 안되도록 롤백 처리 필요

    return {
      userId: newOAuthUser.userId,
      userStatus: newOAuthUser.status,
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
      console.error(error);
      // 토큰이 이미 만료되었거나 유효하지 않은 경우 무시
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userService.findOne({ user_id: userId });
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }
    if (user.status === USER_STATUS.DELETED) {
      throw new BadRequestException('이미 탈퇴된 회원입니다.');
    }

    // if (user.provider === OAUTH_PROVIDER.KAKAO) {
    //   const { id: disconnectedId } = await this.oauthService.disconnectKakao(
    //     user.providerId ?? '',
    //   );
    //   if (user.providerId === disconnectedId.toString()) {
    //     await this.softDeleteUser(userId);
    //   }
    // }

    await this.softDeleteUser(userId);
    // TODO: user.email에 해당되는 정보 oauth 테이블에서 처리하기
  }

  private async softDeleteUser(userId: string): Promise<void> {
    await this.userService.update(userId, {
      userId: 'DELETED_' + userId,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      status: USER_STATUS.DELETED,
    });
    // TODO: 보관용 테이블에 삭제된 유저의 암호화된 provider_id, provider, deleted_at, expires_at (현재+3년?) 저장
  }
}
