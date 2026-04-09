import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Not, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import {
  BreederPublicProfileDto,
  CreateInitUserInfoDto,
  UpdateUserPrivateInfoDto,
  UserDto,
  UserFilterDto,
  UserPrivateInfoDto,
  UserProfilePublicDto,
} from './user.dto';
import { ProviderInfo } from 'src/auth/auth.types';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { PetEntity } from 'src/pet/pet.entity';
import { PET_TYPE } from 'src/pet/pet.constants';
import { nanoid } from 'nanoid';
import { isMySQLError } from 'src/common/error';
import { OauthService } from 'src/auth/oauth/oauth.service';
import { EntityManager } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { OauthEntity } from 'src/auth/oauth/oauth.entity';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { CacheInvalidation } from 'src/common/cache-invalidation';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly oauthService: OauthService,
    private readonly dataSource: DataSource,
    private readonly cacheInvalidation: CacheInvalidation,
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
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toUserSimpleDto(entity: UserEntity): UserProfilePublicDto {
    return {
      status: entity.status,
      userId: entity.userId,
      name: entity.name,
      role: entity.role,
      isBiz: entity.isBiz,
    };
  }

  async findOneEntity(
    where: FindOptionsWhere<UserEntity>,
  ): Promise<UserEntity | null> {
    return this.userRepository.findOneBy(where);
  }

  async findOne(where: FindOptionsWhere<UserEntity>) {
    const userEntity = await this.userRepository.findOneBy(where);

    if (!userEntity) {
      return null;
    }

    return this.toUserDto(userEntity);
  }

  async findOneProfile(userId: string, manager?: EntityManager) {
    const run = async (em: EntityManager) => {
      const userEntity = await this.userRepository.findOneBy({
        userId,
      });
      if (!userEntity) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      const userProviders = await this.oauthService.findAllProvidersByEmail(
        userEntity.email,
        em,
      );

      return {
        ...this.toUserDto(userEntity),
        provider: userProviders,
      };
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

  async createInitUserInfo(
    userId: string,
    createInitUserInfoDto: CreateInitUserInfoDto,
  ) {
    try {
      const { name, isBiz } = createInitUserInfoDto;
      if (name.length < 2 || name.length > 15) {
        throw new BadRequestException(
          '사용자명은 2자 이상 15자 이하여야 합니다.',
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
          throw new ConflictException(
            '이미 사용중인 사용자명입니다. 다른 사용자명을 입력해주세요.',
          );
        }
      }
      throw error;
    }
  }

  async update(userId: string, data: Partial<UserEntity>) {
    const userEntity = new UserEntity();
    Object.assign(userEntity, data);
    await this.userRepository.update({ userId }, userEntity);
  }

  async isNameExist(nickname: string) {
    const isExist = await this.userRepository.exists({
      where: {
        name: nickname,
        status: Not(USER_STATUS.DELETED),
      },
    });
    return isExist;
  }

  async isEmailExist(email: string) {
    const isExist = await this.userRepository.exists({
      where: {
        email,
        status: Not(USER_STATUS.DELETED),
      },
    });
    return isExist;
  }

  async createUser(
    providerInfo: ProviderInfo,
    status: USER_STATUS,
    manager?: EntityManager,
  ) {
    const run = async (em: EntityManager) => {
      const userId = await this.generateUserId();
      const pendingName = `USER_${userId}`;
      const createUserEntity = plainToInstance(UserEntity, {
        userId,
        name: pendingName,
        email: providerInfo.email,
        role: USER_ROLE.BREEDER,
        provider: providerInfo.provider,
        providerId: providerInfo.providerId,
        status,
      });

      const savedUserEntity = await em.save(UserEntity, createUserEntity);
      return this.toUserDto(savedUserEntity);
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

  async findPrivateInfo(userId: string): Promise<UserPrivateInfoDto> {
    const userEntity = await this.userRepository.findOneBy({ userId });
    if (!userEntity) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return {
      realName: userEntity.realName,
      phone: userEntity.phone,
      address: userEntity.address,
      isRealNamePublic: userEntity.isRealNamePublic,
      isPhonePublic: userEntity.isPhonePublic,
      isAddressPublic: userEntity.isAddressPublic,
    };
  }

  async updatePrivateInfo(
    userId: string,
    dto: UpdateUserPrivateInfoDto,
  ): Promise<void> {
    const userEntity = await this.userRepository.findOneBy({ userId });
    if (!userEntity) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    await this.userRepository.update({ userId }, dto);
    await this.cacheInvalidation.onUserProfileChanged(userEntity.name);
  }

  async findPublicProfileByName(
    name: string,
  ): Promise<BreederPublicProfileDto> {
    const userEntity = await this.userRepository.findOneBy({
      name,
      status: USER_STATUS.ACTIVE,
    });

    if (!userEntity) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const petCount = await this.dataSource.getRepository(PetEntity).count({
      where: {
        ownerId: userEntity.userId,
        isPublic: true,
        isDeleted: false,
        type: PET_TYPE.PET,
      },
    });

    return {
      ...this.toUserSimpleDto(userEntity),
      petCount,
      realName: userEntity.isRealNamePublic ? userEntity.realName : null,
      phone: userEntity.isPhonePublic ? userEntity.phone : null,
      address: userEntity.isAddressPublic ? userEntity.address : null,
      bannerImageUrl: userEntity.bannerImageUrl ?? null,
      bio: userEntity.bio ?? null,
    };
  }

  async getUserListSimple(
    query: UserFilterDto,
    userId: string,
  ): Promise<PageDto<UserProfilePublicDto>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .where('users.status = :status', {
        status: USER_STATUS.ACTIVE,
      })
      .andWhere('users.userId != :userId', { userId });

    if (query.keyword) {
      queryBuilder.andWhere('users.name LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    queryBuilder
      .orderBy('users.name', query.order)
      .skip(query.skip)
      .take(query.itemPerPage);

    const [entities, total] = await queryBuilder.getManyAndCount();
    const users = entities.map((e) => this.toUserSimpleDto(e));

    const pageMetaDto = new PageMetaDto({
      totalCount: total,
      pageOptionsDto: query,
    });

    return new PageDto(users, pageMetaDto);
  }
}
