import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

type KakaoDisconnectResponse = {
  id: number;
};

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  constructor(private readonly httpService: HttpService) {}

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
