import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMatingDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  DataSource,
  FindOptionsWhere,
  Raw,
} from 'typeorm';

import { LayingEntity } from 'src/laying/laying.entity';
import { UpdateMatingDto } from './mating.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { Not } from 'typeorm';

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
    private readonly dataSource: DataSource,
  ) {}

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

  async isMatingExist(criteria: FindOptionsWhere<MatingEntity>) {
    const isExist = await this.matingRepository.existsBy(criteria);
    return isExist;
  }
}
