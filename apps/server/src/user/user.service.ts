import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateInitUserInfoDto, UserDto, UserProfileDto } from './user.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ProviderInfo } from 'src/auth/auth.types';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { nanoid } from 'nanoid';
import { isMySQLError } from 'src/common/error';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async generateUserId() {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const userId = nanoid(6);
      const existingUser = await this.userRepository.findOneBy({
        user_id: userId,
      });
      if (!existingUser) {
        return userId;
      }
    }

    throw new Error('Failed to generate unique userId after maximum attempts');
  }

  async createUser(
    providerInfo: ProviderInfo,
    status: (typeof USER_STATUS)[keyof typeof USER_STATUS],
  ) {
    const { provider, providerId } = providerInfo;

    const userId = await this.generateUserId();
    const pendingName = `USER_${userId}`;

    const userEntity = plainToInstance(UserEntity, {
      userId,
      name: pendingName,
      role: USER_ROLE.USER,
      provider,
      providerId,
      status,
      lastLoginAt: new Date(),
    });

    const savedUserEntity = await this.userRepository.save(userEntity);
    const savedUser = instanceToPlain(savedUserEntity);
    return plainToInstance(UserDto, savedUser);
  }

  async findOne(where: FindOptionsWhere<UserEntity>) {
    const userEntity = await this.userRepository.findOneBy(where);

    if (!userEntity) {
      return null;
    }

    const user = instanceToPlain(userEntity);
    return plainToInstance(UserDto, user);
  }

  async findOneProfile(where: FindOptionsWhere<UserEntity>) {
    const userEntity = await this.userRepository.findOneBy(where);

    if (!userEntity) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const user = instanceToPlain(userEntity);
    return plainToInstance(UserProfileDto, user);
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
        { user_id: userId },
        {
          name,
          is_biz: isBiz,
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
    const user = instanceToPlain(userDto);
    const userUpdateEntity = plainToInstance(UserEntity, user);
    await this.userRepository.update({ user_id: userId }, userUpdateEntity);
  }
}
