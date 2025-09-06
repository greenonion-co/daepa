import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateMatingDto,
  MatingByParentsDto,
  MatingDto,
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
import { plainToInstance } from 'class-transformer';
import { PetSummaryWithLayingDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';
import { groupBy } from 'es-toolkit';
import { PET_GROWTH, PET_SEX } from 'src/pet/pet.constants';
import { LayingEntity } from 'src/laying/laying.entity';
import { LayingDto } from 'src/laying/laying.dto';
import { UpdateMatingDto } from './mating.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { Not } from 'typeorm';
import { EGG_STATUS } from 'src/egg_detail/egg_detail.constants';

interface PetWithRelations extends PetEntity {
  eggDetail?: EggDetailEntity;
  petDetail?: PetDetailEntity;
}

interface MatingWithRelations extends Omit<MatingEntity, 'pair'> {
  layings?: Partial<LayingEntity>[];
  pair?: Partial<PairEntity>;
  parents?: PetWithRelations[];
  children?: PetWithRelations[];
}

type MergedPet = Partial<PetEntity> & {
  temperature?: number;
  eggStatus?: EGG_STATUS;
  morphs?: string[];
  traits?: string[];
  sex?: PET_SEX;
  weight?: number;
};

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMatingListFull(
    pageOptionsDto: MatingFilterDto,
    userId: string,
  ): Promise<PageDto<MatingByParentsDto>> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 모든 메이팅 데이터를 가져와서 가공
      const allQueryBuilder = entityManager
        .createQueryBuilder(MatingEntity, 'matings')
        .leftJoinAndMapMany(
          'matings.layings',
          LayingEntity,
          'layings',
          'layings.matingId = matings.id',
        )
        .leftJoinAndMapOne(
          'matings.pair',
          PairEntity,
          'pairs',
          'pairs.id = matings.pairId',
        )
        .leftJoinAndMapMany(
          'matings.parents',
          PetEntity,
          'parents',
          'parents.petId IN (pairs.fatherId, pairs.motherId)',
        )
        .leftJoinAndMapOne(
          'parents.petDetail',
          PetDetailEntity,
          'ppd',
          'ppd.petId = parents.petId',
        )
        .leftJoinAndMapMany(
          'matings.children',
          PetEntity,
          'children',
          'children.layingId IN (SELECT layings.id FROM layings WHERE layings.matingId = matings.id) AND children.isDeleted = false',
        )
        .leftJoinAndMapOne(
          'children.petDetail',
          PetDetailEntity,
          'cpd',
          'cpd.petId = children.petId',
        )
        .leftJoinAndMapOne(
          'children.eggDetail',
          EggDetailEntity,
          'ced',
          'ced.petId = children.petId',
        )
        .select([
          'matings.id',
          'matings.matingDate',
          'matings.pairId',
          'matings.createdAt',
          'layings.id',
          'layings.layingDate',
          'layings.clutch',
          'pairs.id',
          'pairs.species',
          'pairs.fatherId',
          'pairs.motherId',
          'pairs.ownerId',
          'parents.petId',
          'parents.name',
          'parents.species',
          'parents.hatchingDate',
          'parents.growth',
          'ppd.morphs',
          'ppd.sex',
          'ppd.weight',
          'children.petId',
          'children.name',
          'children.species',
          'children.hatchingDate',
          'children.growth',
          'children.clutchOrder',
          'children.layingId',
          'cpd.sex',
          'cpd.morphs',
          'cpd.traits',
          'ced.temperature',
          'ced.status',
        ])
        .where('pairs.ownerId = :userId', { userId })
        .orderBy('matings.id', pageOptionsDto.order);

      if (pageOptionsDto.species) {
        allQueryBuilder.andWhere('pairs.species = :species', {
          species: pageOptionsDto.species,
        });
      }

      if (pageOptionsDto.startYmd) {
        allQueryBuilder.andWhere('matings.matingDate >= :startYmd', {
          startYmd: pageOptionsDto.startYmd,
        });
      }

      if (pageOptionsDto.endYmd) {
        allQueryBuilder.andWhere('matings.matingDate <= :endYmd', {
          endYmd: pageOptionsDto.endYmd,
        });
      }

      if (pageOptionsDto.fatherId) {
        allQueryBuilder.andWhere('pairs.fatherId = :fatherId', {
          fatherId: pageOptionsDto.fatherId,
        });
      }

      if (pageOptionsDto.motherId) {
        allQueryBuilder.andWhere('pairs.motherId = :motherId', {
          motherId: pageOptionsDto.motherId,
        });
      }

      if (pageOptionsDto.eggStatus) {
        allQueryBuilder.andWhere('ced.status = :eggStatus', {
          eggStatus: pageOptionsDto.eggStatus,
        });
      }

      const { entities } = await allQueryBuilder.getRawAndEntities();

      // 가공된 데이터 생성
      const allMatingList = this.formatResponseByDate(entities);

      // 가공 후 데이터로 페이지네이션 적용
      const totalCount = allMatingList.length;
      const startIndex = pageOptionsDto.skip;
      const endIndex = startIndex + pageOptionsDto.itemPerPage;
      const paginatedMatingList = allMatingList.slice(startIndex, endIndex);

      const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
      return new PageDto(paginatedMatingList, pageMetaDto);
    });
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

  private formatResponseByDate(data: MatingWithRelations[]) {
    const resultDto = data.map((mating) => {
      const matingDto = plainToInstance(MatingDto, {
        id: mating.id,
        matingDate: mating.matingDate,
        fatherId: mating.pair?.fatherId,
        motherId: mating.pair?.motherId,
      });
      const layingDto = mating.layings?.map((laying) =>
        plainToInstance(LayingDto, laying),
      );

      const parentsDto = mating.parents?.map((parent) => {
        const merged = this.mergePetWithDetail(parent);
        return plainToInstance(PetSummaryWithLayingDto, merged);
      });
      const childrenDto = mating.children?.map((child) => {
        const merged = this.mergePetWithDetail(child);
        return plainToInstance(PetSummaryWithLayingDto, merged);
      });

      return {
        ...matingDto,
        layings: layingDto,
        parents: parentsDto,
        children: childrenDto,
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
          const { id, matingDate, layings, children } = mating;

          const layingsByDate = this.groupLayingsByDate(layings, children);
          return {
            id,
            matingDate,
            layingsByDate,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime(),
        );

      return {
        father,
        mother,
        matingsByDate,
      };
    });
  }

  private groupLayingsByDate(
    layings: LayingDto[] | undefined,
    children: PetSummaryWithLayingDto[] | undefined,
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

  private mergePetWithDetail(pet: PetWithRelations) {
    if (!pet) return pet;

    const { eggDetail, petDetail, ...rest } = pet;
    const merged: MergedPet = { ...(rest as Partial<PetEntity>) };
    if (pet.growth === PET_GROWTH.EGG) {
      if (eggDetail) {
        merged.temperature = eggDetail.temperature;
        merged.eggStatus = eggDetail.status;
      }
    } else {
      if (petDetail) {
        const { morphs, sex, weight, traits } = petDetail;
        if (morphs) merged.morphs = morphs;
        if (sex) merged.sex = sex;
        if (weight) merged.weight = weight;
        if (traits) merged.traits = traits;
      }
    }

    return merged;
  }
}
