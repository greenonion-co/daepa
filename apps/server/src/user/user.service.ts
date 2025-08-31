import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateInitUserInfoDto, UserDto } from './user.dto';
import { ProviderInfo } from 'src/auth/auth.types';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { nanoid } from 'nanoid';
import { isMySQLError } from 'src/common/error';
import { OauthService } from 'src/auth/oauth/oauth.service';
import { EntityManager } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { OauthEntity } from 'src/auth/oauth/oauth.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly oauthService: OauthService,
  ) {}

  async generateUserId() {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const userId = nanoid(6);
      const existingUser = await this.userRepository.findOneBy({
        userId,
      });
      if (!existingUser) {
        return userId;
      }
    }

    throw new Error('Failed to generate unique userId after maximum attempts');
  }

  async getUserWithOauthsEntity(userId: string) {
    const entity = (await this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndMapMany(
        'users.oauths',
        OauthEntity,
        'oauths',
        'oauths.userId = users.userId',
      )
      .where('users.userId = :userId', { userId })
      .getOne()) as UserEntity & { oauths: OauthEntity[] };

    const { oauths, ...user } = entity;

    return {
      user,
      oauths,
    };
  }

  private toUserDto(entity: UserEntity): UserDto {
    return {
      userId: entity.userId,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      isBiz: entity.isBiz,
      refreshToken: entity.refreshToken,
      refreshTokenExpiresAt: entity.refreshTokenExpiresAt,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findOne(where: FindOptionsWhere<UserEntity>) {
    const userEntity = await this.userRepository.findOneBy(where);

    if (!userEntity) {
      return null;
    }

    return this.toUserDto(userEntity);
  }

  async findOneProfile(userId: string) {
    console.log('userId: ', userId);
    const userEntity = await this.userRepository.findOneBy({
      userId,
    });
    if (!userEntity) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const userProviders = await this.oauthService.findAllProvidersByEmail(
      userEntity.email,
    );

    return {
      ...this.toUserDto(userEntity),
      provider: userProviders,
    };
  }

  async createInitUserInfo(
    userId: string,
    createInitUserInfoDto: CreateInitUserInfoDto,
  ) {
    try {
      const { name, isBiz } = createInitUserInfoDto;
      if (name.length < 2 || name.length > 15) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: '사용자명은 2자 이상 15자 이하여야 합니다.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userRepository.update(
        { userId },
        {
          name,
          isBiz,
          status: USER_STATUS.ACTIVE,
        },
      );
    } catch (error) {
      if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('UNIQUE_USER_NAME')) {
          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message:
                '이미 사용중인 사용자명입니다. 다른 사용자명을 입력해주세요.',
            },
            HttpStatus.CONFLICT,
          );
        }
      }
      throw error;
    }
  }

  async update(userId: string, userDto: Partial<UserDto>) {
    const userEntity = new UserEntity();
    Object.assign(userEntity, userDto);
    await this.userRepository.update({ userId }, userEntity);
  }

  async isNameExist(nickname: string) {
    const isExist = await this.userRepository.exists({
      where: {
        name: nickname,
        status: Not(USER_STATUS.DELETED),
      },
    });
    return !!isExist;
  }

  async isEmailExist(email: string) {
    const isExist = await this.userRepository.exists({
      where: {
        email,
        status: Not(USER_STATUS.DELETED),
      },
    });
    return !!isExist;
  }

  // Transaction 처리를 위해 EntityManager를 받는 메서드 추가
  async createUserWithEntityManager(
    entityManager: EntityManager,
    providerInfo: ProviderInfo,
    status: USER_STATUS,
  ) {
    const userId = await this.generateUserId();
    const pendingName = `USER_${userId}`;
    const createUserEntity = plainToInstance(UserEntity, {
      userId,
      name: pendingName,
      email: providerInfo.email,
      role: USER_ROLE.USER,
      provider: providerInfo.provider,
      providerId: providerInfo.providerId,
      status,
    });

    const savedUserEntity = await entityManager.save(
      UserEntity,
      createUserEntity,
    );
    return this.toUserDto(savedUserEntity);
  }
}
