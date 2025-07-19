import { Injectable } from '@nestjs/common';
import { CreateMatingDto, MatingBaseDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
  ) {}

  async findAll(userId: string) {
    const matingEntities = await this.matingRepository.find({
      where: {
        userId,
      },
    });
    return matingEntities.map((mating) =>
      plainToInstance(MatingBaseDto, mating),
    );
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    const matingEntity = this.matingRepository.create({
      ...createMatingDto,
      userId,
    });
    return await this.matingRepository.save(matingEntity);
  }
}
