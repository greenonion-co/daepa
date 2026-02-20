import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { AdoptionHistoryEntity } from './adoption_history.entity';
import {
  AdoptionHistoryDto,
  AdoptionFilterDto,
  CompleteAdoptionDto,
  PetSnapshotData,
} from './adoption_history.dto';
import { PageMetaDto, PageDto } from 'src/common/page.dto';
import {
  PET_GROWTH,
  PET_SEX,
  PET_SPECIES,
  PET_TYPE,
} from 'src/pet/pet.constants';
import { isNil, omitBy } from 'es-toolkit';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_STATUS } from 'src/user/user.constant';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { extractOriginalPetName } from '../common/utils/pet-name.helper';
import { PetAdoptionEntity } from '../pet_adoption/pet_adoption.entity';
import { PetEntity } from '../pet/pet.entity';
import { PetDetailEntity } from '../pet_detail/pet_detail.entity';
import { UserEntity } from '../user/user.entity';
import { PARENT_STATUS } from '../parent_request/parent_request.constants';

@Injectable()
export class AdoptionHistoryService {
  constructor(
    @InjectRepository(AdoptionHistoryEntity)
    private readonly adoptionHistoryRepository: Repository<AdoptionHistoryEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly dataSource: DataSource,
  ) {}

  private toAdoptionHistoryDto(
    entity: AdoptionHistoryEntity,
  ): AdoptionHistoryDto {
    const { seller, buyer, petSnapshot } = entity;

    return {
      petId: entity.petId,
      price: entity.price ?? undefined,
      adoptionDate: entity.adoptionDate ?? undefined,
      method: entity.method ?? undefined,
      memo: entity.memo ?? undefined,
      createdAt: entity.createdAt,
      pet: petSnapshot
        ? {
            petId: petSnapshot.petId,
            type: petSnapshot.type as PET_TYPE,
            name: petSnapshot.name,
            species: petSnapshot.species as PET_SPECIES,
            sex: petSnapshot.sex as PET_SEX,
            growth: petSnapshot.growth as PET_GROWTH,
            morphs: petSnapshot.morphs,
            traits: petSnapshot.traits,
            hatchingDate: petSnapshot.hatchingDate
              ? new Date(petSnapshot.hatchingDate)
              : undefined,
            isDeleted: petSnapshot.isDeleted,
            father: petSnapshot.father ?? undefined,
            mother: petSnapshot.mother ?? undefined,
          }
        : null,
      ...omitBy(
        {
          seller:
            seller?.status === USER_STATUS.DELETED
              ? { status: seller.status }
              : seller,
          buyer:
            buyer?.status === USER_STATUS.DELETED
              ? { status: buyer.status }
              : buyer,
        },
        isNil,
      ),
    };
  }

  private createHistoryQueryBuilder() {
    return this.adoptionHistoryRepository
      .createQueryBuilder('histories')
      .leftJoinAndMapOne(
        'histories.seller',
        'users',
        'seller',
        'seller.userId = histories.sellerId',
      )
      .leftJoinAndMapOne(
        'histories.buyer',
        'users',
        'buyer',
        'buyer.userId = histories.buyerId',
      )
      .select([
        'histories.id',
        'histories.petId',
        'histories.petSnapshot',
        'histories.price',
        'histories.adoptionDate',
        'histories.memo',
        'histories.method',
        'histories.createdAt',
        'seller.userId',
        'seller.name',
        'seller.role',
        'seller.isBiz',
        'seller.status',
        'buyer.userId',
        'buyer.name',
        'buyer.role',
        'buyer.isBiz',
        'buyer.status',
      ]);
  }

