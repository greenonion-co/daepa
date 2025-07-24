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
      scope: ['profile', 'email'],
    });
  }

  authorizationParams() {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    _accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, validatedUser?: ValidatedUser) => void,
  ) {
    try {
      if (!profile.id) {
        throw new Error('Google profile id is required');
      }
      if (!profile.emails?.[0]?.value) {
        throw new Error('Google email is required');
      }

      const providerInfo = {
        email: profile.emails[0].value,
        provider: OAUTH_PROVIDER.GOOGLE,
        providerId: profile.id.toString(),
        refreshToken,
      };

      const validatedUser = await this.authService.validateUser(providerInfo);

      done(null, validatedUser);
    } catch (error) {
      done(error);
    }
  }
}
