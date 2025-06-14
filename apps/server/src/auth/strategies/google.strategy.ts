import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService, ValidatedUser } from '../auth.service';
import { OAUTH_PROVIDER } from '../auth.constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: '/api/auth/sign-in/google',
      scope: ['profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: any, validatedUser?: ValidatedUser) => void,
  ) {
    try {
      const providerInfo = {
        provider: OAUTH_PROVIDER.GOOGLE,
        providerId: profile.id.toString(),
      };

      const validatedUser = await this.authService.validateUser(providerInfo);

      done(null, validatedUser);
    } catch (error) {
      done(error);
    }
  }
}
