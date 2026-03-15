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
import { CacheService } from '../common/cache.service';
import { CACHE } from '../common/cache-keys';

/** DATE 컬럼 값(string | Date)에서 yyyy-MM 추출 */
function toYearMonth(date: Date | string): string {
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return String(date).slice(0, 7);
}

@Injectable()
export class FeedingService {
  constructor(
    @InjectRepository(FeedingEntity)
    private readonly feedingRepository: Repository<FeedingEntity>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async createFeeding(
    createFeedingDto: CreateFeedingDto,
    userId: string,
  ): Promise<FeedingEntity> {
    const result = await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
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
      },
    );

    // 트랜잭션 커밋 후 해당 월 캐시 무효화
    const yearMonth = createFeedingDto.feedingAt.slice(0, 7);
    await this.cacheService.del(
      CACHE.feeding.key(createFeedingDto.petId, yearMonth),
    );

    return result;
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

    // 월 단위 캐시 키 (startDate에서 yyyy-MM 추출)
    // 클라이언트가 항상 월 단위(itemPerPage=31, startDate~endDate)로 호출하므로
    // 캐시 키에 페이지 정보를 포함하지 않음
    const yearMonth = startDate?.slice(0, 7) ?? 'all';

    return this.cacheService.wrap(
      CACHE.feeding.key(petId, yearMonth),
      async () => {
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
          feedingAt:
            entity.feedingAt instanceof Date
              ? entity.feedingAt.toISOString().slice(0, 10)
              : String(entity.feedingAt),
          foods: entity.foods ?? undefined,
          amount: entity.amount ? Number(entity.amount) : undefined,
          memo: entity.memo,
        }));

        const pageMetaDto = new PageMetaDto({
          totalCount,
          pageOptionsDto,
        });

        return new PageDto(data, pageMetaDto);
      },
      CACHE.feeding.ttl,
    );
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

    // 기존 날짜의 월 캐시 무효화
    const yearMonth = toYearMonth(feeding.feedingAt);
    await this.cacheService.del(CACHE.feeding.key(feeding.petId, yearMonth));

    // 날짜가 변경된 경우 새 날짜의 월 캐시도 무효화
    if (updateFeedingDto.feedingAt) {
      const newYearMonth = updateFeedingDto.feedingAt.slice(0, 7);
      if (newYearMonth !== yearMonth) {
        await this.cacheService.del(
          CACHE.feeding.key(feeding.petId, newYearMonth),
        );
      }
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

    // 해당 월 캐시 무효화
    const yearMonth = toYearMonth(feeding.feedingAt);
    await this.cacheService.del(CACHE.feeding.key(feeding.petId, yearMonth));
  }
}
