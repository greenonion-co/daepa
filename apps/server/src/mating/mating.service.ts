import { Injectable } from '@nestjs/common';
import { CreateMatingDto, MatingBaseDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { LayingBaseDto } from '../laying/laying.dto';

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
  ) {}

  async findAll(userId: string) {
    const matingEntities = await this.matingRepository
      .createQueryBuilder('mating')
      .leftJoinAndSelect('mating.layings', 'layings')
      .where('mating.userId = :userId', { userId })
      .orderBy('mating.createdAt', 'DESC')
      .addOrderBy('layings.layingOrder', 'ASC')
      .getMany();

    return matingEntities.map((mating) => {
      const matingDto = plainToInstance(MatingBaseDto, mating);
      const layingsDto =
        mating.layings?.map((laying) =>
          plainToInstance(LayingBaseDto, laying),
        ) || [];

      return {
        ...matingDto,
        layings: layingsDto,
      };
    });
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    const matingEntity = this.matingRepository.create({
      ...createMatingDto,
      userId,
    });
    return await this.matingRepository.save(matingEntity);
  }
}
