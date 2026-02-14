import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { FeedingEntity } from './feeding.entity';
import { CreateFeedingDto, FeedingDto, UpdateFeedingDto } from './feeding.dto';
import { PetEntity } from '../pet/pet.entity';
import { PageDto, PageMetaDto, PageOptionsDto } from '../common/page.dto';

@Injectable()
export class FeedingService {
  constructor(
    @InjectRepository(FeedingEntity)
    private readonly feedingRepository: Repository<FeedingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createFeeding(
    createFeedingDto: CreateFeedingDto,
    userId: string,
  ): Promise<FeedingEntity> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 조회 및 소유자 검증
      const pet = await entityManager.findOne(PetEntity, {
        where: { petId: createFeedingDto.petId, isDeleted: false },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (pet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 동일 날짜 중복 체크
      const exists = await entityManager.existsBy(FeedingEntity, {
        petId: createFeedingDto.petId,
        feedingAt: new Date(createFeedingDto.feedingAt),
      });

      if (exists) {
        throw new BadRequestException(
          '이미 해당 날짜에 피딩 기록이 존재합니다.',
        );
      }

      const feedingEntity = entityManager.create(
        FeedingEntity,
        createFeedingDto,
      );
      return entityManager.save(FeedingEntity, feedingEntity);
    });
  }

  async getFeedingList(
    petId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
    startDate?: string,
    endDate?: string,
  ): Promise<PageDto<FeedingDto>> {
    // 펫 조회 및 소유자 검증
    const pet = await this.dataSource.getRepository(PetEntity).findOne({
      where: { petId, isDeleted: false },
    });

    if (!pet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException('펫의 소유자가 아닙니다.');
    }

    const qb = this.feedingRepository
      .createQueryBuilder('feeding')
      .where('feeding.petId = :petId', { petId });

    if (startDate) {
      qb.andWhere('feeding.feedingAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('feeding.feedingAt <= :endDate', { endDate });
    }

    qb.orderBy('feeding.feedingAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const [entities, totalCount] = await qb.getManyAndCount();

    const data: FeedingDto[] = entities.map((entity) => ({
      id: entity.id,
      petId: entity.petId,
      feedingAt: String(entity.feedingAt),
      food: entity.food,
      amount: entity.amount ? Number(entity.amount) : undefined,
      memo: entity.memo,
    }));

    const pageMetaDto = new PageMetaDto({
      totalCount,
      pageOptionsDto,
    });

    return new PageDto(data, pageMetaDto);
  }

  async updateFeeding(
    id: number,
    updateFeedingDto: UpdateFeedingDto,
    userId: string,
  ) {
    // 피딩 조회
    const feeding = await this.feedingRepository.findOne({ where: { id } });

    if (!feeding) {
      throw new NotFoundException('피딩 기록을 찾을 수 없습니다.');
    }

    // 펫 소유자 검증
    const pet = await this.dataSource.getRepository(PetEntity).findOne({
      where: { petId: feeding.petId, isDeleted: false },
    });

    if (!pet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException('펫의 소유자가 아닙니다.');
    }

    const result = await this.feedingRepository.update(
      { id },
      updateFeedingDto,
    );

    if (result.affected === 0) {
      throw new NotFoundException('피딩 기록을 찾을 수 없습니다.');
    }
  }

  async deleteFeeding(id: number, userId: string) {
    // 피딩 조회
    const feeding = await this.feedingRepository.findOne({ where: { id } });

    if (!feeding) {
      throw new NotFoundException('피딩 기록을 찾을 수 없습니다.');
    }

    // 펫 소유자 검증
    const pet = await this.dataSource.getRepository(PetEntity).findOne({
      where: { petId: feeding.petId, isDeleted: false },
    });

    if (!pet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException('펫의 소유자가 아닙니다.');
    }

    await this.feedingRepository.delete({ id });
  }
}