  async findAll(
    pageOptionsDto: AdoptionFilterDto,
    userId: string,
  ): Promise<PageDto<AdoptionHistoryDto>> {
    const qb = this.createHistoryQueryBuilder().where(
      'histories.sellerId = :sellerId',
      { sellerId: userId },
    );

    this.buildHistoryFilterQuery(qb, pageOptionsDto);

    qb.orderBy('histories.adoptionDate', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const [historyEntities, totalCount] = await qb.getManyAndCount();

    const historyDtos = historyEntities.map((entity) =>
      this.toAdoptionHistoryDto(entity),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(historyDtos, pageMetaDto);
  }

  private buildHistoryFilterQuery(
    queryBuilder: SelectQueryBuilder<AdoptionHistoryEntity>,
    pageOptionsDto: AdoptionFilterDto,
  ) {
    // 키워드 검색
    if (pageOptionsDto.keyword) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.pet_snapshot, '$.name')) LIKE :keyword`,
        { keyword: `%${pageOptionsDto.keyword}%` },
      );
    }

    // 종 필터링
    if (pageOptionsDto.species) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.pet_snapshot, '$.species')) = :species`,
        { species: pageOptionsDto.species },
      );
    }

    // 모프 필터링
    if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
      const morphsJson = JSON.stringify(pageOptionsDto.morphs);
      queryBuilder.andWhere(
        `JSON_OVERLAPS(JSON_EXTRACT(histories.pet_snapshot, '$.morphs'), :morphs)`,
        { morphs: morphsJson },
      );
    }

    // 형질 필터링
    if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
      const traitsJson = JSON.stringify(pageOptionsDto.traits);
      queryBuilder.andWhere(
        `JSON_OVERLAPS(JSON_EXTRACT(histories.pet_snapshot, '$.traits'), :traits)`,
        { traits: traitsJson },
      );
    }

    // 성별 필터링
    if (pageOptionsDto.sex && pageOptionsDto.sex.length > 0) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.pet_snapshot, '$.sex')) IN (:...sex)`,
        { sex: pageOptionsDto.sex },
      );
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth && pageOptionsDto.growth.length > 0) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.pet_snapshot, '$.growth')) IN (:...growth)`,
        { growth: pageOptionsDto.growth },
      );
    }

    // 분양 방식 필터링
    if (pageOptionsDto.method) {
      queryBuilder.andWhere('histories.method = :method', {
        method: pageOptionsDto.method,
      });
    }

    // 최소 분양 가격 필터링
    if (pageOptionsDto.minPrice !== undefined) {
      queryBuilder.andWhere('histories.price >= :minPrice', {
        minPrice: pageOptionsDto.minPrice,
      });
    }

    // 최대 분양 가격 필터링
    if (pageOptionsDto.maxPrice !== undefined) {
      queryBuilder.andWhere('histories.price <= :maxPrice', {
        maxPrice: pageOptionsDto.maxPrice,
      });
    }

    // 최소 분양 날짜 필터링
    if (pageOptionsDto.startDate) {
      queryBuilder.andWhere('histories.adoptionDate >= :startDate', {
        startDate: pageOptionsDto.startDate.toISOString().split('T')[0],
      });
    }

    // 최대 분양 날짜 필터링
    if (pageOptionsDto.endDate) {
      queryBuilder.andWhere('histories.adoptionDate <= :endDate', {
        endDate: pageOptionsDto.endDate.toISOString().split('T')[0],
      });
    }

    // 부 개체 필터링
    if (pageOptionsDto.fatherId) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.pet_snapshot, '$.father.petId')) = :fatherId`,
        { fatherId: pageOptionsDto.fatherId },
      );
    }

    // 모 개체 필터링
    if (pageOptionsDto.motherId) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.pet_snapshot, '$.mother.petId')) = :motherId`,
        { motherId: pageOptionsDto.motherId },
      );
    }
  }

  async completeAdoption(
    petId: string,
    completeAdoptionDto: CompleteAdoptionDto,
    userId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (em: EntityManager) => {
      // 1. 기존 분양 정보 조회
      const adoptionEntity = await em.findOne(PetAdoptionEntity, {
        where: { petId },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      if (adoptionEntity.sellerId !== userId) {
        throw new ForbiddenException('분양 정보의 소유자가 아닙니다.');
      }

      // 2. 입양자가 있는 경우 존재 확인
      const finalBuyerId =
        completeAdoptionDto.buyerId ?? adoptionEntity.buyerId ?? null;

      if (finalBuyerId) {
        const buyer = await em.findOne(UserEntity, {
          where: { userId: finalBuyerId },
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      // 3. 부모 요청 확인
      const pendingCount =
        await this.parentRequestService.getPendingRequestCount(petId, em);
      if (pendingCount > 0) {
        throw new BadRequestException(
          `이 펫과 관련된 부모 요청(${pendingCount}건)을 모두 처리한 후 다시 시도해주세요.`,
        );
      }

      // 4. 펫 스냅샷 생성
      const pet = await em.findOne(PetEntity, {
        where: { petId },
        select: [
          'petId',
          'type',
          'name',
          'species',
          'hatchingDate',
          'isDeleted',
        ],
      });

      if (!pet) {
        throw new NotFoundException('펫 정보를 찾을 수 없습니다.');
      }

      const petDetail = await em.findOne(PetDetailEntity, {
        where: { petId },
        select: ['sex', 'growth', 'morphs', 'traits'],
      });

      const { father, mother } =
        await this.parentRequestService.getParentsWithRequestStatus(
          petId,
          { statuses: [PARENT_STATUS.APPROVED] },
          em,
        );

      const petName = pet.isDeleted
        ? extractOriginalPetName(pet.name)
        : pet.name;

      const petSnapshot: PetSnapshotData = {
        petId: pet.petId,
        type: pet.type,
        name: petName ?? undefined,
        species: pet.species,
        sex: petDetail?.sex ?? undefined,
        growth: petDetail?.growth ?? undefined,
        morphs: petDetail?.morphs ?? undefined,
        traits: petDetail?.traits ?? undefined,
        hatchingDate: pet.hatchingDate
          ? pet.hatchingDate instanceof Date
            ? pet.hatchingDate.toISOString().split('T')[0]
            : String(pet.hatchingDate)
          : undefined,
        isDeleted: pet.isDeleted || undefined,
        father: father ? { petId: father.petId, name: father.name } : null,
        mother: mother ? { petId: mother.petId, name: mother.name } : null,
      };

      // 5. adoption_histories에 INSERT
      const historyEntity = new AdoptionHistoryEntity();
      Object.assign(historyEntity, {
        petId,
        sellerId: adoptionEntity.sellerId,
        adoptionDate: completeAdoptionDto.adoptionDate,
        buyerId: finalBuyerId,
        price: completeAdoptionDto.price,
        method: completeAdoptionDto.method,
        memo: completeAdoptionDto.memo,
        petSnapshot,
      });
      await em.save(AdoptionHistoryEntity, historyEntity);

      // 6. pet_adoption 리셋
      adoptionEntity.sellerId = finalBuyerId ?? adoptionEntity.sellerId;
      adoptionEntity.status = null;
      adoptionEntity.price = null;
      adoptionEntity.memo = null;
      adoptionEntity.buyerId = null;
      await em.save(PetAdoptionEntity, adoptionEntity);

      // 7. 펫 소유권 이전 (입양자가 없으면 소유권 박탈)
      await em.update('pets', { petId }, { ownerId: finalBuyerId ?? null });
    });
  }
}
