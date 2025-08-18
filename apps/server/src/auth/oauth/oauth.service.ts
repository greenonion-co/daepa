import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ProviderInfo } from '../auth.types';
import { OauthEntity } from './oauth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { plainToInstance } from 'class-transformer';
import { OauthDto } from './oauth.dto';
import { OAUTH_PROVIDER } from '../auth.constants';
import { EntityManager } from 'typeorm';

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

  async findAllProvidersByEmail(email: string): Promise<OAUTH_PROVIDER[]> {
    const oauthEntities = await this.oauthRepository.find({
      where: {
        email,
      },
      select: ['provider'],
    });

    return oauthEntities.map((oauth) => oauth.provider);
  }

  async createOauthInfo(providerInfo: { userId: string } & ProviderInfo) {
    const { email, provider, providerId } = providerInfo;

    await this.oauthRepository.insert({
      email,
      provider,
      providerId,
      userId: providerInfo.userId,
    });
  }

  async deleteAllOauthInfoByEmail(email: string): Promise<void> {
    await this.oauthRepository.delete({
      email,
    });
  }

  async disconnectKakao(providerId: string): Promise<KakaoDisconnectResponse> {
    const response = await firstValueFrom(
      this.httpService
        .post<KakaoDisconnectResponse>(
          'https://kapi.kakao.com/v1/user/unlink',
          {
            target_id_type: 'user_id',
            target_id: providerId,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
              Authorization: `KakaoAK ${process.env.KAKAO_SERVICE_APP_ADMIN_KEY}`,
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

    return response.data;
  }

  async disconnectGoogle(userId: string): Promise<boolean> {
    const oauth = await this.oauthRepository.findOne({
      where: {
        userId,
        provider: OAUTH_PROVIDER.GOOGLE,
      },
    });
    if (!oauth?.refreshToken) {
      throw new BadRequestException('Google OAuth RefreshToken Not Found');
    }

    const response = await firstValueFrom(
      this.httpService
        .post<unknown>(
          'https://oauth2.googleapis.com/revoke',
          {
            token: oauth.refreshToken,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
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
  }

  async getKakaoAccessTokenByRefreshToken(
    refreshToken: string,
  ): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', process.env.KAKAO_CLIENT_ID ?? '');
    params.append('refresh_token', refreshToken);
    if (process.env.KAKAO_CLIENT_SECRET) {
      params.append('client_secret', process.env.KAKAO_CLIENT_SECRET);
    }

    const response = await firstValueFrom(
      this.httpService
        .post<{ access_token: string }>(
          'https://kauth.kakao.com/oauth/token',
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
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

    if (!response.data?.access_token) {
      throw new BadRequestException('카카오 액세스 토큰 갱신에 실패했습니다.');
    }

    return response.data.access_token;
  }

  async getKakaoUserMeByAccessToken(accessToken: string): Promise<{
    id: number;
    kakao_account?: { email?: string };
  }> {
    const response = await firstValueFrom(
      this.httpService
        .get<{
          id: number;
          kakao_account?: { email?: string };
        }>('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response?.data);
            throw error;
          }),
        ),
    );

    return response.data;
  }

  // Transaction 처리를 위해 EntityManager를 받는 메서드 추가
  async createOauthInfoWithEntityManager(
    entityManager: EntityManager,
    providerInfo: { userId: string } & ProviderInfo,
  ) {
    await entityManager.insert(OauthEntity, {
      email: providerInfo.email,
      provider: providerInfo.provider,
      providerId: providerInfo.providerId,
      refreshToken: providerInfo.refreshToken,
      userId: providerInfo.userId,
    });
  }
}
