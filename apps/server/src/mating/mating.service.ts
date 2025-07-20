import { Injectable } from '@nestjs/common';
import { CreateMatingDto, MatingDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { LayingBaseDto } from '../laying/laying.dto';
import { PetSummaryDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { LayingEntity } from 'src/laying/laying.entity';

interface MatingWithRelations extends MatingEntity {
  layings?: Partial<LayingEntity>[];
  father?: Partial<PetEntity>;
  mother?: Partial<PetEntity>;
}

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
  ) {}

  async findAll(userId: string) {
    const result = (await this.matingRepository
      .createQueryBuilder('matings')
      .leftJoinAndMapMany(
        'matings.layings', // matings에 할당될 필드명
        LayingEntity, // 매핑할 엔티티
        'layings', // 매핑할 엔티티 alias
        'layings.matingId = matings.id', // JOIN 조건
      )
      .leftJoinAndMapOne(
        'matings.father',
        PetEntity,
        'father',
        'father.petId = matings.fatherId',
      )
      .leftJoinAndMapOne(
        'matings.mother',
        PetEntity,
        'mother',
        'mother.petId = matings.motherId',
      )
      .select([
        'matings.id',
        'matings.matingDate',
        'layings.id',
        'layings.eggId',
        'layings.layingDate',
        'layings.layingOrder',
        'layings.eggType',
        'layings.temperture',
        'father.petId',
        'father.name',
        'father.morphs',
        'father.species',
        'father.sex',
        'father.birthdate',
        'father.growth',
        'father.weight',
        'mother.petId',
        'mother.name',
        'mother.morphs',
        'mother.species',
        'mother.sex',
        'mother.birthdate',
        'mother.growth',
        'mother.weight',
      ])
      .where('matings.user_id = :userId', { userId })
      .orderBy('matings.createdAt', 'DESC')
      .addOrderBy('layings.layingOrder', 'ASC')
      .getMany()) as MatingWithRelations[];

    return result.map((mating) => {
      const matingDto = plainToInstance(MatingDto, mating);
      const layingsDto = mating.layings?.map((laying) =>
        plainToInstance(LayingBaseDto, laying),
      );
      const fatherSummaryDto = plainToInstance(PetSummaryDto, mating.father);
      const motherSummaryDto = plainToInstance(PetSummaryDto, mating.mother);

      return {
        ...matingDto,
        layings: layingsDto,
        father: fatherSummaryDto,
        mother: motherSummaryDto,
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
