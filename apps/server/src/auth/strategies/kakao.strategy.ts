import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { OAUTH_PROVIDER } from '../auth.constants';
import { AuthService } from '../auth.service';
import { UserDto } from 'src/user/user.dto';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
      callbackURL: '/api/auth/sign-in/kakao',
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: any, user?: UserDto) => void,
  ) {
    try {
      const providerInfo = {
        provider: OAUTH_PROVIDER.KAKAO,
        providerId: profile.id.toString(),
      };

      const user = await this.authService.validateUser(providerInfo);

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
