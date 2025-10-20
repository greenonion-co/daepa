import { Injectable } from '@nestjs/common';
import { PET_SPECIES, PET_TYPE } from 'src/pet/pet.constants';
import { DataSource, Repository } from 'typeorm';
import { PairEntity } from './pair.entity';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { compact, isNil, omitBy, uniq } from 'es-toolkit';
import { plainToInstance } from 'class-transformer';
import { PairDetailDto, PairDto } from './pair.dto';
import { MatingEntity } from 'src/mating/mating.entity';
import { LayingEntity } from 'src/laying/laying.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PetLayingDto } from 'src/pet/pet.dto';
import { format } from 'date-fns';

@Injectable()
export class PairService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
  ) {}

  async getPairList(userId: string, species: PET_SPECIES) {
    const pairs = await this.dataSource
      .createQueryBuilder(PairEntity, 'pairs')
      .where('pairs.ownerId = :userId AND pairs.species = :species', {
        userId,
        species,
      })
      .getMany();

    if (pairs.length === 0) return [];

    const parentsPetIds = uniq(pairs.flatMap((p) => [p.fatherId, p.motherId]));

    const pets = await this.dataSource
      .createQueryBuilder(PetEntity, 'p')
      .leftJoinAndMapOne(
        'p.petDetail',
        PetDetailEntity,
        'pd',
        'pd.petId = p.petId',
      )
      .where('p.petId IN (:...parentsPetIds)', { parentsPetIds })
      .select([
        'p.petId',
        'p.name',
        'p.species',
        'p.hatchingDate',
        'pd.sex',
        'pd.morphs',
        'pd.traits',
        'pd.weight',
        'pd.growth',
      ])
      .getMany();

    const petMap = new Map(pets.map((pet) => [pet.petId, pet]));

    return pairs.map((pair) => {
      return plainToInstance(PairDto, {
        ...pair,
        father: petMap.get(pair.fatherId),
        mother: petMap.get(pair.motherId),
      });
    });
  }

  async getPairDetailById(
    pairId: number,
    userId: string,
  ): Promise<PairDetailDto | null> {
    const queryBuilder = this.pairRepository
      .createQueryBuilder('pairs')
      .where('pairs.id = :pairId AND pairs.ownerId = :userId', {
        pairId,
        userId,
      })
      .leftJoinAndMapMany(
        'matings',
        MatingEntity,
        'matings',
        'matings.pairId = pairs.id',
      )
      .leftJoinAndMapMany(
        'layings',
        LayingEntity,
        'layings',
        'layings.matingId = matings.id',
      )
      .select([
        'pairs.id as pairId',
        'pairs.fatherId as fatherId',
        'pairs.motherId as motherId',
        'matings.id as matingId',
        'matings.matingDate as matingDate',
        'layings.id as layingId',
        'layings.layingDate as layingDate',
        'layings.clutch as clutch',
      ]);

    const { raw } = await queryBuilder.getRawAndEntities<{
      pairId: number;
      fatherId: string;
      motherId: string;
      matingId: number;
      matingDate: Date;
      layingId: number;
      layingDate: Date;
      clutch: number;
    }>();

    if (!raw.length) {
      return null;
    }

    const nestedByPairMatingLaying = this.transformRawDataToNested(raw);
    const layingIds = Object.values(
      nestedByPairMatingLaying?.matings ?? {},
    ).flatMap((mating) => mating.layings?.map((laying) => laying.layingId));

    if (!compact(layingIds).length) {
      return nestedByPairMatingLaying;
    }

    // laying id에 해당하는 pet들을 조회
    const petQueryBuilder = this.dataSource
      .createQueryBuilder(PetEntity, 'pets')
      .where('pets.layingId IN (:...layingIds)', { layingIds })
      .andWhere('pets.isDeleted = false')
      .leftJoinAndMapOne(
        'pets.petDetail',
        'pet_details',
        'petDetail',
        'petDetail.petId = pets.petId',
      )
      .where(
        'pets.ownerId = :userId AND pets.type = :petType AND pets.isDeleted = :isDeleted',
        {
          userId,
          petType: PET_TYPE.PET,
          isDeleted: false,
        },
      )
      .select([
        'pets.petId',
        'pets.name',
        'pets.species',
        'pets.hatchingDate',
        'pets.clutchOrder',
        'pets.type',
        'petDetail.sex',
        'petDetail.morphs',
        'petDetail.traits',
        'petDetail.weight',
      ]);

    const eggQueryBuilder = this.dataSource
      .createQueryBuilder(PetEntity, 'pets')
      .where('pets.layingId IN (:...layingIds)', { layingIds })
      .andWhere('pets.isDeleted = false')
      .leftJoinAndMapOne(
        'pets.eggDetail',
        'egg_details',
        'eggDetail',
        'eggDetail.petId = pets.petId',
      )
      .where(
        'pets.ownerId = :userId AND pets.type = :petType AND pets.isDeleted = :isDeleted',
        {
          userId,
          petType: PET_TYPE.EGG,
          isDeleted: false,
        },
      )
      .select([
        'pets',
        'pets.petId',
        'pets.name',
        'pets.species',
        'pets.hatchingDate',
        'pets.clutchOrder',
        'pets.type',
        'eggDetail.temperature',
        'eggDetail.status',
      ]);

    const [petEntities, eggEntities] = await Promise.all([
      petQueryBuilder.getMany(),
      eggQueryBuilder.getMany(),
    ]);

    const petsByLayingId = new Map<number, PetLayingDto[]>();
    [...petEntities, ...eggEntities].forEach((pet) => {
      if (pet.layingId) {
        const existing = petsByLayingId.get(pet.layingId) || [];
        existing.push({
          petId: pet.petId,
          species: pet.species,
          type: pet.type,
          ...omitBy(
            {
              name: pet.name ?? undefined,
              hatchingDate: pet.hatchingDate ?? undefined,
              clutchOrder: pet.clutchOrder ?? undefined,
              sex: pet.petDetail?.sex ?? undefined,
              morphs: pet.petDetail?.morphs ?? undefined,
              traits: pet.petDetail?.traits ?? undefined,
              weight: pet.petDetail?.weight ?? undefined,
              temperature: pet.eggDetail?.temperature ?? undefined,
              eggStatus: pet.eggDetail?.status ?? undefined,
            },
            isNil,
          ),
        });
        petsByLayingId.set(pet.layingId, existing);
      }
    });

    const { matings, ...pairInfos } = nestedByPairMatingLaying;
    const matingsWithPets = matings?.map((mating) => {
      return {
        ...mating,
        layings: mating.layings?.map((laying) => {
          return {
            ...laying,
            pets: petsByLayingId.get(laying.layingId) ?? [],
          };
        }),
      };
    });

    return {
      ...pairInfos,
      matings: matingsWithPets,
    };
  }

  private transformRawDataToNested(
    raw: {
      pairId: number;
      fatherId: string;
      motherId: string;
      matingId: number;
      matingDate: Date;
      layingId: number;
      layingDate: Date;
      clutch: number;
    }[],
  ) {
    const pairId = raw[0].pairId;
    const fatherId = raw[0].fatherId;
    const motherId = raw[0].motherId;

    const matingsMap = new Map<
      number,
      {
        matingId: number;
        matingDate: string;
        layings?: {
          layingId: number;
          layingDate: string;
          clutch: number;
        }[];
      }
    >();

    for (const row of raw) {
      const { matingId, matingDate, layingId, layingDate, clutch } = row;

      if (!matingId) continue;

      if (!matingsMap.has(matingId)) {
        matingsMap.set(matingId, {
          matingId,
          matingDate: format(matingDate, 'yyyy-MM-dd'),
        });
      }

      if (layingId) {
        const layings = matingsMap.get(matingId)?.layings ?? [];

        layings.push({
          layingId,
          layingDate: format(layingDate, 'yyyy-MM-dd'),
          clutch,
        });

        matingsMap.set(matingId, {
          matingId,
          matingDate: format(matingDate, 'yyyy-MM-dd'),
          layings,
        });
      }
    }

    return {
      pairId,
      fatherId,
      motherId,
      matings:
        matingsMap.size > 0 ? Array.from(matingsMap.values()) : undefined,
    };
  }
}
