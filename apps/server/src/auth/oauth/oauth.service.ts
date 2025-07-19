import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
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
}
