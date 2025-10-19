import { Injectable } from '@nestjs/common';
import { PET_SPECIES, PET_TYPE } from 'src/pet/pet.constants';
import { DataSource, Repository } from 'typeorm';
import { PairEntity } from './pair.entity';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { isNil, omitBy, uniq } from 'es-toolkit';
import { plainToInstance } from 'class-transformer';
import { PairDto } from './pair.dto';
import { MatingEntity } from 'src/mating/mating.entity';
import { LayingEntity } from 'src/laying/laying.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PetSummaryLayingDto } from 'src/pet/pet.dto';

@Injectable()
export class PairService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
  ) {}

  async getPairList(userId: string, species: PET_SPECIES) {
    // 1. 페어 기본 정보 조회
    const pairs = await this.dataSource
      .createQueryBuilder(PairEntity, 'pairs')
      .where('pairs.ownerId = :userId AND pairs.species = :species', {
        userId,
        species,
      })
      .getMany();

    if (pairs.length === 0) return [];

    // 2. 펫 ID 수집 (중복 제거)
    const parentsPetIds = uniq(pairs.flatMap((p) => [p.fatherId, p.motherId]));

    // 3. 펫 정보 일괄 조회
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

    // 4. 메모리에서 조립
    const petMap = new Map(pets.map((pet) => [pet.petId, pet]));

    return pairs.map((pair) => {
      return plainToInstance(PairDto, {
        ...pair,
        father: petMap.get(pair.fatherId),
        mother: petMap.get(pair.motherId),
      });
    });
  }

  async getPairById(pairId: string, userId: string) {
    const queryBuilder = this.pairRepository
      .createQueryBuilder('pairs')
      .where('pairs.id = :pairId AND pairs.ownerId = :userId', {
        pairId,
        userId,
      })
      .innerJoinAndMapMany(
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
    const layingIds = nestedByPairMatingLaying.flatMap((pair) =>
      pair.matings?.flatMap((mating) =>
        mating.layings?.map((laying) => laying.layingId),
      ),
    );
    if (!layingIds.length) {
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

    // pet들을 layingId별로 그룹화
    const petsByLayingId = new Map<number, PetSummaryLayingDto[]>();
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

    // nestedByPairMatingLaying에 pet 정보 추가
    nestedByPairMatingLaying.forEach((pair) => {
      pair.matings?.forEach((mating) => {
        mating.layings?.forEach((laying) => {
          laying.pets = petsByLayingId.get(laying.layingId) ?? [];
        });
      });
    });

    return nestedByPairMatingLaying;
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
    const pairMap = new Map<
      number,
      {
        pairId: number;
        fatherId: string;
        motherId: string;
        matings?: Map<
          number,
          {
            matingId: number;
            matingDate: Date;
            layings?: {
              layingId: number;
              layingDate: Date;
              clutch: number;
              pets?: PetSummaryLayingDto[];
            }[];
          }
        >;
      }
    >();

    for (const row of raw) {
      const {
        pairId,
        fatherId,
        motherId,
        matingId,
        matingDate,
        layingId,
        layingDate,
        clutch,
      } = row;

      // Pair 레벨 처리
      if (!pairMap.has(pairId)) {
        pairMap.set(pairId, {
          pairId,
          fatherId,
          motherId,
          matings: new Map(),
        });
      }

      const pair = pairMap.get(pairId);
      if (!pair) continue;

      // Mating 레벨 처리
      if (matingId && !pair.matings?.has(matingId)) {
        pair.matings?.set(matingId, {
          matingId,
          matingDate,
          layings: [],
        });
      }

      // Laying 레벨 처리
      if (layingId && matingId) {
        const mating = pair.matings?.get(matingId);
        if (mating && !mating.layings?.some((l) => l.layingId === layingId)) {
          mating.layings?.push({
            layingId,
            layingDate,
            clutch,
          });
        }
      }
    }

    // Map을 배열로 변환
    return Array.from(pairMap.values()).map((pair) => ({
      pairId: pair.pairId,
      fatherId: pair.fatherId,
      motherId: pair.motherId,
      matings: Array.from(pair.matings?.values() ?? []),
    }));
  }
}
