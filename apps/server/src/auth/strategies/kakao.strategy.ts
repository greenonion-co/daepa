import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { OAUTH_PROVIDER } from '../auth.constants';
import { AuthService, ValidatedUser } from '../auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.SERVER_BASE_URL}/api/auth/sign-in/kakao`,
    });
  }

  private isKakaoProfileJson(value: unknown): value is {
    id: number;
    kakao_account?: { email?: string };
  } {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    if (typeof obj.id !== 'number') return false;
    const account = obj.kakao_account as Record<string, unknown> | undefined;
    if (
      account !== undefined &&
      (typeof account !== 'object' || account === null)
    ) {
      return false;
    }
    if (account && 'email' in account && typeof account.email !== 'string') {
      return false;
    }
    return true;
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: unknown, validatedUser?: ValidatedUser) => void,
  ) {
    try {
      if (!profile.id) {
        throw new Error('Kakao profile id is required');
      }
      const raw: unknown = (profile as unknown as { _json?: unknown })?._json;
      if (!this.isKakaoProfileJson(raw)) {
        throw new Error('Kakao profile json is invalid');
      }
      const kakaoAccountEmail = raw.kakao_account?.email;
      if (
        typeof kakaoAccountEmail !== 'string' ||
        kakaoAccountEmail.length === 0
      ) {
        throw new Error('Kakao email is required');
      }

      const providerInfo = {
        email: kakaoAccountEmail,
        provider: OAUTH_PROVIDER.KAKAO,
        providerId: profile.id.toString(),
      };

      const validatedUser = await this.authService.validateUser(providerInfo);

      done(null, validatedUser);
    } catch (error) {
      done(error);
    }
  }
}
