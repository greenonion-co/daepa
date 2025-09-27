import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateMatingDto,
  MatingByParentsDto,
  MatingFilterDto,
} from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  DataSource,
  FindOptionsWhere,
  Raw,
} from 'typeorm';
import { PetSummaryLayingDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';
import { groupBy, isNil, omitBy } from 'es-toolkit';
import { PET_SEX } from 'src/pet/pet.constants';
import { LayingEntity } from 'src/laying/laying.entity';
import { UpdateMatingDto } from './mating.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { Not } from 'typeorm';

interface MatingsWithPair {
  id: number;
  matingDate?: Date;
  pair: {
    id: number;
    fatherId: string;
    motherId: string;
  };
}

interface LayingLite {
  id: number;
  matingId: number;
  layingDate: Date;
  clutch?: number;
}

interface MatingRelationsCombined {
  id: number;
  matingDate?: Date;
  pair: {
    id: number;
    fatherId: string;
    motherId: string;
  };
  layings?: LayingLite[];
  parents?: PetSummaryLayingDto[];
  children?: PetSummaryLayingDto[];
}

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMatingListFull(
    pageOptionsDto: MatingFilterDto,
    userId: string,
  ): Promise<PageDto<MatingByParentsDto>> {
    // 1) matings + pair: 필터/정렬/페이징
    const baseQb = this.dataSource
      .createQueryBuilder(MatingEntity, 'matings')
      .innerJoinAndMapOne(
        'matings.pair',
        PairEntity,
        'pairs',
        'pairs.id = matings.pairId',
      )
      .select([
        'matings.id',
        'matings.matingDate',
        'matings.pairId',
        'pairs.id',
        'pairs.species',
        'pairs.fatherId',
        'pairs.motherId',
        'pairs.ownerId',
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

    const order = (pageOptionsDto.order ?? 'DESC') as 'ASC' | 'DESC';
    baseQb.orderBy('matings.id', order);

    const matingsEntities = await baseQb
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage)
      .getMany();

    if (!matingsEntities.length) {
      const pageMetaDto = new PageMetaDto({
        totalCount: 0,
        pageOptionsDto,
      });
      return new PageDto([], pageMetaDto);
    }

    const matingsWithPair: MatingsWithPair[] = matingsEntities.map(
      (mating) => ({
        id: mating.id,
        matingDate: mating.matingDate ?? undefined,
        pair: {
          id: mating.pair.id,
          fatherId: mating.pair.fatherId,
          motherId: mating.pair.motherId,
        },
      }),
    );
    const matingIds = matingsWithPair.map((mating) => mating.id);

    // 2) layings: matingIds로 배치 조회
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

    const layingsForMating: LayingLite[] = layingsEntities.map((laying) => ({
      id: laying.id,
      matingId: laying.matingId ?? -1,
      layingDate: laying.layingDate,
      clutch: laying.clutch,
    }));
    const layingIds = layingsForMating.map((l) => l.id);

    // 3) children(+details): layingIds로 배치 조회, eggStatus 필터는 여기서
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
      childrenDtos = childrenEntities.map((c) => ({
        petId: c.petId,
        species: c.species,
        ...omitBy(
          {
            name: c.name ?? undefined,
            hatchingDate: c.hatchingDate ?? undefined,
            sex: c.petDetail?.sex ?? undefined,
            morphs: c.petDetail?.morphs ?? undefined,
            traits: c.petDetail?.traits ?? undefined,
            clutchOrder: c.clutchOrder ?? undefined,
            temperature: c.eggDetail?.temperature ?? undefined,
            eggStatus: c.eggDetail?.status ?? undefined,
            layingId: c.layingId ?? undefined,
          },
          isNil,
        ),
      }));
    }

    // parents(+detail): fatherId/motherId로 배치 조회
    const parentPetIds = Array.from(
      new Set(
        matingsWithPair
          .flatMap((m) => [m.pair?.fatherId, m.pair?.motherId])
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
        .where('p.petId IN (:...parentPetIds)', { parentPetIds })
        .select([
          'p.petId',
          'p.name',
          'p.species',
          'p.hatchingDate',
          'pd.sex',
          'pd.morphs',
          'pd.traits',
          'pd.weight',
        ])
        .getMany();

      parentDtos = parentEntities.map((p) => ({
        petId: p.petId,
        species: p.species,
        ...omitBy(
          {
            name: p.name ?? undefined,
            hatchingDate: p.hatchingDate ?? undefined,
            sex: p.petDetail?.sex ?? undefined,
            morphs: p.petDetail?.morphs ?? undefined,
            traits: p.petDetail?.traits ?? undefined,
            weight: p.petDetail?.weight ?? undefined,
          },
          isNil,
        ),
      }));
    }

    // 메모리 조립
    const layingsByMatingIdMap = new Map<number, LayingLite[]>();
    for (const laying of layingsForMating) {
      const arr = layingsByMatingIdMap.get(laying.matingId ?? -1) || [];
      arr.push(laying);
      layingsByMatingIdMap.set(laying.matingId ?? -1, arr);
    }

    const childrenByLayingIdMap = new Map<number, PetSummaryLayingDto[]>();
    for (const child of childrenDtos) {
      if (child.layingId == null) continue;
      const arr = childrenByLayingIdMap.get(child.layingId) || [];
      arr.push(child);
      childrenByLayingIdMap.set(child.layingId, arr);
    }

    const parentsByPetIdMap = new Map<string, PetSummaryLayingDto>();
    for (const parent of parentDtos) {
      parentsByPetIdMap.set(parent.petId, parent);
    }

    const combinedFromMaps: MatingRelationsCombined[] = matingsWithPair.map(
      (mating) => {
        const layings = layingsByMatingIdMap.get(mating.id) || [];

        const children: PetSummaryLayingDto[] = [];
        for (const laying of layings) {
          const childrenForLaying = childrenByLayingIdMap.get(laying.id) || [];
          children.push(...childrenForLaying);
        }

        const parents: PetSummaryLayingDto[] = [];
        const father = parentsByPetIdMap.get(mating.pair.fatherId);
        const mother = parentsByPetIdMap.get(mating.pair.motherId);
        if (father) {
          parents.push(father);
        }
        if (mother) {
          parents.push(mother);
        }

        return {
          ...mating,
          layings,
          children,
          parents,
        };
      },
    );

    const result = this.formatResponseByDate(combinedFromMaps);
    const pageMetaDto = new PageMetaDto({
      totalCount: result.length,
      pageOptionsDto,
    });
    return new PageDto(result, pageMetaDto);
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      if (!createMatingDto.fatherId && !createMatingDto.motherId) {
        throw new BadRequestException('최소 하나의 부모 펫을 입력해야 합니다.');
      }

      // 페어가 존재하는지 확인하거나 생성
      let pair = await entityManager.findOne(PairEntity, {
        where: {
          ownerId: userId,
          fatherId: createMatingDto.fatherId,
          motherId: createMatingDto.motherId,
        },
      });

      if (!pair) {
        pair = entityManager.create(PairEntity, {
          ownerId: userId,
          fatherId: createMatingDto.fatherId,
          motherId: createMatingDto.motherId,
          species: createMatingDto.species,
        });
        pair = await entityManager.save(PairEntity, pair);
      }

      // 동일한 페어의 동일한 날짜에 메이팅이 있는지 확인
      const date = new Date(createMatingDto.matingDate);
      const ymd = date.toISOString().slice(0, 10);

      const existingMating = await entityManager.existsBy(MatingEntity, {
        pairId: pair.id,
        matingDate: Raw((alias) => `DATE(${alias}) = :d`, { d: ymd }),
      });

      if (existingMating) {
        throw new BadRequestException('이미 존재하는 메이팅 정보입니다.');
      }

      const matingEntity = entityManager.create(MatingEntity, {
        pairId: pair.id,
        matingDate: ymd,
      });
      await entityManager.save(MatingEntity, matingEntity);
    });
  }

  async updateMating(
    userId: string,
    matingId: number,
    updateMatingDto: UpdateMatingDto,
  ) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const mating = await entityManager.existsBy(MatingEntity, {
        id: matingId,
      });

      if (!mating) {
        throw new BadRequestException('메이팅 정보를 찾을 수 없습니다.');
      }

      // 페어 정보 업데이트 또는 새 페어 생성
      let pair = await entityManager.findOne(PairEntity, {
        where: {
          ownerId: userId,
          fatherId: updateMatingDto.fatherId,
          motherId: updateMatingDto.motherId,
        },
        select: ['id'],
      });

      if (!pair) {
        pair = entityManager.create(PairEntity, {
          ownerId: userId,
          fatherId: updateMatingDto.fatherId,
          motherId: updateMatingDto.motherId,
        });
        pair = await entityManager.save(PairEntity, pair);
      }

      const date = new Date(updateMatingDto.matingDate);
      const ymd = date.toISOString().slice(0, 10);

      // 중복 체크 (자신을 제외하고)
      const existingMating = await entityManager.existsBy(MatingEntity, {
        pairId: pair.id,
        matingDate: Raw((alias) => `DATE(${alias}) = :d`, { d: ymd }),
        id: Not(matingId),
      });

      if (existingMating) {
        throw new BadRequestException('이미 존재하는 메이팅 정보입니다.');
      }

      await entityManager.update(
        MatingEntity,
        { id: matingId },
        {
          pairId: pair.id,
          matingDate: updateMatingDto.matingDate,
        },
      );
    });
  }

  async deleteMating(matingId: number) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      try {
        const mating = await entityManager.findOne(MatingEntity, {
          where: { id: matingId },
          select: ['id'],
        });

        if (!mating) {
          throw new BadRequestException('메이팅 정보를 찾을 수 없습니다.');
        }

        // 연관된 산란 정보가 있는지 확인 (exists 사용으로 성능 향상)
        const hasRelatedLayings = await entityManager.existsBy(LayingEntity, {
          matingId: mating.id,
        });

        if (hasRelatedLayings) {
          throw new BadRequestException(
            '연관된 산란 정보가 있어 삭제할 수 없습니다.',
          );
        }

        await entityManager.delete(MatingEntity, { id: matingId });
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        throw new BadRequestException('메이팅 삭제 중 오류가 발생했습니다.');
      }
    });
  }

  private formatResponseByDate(data: MatingRelationsCombined[]) {
    const groupedByParents = groupBy(data, (mating) => {
      const fatherId = mating.pair?.fatherId ?? null;
      const motherId = mating.pair?.motherId ?? null;
      // 부모 중 null 값이 있는 경우 각각 다른 그룹으로 처리
      if (fatherId === null || motherId === null) {
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
          const { id, matingDate, layings, children } = mating;

          const layingsByDate = this.groupLayingsByDate(layings, children);
          return {
            id,
            matingDate,
            layingsByDate,
          };
        })
        .sort((a, b) => {
          const aHasMatingDate = !!a.matingDate;
          const bHasMatingDate = !!b.matingDate;
          if (aHasMatingDate !== bHasMatingDate) return aHasMatingDate ? -1 : 1; // 날짜 있는 항목이 먼저
          if (aHasMatingDate && bHasMatingDate) {
            return (
              new Date(b.matingDate!).getTime() -
              new Date(a.matingDate!).getTime()
            ); // 둘 다 날짜 있음 → 날짜 내림차순
          }
          return b.id - a.id; // 둘 다 날짜 없음 → id 내림차순
        });

      return {
        father,
        mother,
        matingsByDate,
      };
    });
  }

  private groupLayingsByDate(
    layings: LayingLite[] | undefined,
    children: PetSummaryLayingDto[] | undefined,
  ) {
    if (!layings?.length) return;

    const grouped = groupBy(layings, (laying) => laying.layingDate.toString());

    return Object.entries(grouped).map(([layingDate, layingsForDate]) => {
      // 해당 layingDate의 펫들을 필터링
      const petsForDate =
        children
          ?.filter((child) => {
            // child의 layingId가 현재 laying의 id와 일치하는지 확인
            return layingsForDate.some(
              (laying) => laying.id === child.layingId,
            );
          })
          .map((child) => {
            // layingsForDate의 clutch 정보를 모든 펫에 추가
            const clutch = layingsForDate[0]?.clutch;
            return {
              ...child,
              clutch,
            };
          }) || [];

      return {
        layingDate,
        layingId: layingsForDate[0]?.id,
        layings: petsForDate,
      };
    });
  }

  async isMatingExist(criteria: FindOptionsWhere<MatingEntity>) {
    const isExist = await this.matingRepository.existsBy(criteria);
    return isExist;
  }
}
