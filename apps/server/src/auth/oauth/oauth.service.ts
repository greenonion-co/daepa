import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ProviderInfo } from '../auth.types';
import { OauthEntity } from './oauth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { plainToInstance } from 'class-transformer';
import { OauthDto } from './oauth.dto';
import { OAUTH_PROVIDER } from '../auth.constants';
import { EntityManager } from 'typeorm';
import type { JWTPayload as JoseJWTPayload } from 'jose';

type KakaoDisconnectResponse = {
  id: number;
};

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  constructor(
    @InjectRepository(OauthEntity)
    private readonly oauthRepository: Repository<OauthEntity>,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(where: FindOptionsWhere<OauthEntity>) {
    const oauthEntity = await this.oauthRepository.findOneBy(where);
    if (!oauthEntity) {
      return null;
    }

    const oauth = instanceToPlain(oauthEntity);
    return plainToInstance(OauthDto, oauth);
  }

  async findAllByUserId(userId: string) {
    const oauthEntities = await this.oauthRepository.find({
      where: {
        userId,
      },
    });
    return oauthEntities;
  }

  async findAllProvidersByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<OAUTH_PROVIDER[]> {
    const run = async (em: EntityManager) => {
      const oauthEntities = await em.find(OauthEntity, {
        where: {
          email,
        },
        select: ['provider'],
      });

      return oauthEntities.map((oauth) => oauth.provider);
    };

    if (manager) {
      return await run(manager);
    }

    return await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        return await run(entityManager);
      },
    );
  }

  async createOauthInfo(
    providerInfo: { userId: string } & ProviderInfo,
    manager?: EntityManager,
  ) {
    const run = async (em: EntityManager) => {
      await em.insert(OauthEntity, {
        email: providerInfo.email,
        provider: providerInfo.provider,
        providerId: providerInfo.providerId,
        refreshToken: providerInfo.refreshToken,
        userId: providerInfo.userId,
      });
    };

    if (manager) {
      return await run(manager);
    }

    return await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        return await run(entityManager);
      },
    );
  }

  async deleteAllOauthInfoByEmail(email: string): Promise<void> {
    await this.oauthRepository.delete({
      email,
    });
  }

  async disconnectKakao(providerId: string) {
    const adminKey = process.env.KAKAO_SERVICE_APP_ADMIN_KEY;
    if (!adminKey) {
      throw new BadRequestException('Kakao admin key is not configured');
    }

    const form = new URLSearchParams();
    form.append('target_id_type', 'user_id');
    form.append('target_id', providerId);

    try {
      await firstValueFrom(
        this.httpService.post<KakaoDisconnectResponse>(
          'https://kapi.kakao.com/v1/user/unlink',
          form.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
              Authorization: `KakaoAK ${adminKey}`,
            },
          },
        ),
      );
    } catch (err) {
      const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data as { code: number; msg: string };
      // Kakao returns 400 with code -101 when the user is not registered/linked to the app
      if (
        status === 400 &&
        (data?.code === -101 || data?.msg === 'NotRegisteredUserException')
      ) {
        this.logger.warn(
          `Kakao unlink: user not registered (providerId=${providerId}). Treating as success`,
        );
      }

      this.logger.error(data ?? error.message);
      throw error;
    }
  }

  async disconnectGoogle(userId: string) {
    const oauth = await this.oauthRepository.findOne({
      where: {
        userId,
        provider: OAUTH_PROVIDER.GOOGLE,
      },
    });
    if (!oauth?.refreshToken) {
      throw new BadRequestException('Google OAuth RefreshToken Not Found');
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<unknown>(
            'https://oauth2.googleapis.com/revoke',
            {
              token: oauth.refreshToken,
            },
            {
              headers: {
                'Content-Type':
                  'application/x-www-form-urlencoded;charset=utf-8',
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error.response?.data);
              throw error;
            }),
          ),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async verifyAppleIdentityToken(
    identityToken: string,
  ): Promise<JoseJWTPayload> {
    try {
      const { jwtVerify, createRemoteJWKSet } = await import('jose');

      const jwks = createRemoteJWKSet(
        new URL('https://appleid.apple.com/auth/keys'),
      );
      const audiencesEnv = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim();
      if (!audiencesEnv) {
        throw new BadRequestException(
          'Server misconfiguration: NEXT_PUBLIC_APPLE_CLIENT_ID is required for Apple ID token verification',
        );
      }

      const { payload } = await jwtVerify(identityToken, jwks, {
        issuer: 'https://appleid.apple.com',
        audience: audiencesEnv,
      });

      return payload;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async exchangeAppleAuthorizationCode(
    authorizationCode: string,
  ): Promise<string | undefined> {
    const clientSecret = await this.generateAppleClientSecret();
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '';

    const form = new URLSearchParams();
    form.append('client_id', clientId);
    form.append('client_secret', clientSecret);
    form.append('code', authorizationCode);
    form.append('grant_type', 'authorization_code');

    try {
      const response = await firstValueFrom(
        this.httpService.post<{
          access_token?: string;
          expires_in?: number;
          id_token?: string;
          refresh_token?: string;
          token_type?: string;
        }>('https://appleid.apple.com/auth/token', form.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return response.data.refresh_token;
    } catch (error) {
      this.logger.warn('Apple token exchange failed', error);
      return undefined;
    }
  }

  private async generateAppleClientSecret(): Promise<string> {
    const teamId = process.env.APPLE_TEAM_ID ?? '';
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '';
    const keyId = process.env.APPLE_KEY_ID ?? '';
    let privateKey = process.env.APPLE_PRIVATE_KEY ?? '';

    if (!privateKey) {
      const keyLines = [
        process.env.APPLE_PRIVATE_KEY_LINE1,
        process.env.APPLE_PRIVATE_KEY_LINE2,
        process.env.APPLE_PRIVATE_KEY_LINE3,
        process.env.APPLE_PRIVATE_KEY_LINE4,
        process.env.APPLE_PRIVATE_KEY_LINE5,
        process.env.APPLE_PRIVATE_KEY_LINE6,
      ].filter(Boolean) as string[];
      if (keyLines.length > 0) {
        privateKey = keyLines.join('\\n');
      }
    }

    if (!teamId || !clientId || !keyId || !privateKey) {
      throw new BadRequestException(
        'Apple client secret env is not configured',
      );
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const { SignJWT, importPKCS8 } = await import('jose');
    const key = await importPKCS8(privateKey, 'ES256');
    const clientSecret = await new SignJWT({})
      .setIssuer(teamId)
      .setAudience('https://appleid.apple.com')
      .setSubject(clientId)
      .setIssuedAt()
      .setExpirationTime('180d')
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .sign(key);

    return clientSecret;
  }

  async disconnectApple(userId: string): Promise<boolean> {
    const oauth = await this.oauthRepository.findOne({
      where: {
        userId,
        provider: OAUTH_PROVIDER.APPLE,
      },
    });

    if (!oauth) {
      this.logger.warn(`Apple OAuth not found for userId=${userId}`);
      return true;
    }

    if (!oauth.refreshToken) {
      // We don't have a refresh token to revoke, proceed as success
      this.logger.warn(
        `Apple refreshToken not stored for userId=${userId}. Skipping revoke.`,
      );
      return true;
    }

    try {
      const clientSecret = await this.generateAppleClientSecret();

      const form = new URLSearchParams();
      form.append('client_id', process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '');
      form.append('client_secret', clientSecret);
      form.append('token', oauth.refreshToken);
      form.append('token_type_hint', 'refresh_token');

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          'https://appleid.apple.com/auth/revoke',
          form.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return response.status === 200;
    } catch (err) {
      const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data;
      // If token already invalid/expired, treat as success
      if (status === 400) {
        this.logger.warn(
          `Apple revoke returned 400, treating as success. data=${JSON.stringify(
            data,
          )}`,
        );
        return true;
      }

      this.logger.error(data ?? error.message);
      throw error;
    }
  }
}
