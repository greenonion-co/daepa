import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMatingDto, MatingDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { LayingBaseDto, LayingDto } from '../laying/laying.dto';
import { PetSummaryDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { LayingEntity } from 'src/laying/laying.entity';
import { groupBy, omit } from 'es-toolkit';
import { PET_SEX } from 'src/pet/pet.constants';

interface MatingWithRelations extends MatingEntity {
  layings?: Partial<LayingEntity>[];
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
        'matings.layings',
        LayingEntity,
        'layings',
        'layings.matingId = matings.id',
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
        'layings.id',
        'layings.eggId',
        'layings.layingDate',
        'layings.layingOrder',
        'layings.eggType',
        'layings.temperature',
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
      .addOrderBy('layings.layingOrder', 'ASC')
      .getMany()) as MatingWithRelations[];

    return this.formatResponseByDate(entities);
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    if (!createMatingDto.fatherId && !createMatingDto.motherId) {
      throw new BadRequestException('최소 하나의 부모 펫을 입력해야 합니다.');
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
      const layingsDto = mating.layings?.map((laying) =>
        plainToInstance(LayingBaseDto, laying),
      );
      const parentsDto = mating.parents?.map((parent) =>
        plainToInstance(PetSummaryDto, parent),
      );
      return {
        ...matingDto,
        layings: layingsDto,
        parents: parentsDto,
      };
    });

    const groupedByParents = groupBy(resultDto, (mating) => {
      const fatherId = mating.fatherId ?? 'null';
      const motherId = mating.motherId ?? 'null';
      const matingDate = mating.matingDate;

      // 부모 중 null 값이 있는 경우 각각 다른 그룹으로 처리
      if (mating.fatherId === null || mating.motherId === null) {
        return `${fatherId}-${motherId}-${matingDate}-${mating.id}`;
      }

      return `${fatherId}-${motherId}-${matingDate}`;
    });

    return Object.values(groupedByParents).map((matingByParents) => {
      const { parents } = matingByParents[0];
      const father = parents?.find((parent) => parent.sex === PET_SEX.MALE);
      const mother = parents?.find((parent) => parent.sex === PET_SEX.FEMALE);

      const matingsByDate = matingByParents.map((mating) => {
        const { id, matingDate, layings } = mating;
        const layingsByDate = this.groupLayingsByDate(layings);
        return {
          id,
          matingDate,
          layingsByDate,
        };
      });

      return {
        father,
        mother,
        matingsByDate,
      };
    });
  }

  private groupLayingsByDate(layings: LayingBaseDto[] | undefined) {
    if (!layings?.length) return;

    const grouped = groupBy(layings, (laying) => laying.layingDate);

    return Object.entries(grouped).map(([layingDate, layingsForDate]) => ({
      layingDate: parseInt(layingDate, 10),
      layings: layingsForDate.map((laying) =>
        omit(laying, ['layingDate']),
      ) as LayingDto[],
    }));
  }
}
