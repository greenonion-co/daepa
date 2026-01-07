import { BadRequestException, Injectable } from '@nestjs/common';
import { PET_TYPE } from 'src/pet/pet.constants';
import { DataSource, Repository } from 'typeorm';
import { PairEntity } from './pair.entity';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { compact, isNil, omitBy } from 'es-toolkit';
import { plainToInstance } from 'class-transformer';
import {
  MatingByParentsDto,
  PairDetailDto,
  PairFilterDto,
  UpdatePairDto,
} from './pair.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { MatingEntity } from 'src/mating/mating.entity';
import { LayingEntity } from 'src/laying/laying.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PetLayingDto, PetSummaryLayingDto } from 'src/pet/pet.dto';
import { format } from 'date-fns';
import { PetImageEntity } from 'src/pet_image/pet_image.entity';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';

interface PairWithMating {
  pairId: number;
  fatherId: string;
  motherId: string;
  desc?: string;
}

interface LayingLite {
  id: number;
  matingId: number;
  layingDate: Date;
  clutch?: number;
}

@Injectable()
export class PairService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
  ) {}

  async getPairList(
    pageOptionsDto: PairFilterDto,
    userId: string,
  ): Promise<PageDto<MatingByParentsDto>> {
    // 1) pairs + matings: 필터/정렬/페이징
    const baseQb = this.dataSource
      .createQueryBuilder(PairEntity, 'pairs')
      .innerJoinAndMapMany(
        'pairs.matings',
        MatingEntity,
        'matings',
        'matings.pairId = pairs.id',
      )
      .select([
        'pairs.id',
        'pairs.species',
        'pairs.fatherId',
        'pairs.motherId',
        'pairs.ownerId',
        'pairs.desc',
        'matings.id',
        'matings.matingDate',
        'matings.pairId',
      ])
      .where('pairs.ownerId = :userId', { userId });

    if (pageOptionsDto.species) {
      baseQb.andWhere('pairs.species = :species', {
        species: pageOptionsDto.species,
      });
    }
    if (pageOptionsDto.startYmd) {
      baseQb.andWhere('matings.matingDate >= :startYmd', {
        startYmd: pageOptionsDto.startYmd,
      });
    }
    if (pageOptionsDto.endYmd) {
      baseQb.andWhere('matings.matingDate <= :endYmd', {
        endYmd: pageOptionsDto.endYmd,
      });
    }
    if (pageOptionsDto.fatherId) {
      baseQb.andWhere('pairs.fatherId = :fatherId', {
        fatherId: pageOptionsDto.fatherId,
      });
    }
    if (pageOptionsDto.motherId) {
      baseQb.andWhere('pairs.motherId = :motherId', {
        motherId: pageOptionsDto.motherId,
      });
    }

    const order = pageOptionsDto.order;
    baseQb.orderBy('pairs.id', order);

    // count 쿼리와 데이터 쿼리를 병렬로 실행
    const countQb = this.dataSource
      .createQueryBuilder(PairEntity, 'pairs')
      .innerJoin(MatingEntity, 'matings', 'matings.pairId = pairs.id')
      .where('pairs.ownerId = :userId', { userId })
      .andWhere(pageOptionsDto.species ? 'pairs.species = :species' : '1=1', {
        species: pageOptionsDto.species,
      })
      .andWhere(
        pageOptionsDto.startYmd ? 'matings.matingDate >= :startYmd' : '1=1',
        { startYmd: pageOptionsDto.startYmd },
      )
      .andWhere(
        pageOptionsDto.endYmd ? 'matings.matingDate <= :endYmd' : '1=1',
        { endYmd: pageOptionsDto.endYmd },
      )
      .andWhere(
        pageOptionsDto.fatherId ? 'pairs.fatherId = :fatherId' : '1=1',
        { fatherId: pageOptionsDto.fatherId },
      )
      .andWhere(
        pageOptionsDto.motherId ? 'pairs.motherId = :motherId' : '1=1',
        { motherId: pageOptionsDto.motherId },
      )
      .select('COUNT(DISTINCT pairs.id)', 'count');

    const [countResult, pairsEntities] = await Promise.all([
      countQb.getRawOne<{ count: string }>(),
      baseQb
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.itemPerPage)
        .getMany(),
    ]);

    const totalPairCount = parseInt(countResult?.count ?? '0', 10);

    if (totalPairCount === 0 || !pairsEntities.length) {
      const pageMetaDto = new PageMetaDto({
        totalCount: 0,
        pageOptionsDto,
      });
      return new PageDto([], pageMetaDto);
    }

    const pairsWithMating: PairWithMating[] = pairsEntities.map((pair) => ({
      pairId: pair.id,
      fatherId: pair.fatherId,
      motherId: pair.motherId,
      desc: pair.desc ?? undefined,
    }));
    const pairIds = pairsWithMating.map((p) => p.pairId);

    // matings 조회
    const matingsEntities = await this.dataSource
      .createQueryBuilder(MatingEntity, 'matings')
      .where('matings.pairId IN (:...pairIds)', { pairIds })
      .getMany();
    const matingIds = matingsEntities.map((m) => m.id);

    // 2) layings: matingIds로 배치 조회
    let layingsForMating: LayingLite[] = [];
    if (matingIds.length) {
      const layingsEntities = await this.dataSource
        .createQueryBuilder(LayingEntity, 'layings')
        .where('layings.matingId IN (:...matingIds)', { matingIds })
        .select([
          'layings.id',
          'layings.matingId',
          'layings.layingDate',
          'layings.clutch',
        ])
        .getMany();

      layingsForMating = layingsEntities.map((laying) => ({
        id: laying.id,
        matingId: laying.matingId ?? -1,
        layingDate: laying.layingDate,
        clutch: laying.clutch,
      }));
    }
    const layingIds = layingsForMating.map((l) => l.id);

    // 3) children(+details): layingIds로 배치 조회, eggStatus 필터
    let childrenDtos: PetSummaryLayingDto[] = [];
    if (layingIds.length) {
      const childrenQb = this.dataSource
        .createQueryBuilder(PetEntity, 'c')
        .leftJoinAndMapOne(
          'c.petDetail',
          PetDetailEntity,
          'cd',
          'cd.petId = c.petId',
        )
        .leftJoinAndMapOne(
          'c.eggDetail',
          EggDetailEntity,
          'ced',
          'ced.petId = c.petId',
        )
        .where('c.layingId IN (:...layingIds)', { layingIds })
        .andWhere('c.isDeleted = false')
        .select([
          'c.petId',
          'c.name',
          'c.species',
          'c.hatchingDate',
          'c.clutchOrder',
          'c.layingId',
          'cd.sex',
          'cd.morphs',
          'cd.traits',
          'ced.temperature',
          'ced.status',
        ]);
      if (pageOptionsDto.eggStatus) {
        childrenQb.andWhere('ced.status = :eggStatus', {
          eggStatus: pageOptionsDto.eggStatus,
        });
      }
      const childrenEntities = await childrenQb.getMany();
      childrenDtos = childrenEntities.map((c) =>
        plainToInstance(PetSummaryLayingDto, {
          petId: c.petId,
          species: c.species,
          name: c.name ?? undefined,
          hatchingDate: c.hatchingDate ?? undefined,
          sex: c.petDetail?.sex ?? undefined,
          morphs: c.petDetail?.morphs ?? undefined,
          traits: c.petDetail?.traits ?? undefined,
          clutchOrder: c.clutchOrder ?? undefined,
          temperature: c.eggDetail?.temperature ?? undefined,
          eggStatus: c.eggDetail?.status ?? undefined,
          layingId: c.layingId ?? undefined,
        }),
      );
    }

    // 4) parents(+detail): fatherId/motherId로 배치 조회
    const parentPetIds = Array.from(
      new Set(
        pairsWithMating
          .flatMap((p) => [p.fatherId, p.motherId])
          .filter(Boolean),
      ),
    );
    let parentDtos: PetSummaryLayingDto[] = [];
    if (parentPetIds.length) {
      const parentEntities = await this.dataSource
        .createQueryBuilder(PetEntity, 'p')
        .leftJoinAndMapOne(
          'p.petDetail',
          PetDetailEntity,
          'pd',
          'pd.petId = p.petId',
        )
        .leftJoinAndMapOne(
          'p.petImages',
          PetImageEntity,
          'pi',
          'pi.petId = p.petId',
        )
        .where('p.petId IN (:...parentPetIds)', { parentPetIds })
        .select([
          'p.petId',
          'p.name',
          'p.species',
          'p.hatchingDate',
          'p.isDeleted',
          'pd.sex',
          'pd.morphs',
          'pd.traits',
          'pd.weight',
          'pd.growth',
          'pi.files',
        ])
        .getMany();

      parentDtos = parentEntities.map((p) =>
        plainToInstance(PetSummaryLayingDto, {
          petId: p.petId,
          species: p.species,
          name: p.name ?? undefined,
          hatchingDate: p.hatchingDate ?? undefined,
          isDeleted: p.isDeleted,
          sex: p.petDetail?.sex ?? undefined,
          morphs: p.petDetail?.morphs ?? undefined,
          traits: p.petDetail?.traits ?? undefined,
          weight: p.petDetail?.weight ?? undefined,
        }),
      );
    }

    // 5) 메모리 조립 (Map 기반)
    const parentsByPetIdMap = new Map<string, PetSummaryLayingDto>();
    for (const parent of parentDtos) {
      parentsByPetIdMap.set(parent.petId, parent);
    }

    const childrenByLayingIdMap = new Map<number, PetSummaryLayingDto[]>();
    for (const child of childrenDtos) {
      if (child.layingId) {
        const existing = childrenByLayingIdMap.get(child.layingId) ?? [];
        existing.push(child);
        childrenByLayingIdMap.set(child.layingId, existing);
      }
    }

    // matings를 pairId별로 그룹화
    const matingsByPairIdMap = new Map<number, MatingEntity[]>();
    for (const mating of matingsEntities) {
      const existing = matingsByPairIdMap.get(mating.pairId) ?? [];
      existing.push(mating);
      matingsByPairIdMap.set(mating.pairId, existing);
    }

    // layings를 matingId별로 그룹화
    const layingsByMatingIdMap = new Map<number, LayingLite[]>();
    for (const laying of layingsForMating) {
      const existing = layingsByMatingIdMap.get(laying.matingId) ?? [];
      existing.push(laying);
      layingsByMatingIdMap.set(laying.matingId, existing);
    }

    // 6) 최종 조립 및 포맷팅
    const data = pairsWithMating.map((pair) => {
      const father = parentsByPetIdMap.get(pair.fatherId);
      const mother = parentsByPetIdMap.get(pair.motherId);
      const pairMatings = matingsByPairIdMap.get(pair.pairId) ?? [];

      const matingsByDate = pairMatings
        .map((mating) => {
          const matingLayings = layingsByMatingIdMap.get(mating.id) ?? [];

          // layingDate별로 그룹화 (getMatingListFull의 groupLayingsByDate 로직)
          const layingsByDate = this.groupLayingsByDate(
            matingLayings,
            childrenByLayingIdMap,
          );

          return {
            id: mating.id,
            matingDate: mating.matingDate,
            layingsByDate,
          };
        })
        .sort((a, b) => {
          const aHasMatingDate = !!a.matingDate;
          const bHasMatingDate = !!b.matingDate;
          if (aHasMatingDate !== bHasMatingDate) return aHasMatingDate ? -1 : 1;
          if (aHasMatingDate && bHasMatingDate) {
            return (
              new Date(b.matingDate!).getTime() -
              new Date(a.matingDate!).getTime()
            );
          }
          return b.id - a.id;
        });

      return plainToInstance(MatingByParentsDto, {
        pairId: pair.pairId,
        father,
        mother,
        matingsByDate,
        desc: pair.desc,
      });
    });

    const pageMetaDto = new PageMetaDto({
      totalCount: totalPairCount,
      pageOptionsDto,
    });
    return new PageDto(data, pageMetaDto);
  }

  private groupLayingsByDate(
    layings: LayingLite[],
    childrenByLayingIdMap: Map<number, PetSummaryLayingDto[]>,
  ) {
    if (!layings.length) return undefined;

    // layingDate별로 그룹화
    const grouped = new Map<string, LayingLite[]>();
    for (const laying of layings) {
      const dateKey = format(laying.layingDate, 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) ?? [];
      existing.push(laying);
      grouped.set(dateKey, existing);
    }

    return Array.from(grouped.entries()).map(([layingDate, layingsForDate]) => {
      // 해당 layingDate의 펫들을 필터링하고 clutch 정보 추가
      const petsForDate = layingsForDate.flatMap((laying) => {
        const children = childrenByLayingIdMap.get(laying.id) ?? [];
        return children.map((child) => ({
          ...child,
          clutch: laying.clutch,
        }));
      });

      return {
        layingDate,
        layingId: layingsForDate[0]?.id,
        layings: petsForDate,
      };
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

  async updatePair(
    userId: string,
    pairId: number,
    updatePairDto: UpdatePairDto,
  ) {
    // 페어 존재 여부 및 소유권 확인
    const pair = await this.pairRepository.findOne({
      where: {
        id: pairId,
        ownerId: userId,
      },
    });

    if (!pair) {
      throw new BadRequestException('페어 정보를 찾을 수 없습니다.');
    }

    // desc 업데이트
    await this.pairRepository.update(
      { id: pairId },
      {
        desc: updatePairDto.desc,
      },
    );
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
