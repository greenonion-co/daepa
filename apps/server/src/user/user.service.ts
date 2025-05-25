import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserDto } from './user.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async findOne(userId: string) {
    const userEntity = await this.userRepository.findOneBy({ user_id: userId });
    if (!userEntity) {
      return null;
    }

    return plainToInstance(UserDto, {
      userId: userEntity.user_id,
      name: userEntity.name,
      role: userEntity.role,
    });
  }
}
