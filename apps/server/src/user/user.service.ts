import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserDto } from './user.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ProviderInfo } from 'src/auth/auth.types';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { nanoid } from 'nanoid';

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

  async createUser(providerInfo: ProviderInfo) {
    const { provider, providerId } = providerInfo;

    const userId = await this.generateUserId();
    const pendingName = `user_${userId}`;

    const userEntity = plainToInstance(UserEntity, {
      userId,
      name: pendingName,
      role: USER_ROLE.USER,
      provider,
      providerId,
      status: USER_STATUS.PENDING,
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

  async update(userId: string, userDto: Partial<UserDto>) {
    const user = instanceToPlain(userDto);
    const userUpdateEntity = plainToInstance(UserEntity, user);
    await this.userRepository.update({ user_id: userId }, userUpdateEntity);
  }
}
