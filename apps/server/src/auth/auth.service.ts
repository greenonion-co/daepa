import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ProviderInfo } from './auth.types';
import { JwtService } from '@nestjs/jwt';
import { USER_ROLE, USER_STATUS } from 'src/user/user.constant';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';
import { OauthService } from './oauth/oauth.service';
import { Not, Repository } from 'typeorm';
import { OauthEntity } from './oauth/oauth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { plainToInstance } from 'class-transformer';
import { OauthDto } from './oauth/oauth.dto';
import { UserDto } from 'src/user/user.dto';
import { DataSource, EntityManager } from 'typeorm';
import { OAUTH_PROVIDER } from './auth.constants';

export type ValidatedUser = {
  userId: string;
  userStatus: USER_STATUS;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(OauthEntity)
    private readonly oauthRepository: Repository<OauthEntity>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly oauthService: OauthService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async validateAppleNativeAndGetUser({
    identityToken,
    email,
    authorizationCode,
  }: {
    identityToken: string;
    email?: string;
    authorizationCode?: string;
  }): Promise<ValidatedUser> {
    const payload =
      await this.oauthService.verifyAppleIdentityToken(identityToken);

    const providerId = String((payload.sub ?? '').toString());
    const emailFromToken = (payload as Record<string, unknown>).email as
      | string
      | undefined;

    if (emailFromToken && email && emailFromToken !== email) {
      throw new UnauthorizedException(
        '토큰의 이메일과 요청 이메일이 일치하지 않습니다.',
      );
    }
    const resolvedEmail = emailFromToken ?? email;

    if (!providerId) {
      throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
    }
    if (!resolvedEmail) {
      // 이메일이 없으면 기존 APPLE OAuth를 providerId로 조회하여 로그인 허용
      const existing = await this.getOAuthWithUserByProviderId({
        provider: OAUTH_PROVIDER.APPLE,
        providerId,
      });
      if (existing?.user) {
        return {
          userId: existing.user.userId,
          userStatus: existing.user.status,
        };
      }

      throw new HttpException(
        { code: 600, message: 'Apple 이메일이 필요합니다.' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Authorization Code가 있으면 Apple 토큰 교환으로 refresh_token 확보
    let refreshToken: string | undefined;

    if (authorizationCode) {
      refreshToken =
        await this.oauthService.exchangeAppleAuthorizationCode(
          authorizationCode,
        );
    }

    return this.validateUser({
      email: resolvedEmail,
      provider: OAUTH_PROVIDER.APPLE,
      providerId,
      refreshToken,
    });
  }

  async validateUser(providerInfo: ProviderInfo): Promise<ValidatedUser> {
    // 기존 OAuth 계정 확인
    const oauthFound = await this.getOAuthWithUserByProviderInfo(providerInfo);
    if (oauthFound) {
      const { user } = oauthFound;
      if (!user) {
        throw new BadRequestException(
          'SNS 계정으로 사용자 정보를 불러오는데 실패했습니다. 관리자에게 문의해주세요.',
        );
      }

      // refreshToken이 전달된 경우 provider와 무관하게 업데이트
      if (providerInfo.refreshToken) {
        await this.oauthRepository.update(
          {
            email: providerInfo.email,
            provider: providerInfo.provider,
            providerId: providerInfo.providerId,
          },
          {
            refreshToken: providerInfo.refreshToken,
          },
        );
      }

      // 기존 사용자 로그인
      return {
        userId: user.userId,
        userStatus: user.status,
      };
    }

    // 새로운 OAuth 가입 - 트랜잭션 내에서 처리
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      let newOAuthUser: {
        userId: string;
        status: USER_STATUS;
      };

      // 동일한 이메일을 사용하는 기존 사용자 확인
      const userFoundBySameEmail = await entityManager.findOne(UserEntity, {
        where: {
          email: providerInfo.email,
          status: Not(USER_STATUS.DELETED),
        },
      });

      if (userFoundBySameEmail) {
        // 기존 동일한 이메일을 사용하는 유저가 있는 경우, 해당 유저에 OAuth 추가 연결
        newOAuthUser = {
          userId: userFoundBySameEmail.userId,
          status: userFoundBySameEmail.status,
        };
      } else {
        // 해당 이메일 최초 가입
        const newUserCreated =
          await this.userService.createUserWithEntityManager(
            entityManager,
            providerInfo,
            USER_STATUS.PENDING,
          );
        newOAuthUser = {
          userId: newUserCreated.userId,
          status: newUserCreated.status,
        };
      }

      // OAuth 정보 생성
      await this.oauthService.createOauthInfoWithEntityManager(entityManager, {
        ...providerInfo,
        userId: newOAuthUser.userId,
      });

      return {
        userId: newOAuthUser.userId,
        userStatus: newOAuthUser.status,
      };
    });
  }

  createJwtAccessToken({ userId, role }: { userId: string; role: USER_ROLE }) {
    const accessToken = this.jwtService.sign({
      sub: userId,
      status: 'authenticated',
      role,
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
        userId: tokenPayload.sub,
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

      const newAccessToken = this.createJwtAccessToken({
        userId: user.userId,
        role: user.role,
      });

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
    const user = await this.userService.findOne({ userId });
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
    const { user, oauths } =
      await this.userService.getUserWithOauthsEntity(userId);

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }
    if (user.status === USER_STATUS.DELETED) {
      throw new BadRequestException('이미 탈퇴된 회원입니다.');
    }
    if (oauths.length === 0) {
      throw new BadRequestException('OAuth 정보를 찾을 수 없습니다.');
    }

    for (const oauth of oauths) {
      switch (oauth.provider) {
        case OAUTH_PROVIDER.KAKAO:
          try {
            await this.oauthService.disconnectKakao(oauth.providerId ?? '');
          } catch (error) {
            this.logger.warn(
              `Kakao unlink failed but continuing account deletion: ${
                (error as Error).message
              }`,
            );
          }
          break;
        case OAUTH_PROVIDER.GOOGLE:
          await this.oauthService.disconnectGoogle(userId);
          break;
        case OAUTH_PROVIDER.APPLE:
          await this.oauthService.disconnectApple(userId);
          break;
      }
    }

    await this.softDeleteUser({
      userId,
      name: user.name,
      email: user.email,
    });
    await this.oauthService.deleteAllOauthInfoByEmail(user.email);
  }

  private async softDeleteUser({
    userId,
    name,
    email,
  }: {
    userId: string;
    name: string;
    email: string;
  }): Promise<void> {
    await this.userService.update(userId, {
      userId: `DELETED_${userId}_${Date.now()}`,
      name: `DELETED_${name}_${userId}`,
      email: `DELETED_${email}_${userId}`,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      status: USER_STATUS.DELETED,
    });
    // TODO: 보관용 테이블에 삭제된 유저의 암호화된 provider_id, provider, deleted_at, expires_at (현재+3년?) 저장
  }

  async getOAuthWithUserByProviderInfo({
    email,
    provider,
    providerId,
  }: ProviderInfo) {
    const entity = (await this.oauthRepository
      .createQueryBuilder('oauth')
      .innerJoinAndMapOne(
        'oauth.user',
        UserEntity,
        'user',
        'user.email = oauth.email',
      )
      .where(
        'oauth.email = :email AND oauth.provider = :provider AND oauth.providerId = :providerId AND user.status != :status',
        {
          email,
          provider,
          providerId,
          status: USER_STATUS.DELETED,
        },
      )
      .getOne()) as OauthEntity & { user: UserEntity };

    if (!entity) return null;

    const { user, ...oauthEntity } = entity;
    const oauthDto = plainToInstance(OauthDto, oauthEntity);
    const userDto = plainToInstance(UserDto, user);

    return {
      ...oauthDto,
      user: userDto,
    };
  }

  async getOAuthWithUserByProviderId({
    provider,
    providerId,
  }: {
    provider: OAUTH_PROVIDER;
    providerId: string;
  }) {
    const entity = (await this.oauthRepository
      .createQueryBuilder('oauth')
      .innerJoinAndMapOne(
        'oauth.user',
        UserEntity,
        'user',
        'user.email = oauth.email',
      )
      .where(
        'oauth.provider = :provider AND oauth.providerId = :providerId AND user.status != :status',
        {
          provider,
          providerId,
          status: USER_STATUS.DELETED,
        },
      )
      .getOne()) as OauthEntity & { user: UserEntity };

    if (!entity) return null;

    const { user, ...oauthEntity } = entity;
    const oauthDto = plainToInstance(OauthDto, oauthEntity);
    const userDto = plainToInstance(UserDto, user);

    return {
      ...oauthDto,
      user: userDto,
    };
  }
}
