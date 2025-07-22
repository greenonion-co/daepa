import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMatingDto, MatingBaseDto, MatingDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PetSummaryDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { groupBy } from 'es-toolkit';
import { PET_SEX } from 'src/pet/pet.constants';
import { EggEntity } from 'src/egg/egg.entity';
import { EggBaseDto, LayingDto } from 'src/egg/egg.dto';

interface MatingWithRelations extends MatingEntity {
  eggs?: Partial<EggEntity>[];
  parents?: Partial<PetEntity>[];
}

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
  ) {}

  async findAll(userId: string) {
    const entities = (await this.matingRepository
      .createQueryBuilder('matings')
      .leftJoinAndMapMany(
        'matings.eggs',
        EggEntity,
        'eggs',
        'eggs.matingId = matings.id AND eggs.is_deleted = :isDeleted',
        { isDeleted: false },
      )
      .leftJoinAndMapMany(
        'matings.parents',
        PetEntity,
        'parents',
        'parents.petId IN (matings.fatherId, matings.motherId)',
      )
      .select([
        'matings.id',
        'matings.matingDate',
        'matings.fatherId',
        'matings.motherId',
        'eggs.eggId',
        'eggs.layingDate',
        'eggs.clutch',
        'eggs.clutchOrder',
        'eggs.name',
        'eggs.hatchedPetId',
        'eggs.temperature',
        'parents.petId',
        'parents.name',
        'parents.morphs',
        'parents.species',
        'parents.sex',
        'parents.birthdate',
        'parents.growth',
        'parents.weight',
      ])
      .where('matings.user_id = :userId', { userId })
      .orderBy('matings.createdAt', 'DESC')
      .addOrderBy('eggs.clutchOrder', 'ASC')
      .getMany()) as MatingWithRelations[];

    return this.formatResponseByDate(entities);
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    if (!createMatingDto.fatherId && !createMatingDto.motherId) {
      throw new BadRequestException('최소 하나의 부모 펫을 입력해야 합니다.');
    }

    const existingMating = await this.matingRepository.findOne({
      where: {
        userId,
        fatherId: createMatingDto.fatherId,
        motherId: createMatingDto.motherId,
        matingDate: createMatingDto.matingDate,
      },
    });

    if (existingMating) {
      throw new BadRequestException('이미 존재하는 메이팅 정보입니다.');
    }

    const matingEntity = this.matingRepository.create({
      ...createMatingDto,
      userId,
    });
    return await this.matingRepository.save(matingEntity);
  }

  private formatResponseByDate(data: MatingWithRelations[]) {
    const resultDto = data.map((mating) => {
      const matingDto = plainToInstance(MatingDto, mating);
      const eggDto = mating.eggs?.map((egg) =>
        plainToInstance(EggBaseDto, egg),
      );
      const parentsDto = mating.parents?.map((parent) =>
        plainToInstance(PetSummaryDto, parent),
      );
      return {
        ...matingDto,
        eggs: eggDto,
        parents: parentsDto,
      };
    });

    const groupedByParents = groupBy(resultDto, (mating) => {
      const fatherId = mating.fatherId ?? 'null';
      const motherId = mating.motherId ?? 'null';

      // 부모 중 null 값이 있는 경우 각각 다른 그룹으로 처리
      if (mating.fatherId === null || mating.motherId === null) {
        return `${fatherId}-${motherId}-${mating.id}`;
      }

      return `${fatherId}-${motherId}`;
    });

    return Object.values(groupedByParents).map((matingByParents) => {
      const { parents } = matingByParents[0];
      const father = parents?.find((parent) => parent.sex === PET_SEX.MALE);
      const mother = parents?.find((parent) => parent.sex === PET_SEX.FEMALE);

      const matingsByDate = matingByParents
        .map((mating) => {
          const { id, matingDate, eggs } = mating;
          const eggsByDate = this.groupEggsByDate(eggs);
          console.log(eggsByDate?.[0]?.layings);
          return {
            id,
            matingDate,
            layingsByDate: eggsByDate,
          };
        })
        .sort((a, b) => b.matingDate - a.matingDate);

      return {
        father,
        mother,
        matingsByDate,
      };
    });
  }

  private groupEggsByDate(eggs: EggBaseDto[] | undefined) {
    if (!eggs?.length) return;

    const grouped = groupBy(eggs, (egg) => egg.layingDate);

    return Object.entries(grouped).map(([layingDate, eggsForDate]) => ({
      layingDate: parseInt(layingDate, 10),
      layings: eggsForDate.map((egg) => plainToInstance(LayingDto, egg)),
    }));
  }

  async isMatingExist(criteria: Partial<MatingBaseDto>) {
    const isExist = await this.matingRepository.existsBy(criteria);
    return isExist;
  }
}
