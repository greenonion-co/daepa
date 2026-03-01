import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMatingDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource, Not, Raw } from 'typeorm';

import { LayingEntity } from 'src/laying/laying.entity';
import { UpdateMatingDto } from './mating.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { PET_SEX } from 'src/pet/pet.constants';

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * fatherId/motherId를 성별 기반으로 정규화한다.
   * fatherId에 수컷, motherId에 암컷이 오도록 보장.
   */
  private async normalizeParentIds(
    entityManager: EntityManager,
    fatherId?: string,
    motherId?: string,
  ): Promise<{ fatherId?: string; motherId?: string }> {
    if (!fatherId || !motherId) return { fatherId, motherId };

    const details = await entityManager.find(PetDetailEntity, {
      where: [{ petId: fatherId }, { petId: motherId }],
      select: ['petId', 'sex'],
    });

    const fatherSex = details.find((d) => d.petId === fatherId)?.sex;
    const motherSex = details.find((d) => d.petId === motherId)?.sex;

    // fatherId가 암컷이거나 motherId가 수컷이면 swap
    if (fatherSex === PET_SEX.FEMALE || motherSex === PET_SEX.MALE) {
      return { fatherId: motherId, motherId: fatherId };
    }

    return { fatherId, motherId };
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      if (!createMatingDto.fatherId && !createMatingDto.motherId) {
        throw new BadRequestException('최소 하나의 부모 펫을 입력해야 합니다.');
      }

      const { fatherId, motherId } = await this.normalizeParentIds(
        entityManager,
        createMatingDto.fatherId,
        createMatingDto.motherId,
      );

      // 페어가 존재하는지 확인하거나 생성 (삭제된 페어 포함하여 조회)
      let pair = await entityManager.findOne(PairEntity, {
        where: {
          ownerId: userId,
          fatherId,
          motherId,
        },
      });

      if (!pair) {
        pair = entityManager.create(PairEntity, {
          ownerId: userId,
          fatherId,
          motherId,
          species: createMatingDto.species,
        });
        pair = await entityManager.save(PairEntity, pair);
      } else if (pair.isDeleted) {
        // 삭제된 페어 재활성화
        await entityManager.update(
          PairEntity,
          { id: pair.id },
          {
            isDeleted: false,
            deletedAt: null,
            species: createMatingDto.species,
          },
        );
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

      // season 정합성 검증
      await this.validateSeasonConsistency(
        entityManager,
        pair.id,
        ymd,
        createMatingDto.season,
      );

      const matingEntity = entityManager.create(MatingEntity, {
        pairId: pair.id,
        matingDate: ymd,
        season: createMatingDto.season,
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

      const { fatherId, motherId } = await this.normalizeParentIds(
        entityManager,
        updateMatingDto.fatherId,
        updateMatingDto.motherId,
      );

      // 페어 정보 업데이트 또는 새 페어 생성 (삭제된 페어 포함하여 조회)
      let pair = await entityManager.findOne(PairEntity, {
        where: {
          ownerId: userId,
          fatherId,
          motherId,
        },
      });

      if (!pair) {
        pair = entityManager.create(PairEntity, {
          ownerId: userId,
          fatherId,
          motherId,
        });
        pair = await entityManager.save(PairEntity, pair);
      } else if (pair.isDeleted) {
        // 삭제된 페어 재활성화
        await entityManager.update(
          PairEntity,
          { id: pair.id },
          {
            isDeleted: false,
            deletedAt: null,
          },
        );
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

      // season 정합성 검증
      await this.validateSeasonConsistency(
        entityManager,
        pair.id,
        ymd,
        updateMatingDto.season,
        matingId,
      );

      await entityManager.update(
        MatingEntity,
        { id: matingId },
        {
          pairId: pair.id,
          matingDate: updateMatingDto.matingDate,
          season: updateMatingDto.season,
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

  /**
   * season과 matingDate의 정합성을 검증한다.
   * - 동일 pairId 내에서 season 값은 중복될 수 없다.
   * - matingDate가 더 최신이면 season이 기존보다 낮을 수 없다.
   * - matingDate가 더 오래됐으면 season이 기존보다 높을 수 없다.
   */
  private async validateSeasonConsistency(
    entityManager: EntityManager,
    pairId: number,
    matingDate: string,
    season: number,
    excludeMatingId?: number,
  ) {
    let query = entityManager
      .createQueryBuilder(MatingEntity, 'm')
      .where('m.pairId = :pairId', { pairId });

    if (excludeMatingId) {
      query = query.andWhere('m.id != :excludeId', {
        excludeId: excludeMatingId,
      });
    }

    const siblings = await query
      .select(['m.id', 'm.matingDate', 'm.season'])
      .getMany();

    // 1) season 중복 검사
    const duplicateSeason = siblings.find((s) => s.season === season);
    if (duplicateSeason) {
      throw new BadRequestException(`이미 ${season}시즌이 존재합니다.`);
    }

    // 2) 날짜-시즌 순서 정합성 검사
    const currentDate = new Date(matingDate).getTime();

    for (const sibling of siblings) {
      if (!sibling.matingDate) continue;

      const siblingDate = new Date(sibling.matingDate).getTime();

      // 현재 날짜가 더 최신인데 season이 기존보다 낮은 경우
      if (currentDate > siblingDate && season < sibling.season) {
        throw new BadRequestException(
          `날짜가 ${sibling.season}시즌보다 이후이므로 시즌 값이 ${sibling.season}보다 낮을 수 없습니다.`,
        );
      }

      // 현재 날짜가 더 오래됐는데 season이 기존보다 높은 경우
      if (currentDate < siblingDate && season > sibling.season) {
        throw new BadRequestException(
          `날짜가 ${sibling.season}시즌보다 이전이므로 시즌 값이 ${sibling.season}보다 높을 수 없습니다.`,
        );
      }
    }
  }
}
