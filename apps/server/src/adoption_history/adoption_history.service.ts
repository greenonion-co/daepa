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
} from './adoption_history.dto';
import { PageMetaDto, PageDto } from 'src/common/page.dto';
import { isNil } from 'es-toolkit';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_STATUS } from 'src/user/user.constant';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { replaceParentPublicSafe } from '../common/utils/pet-parent.helper';
import { extractOriginalPetName } from '../common/utils/pet-name.helper';
import { omitBy } from 'es-toolkit';
import { PetAdoptionEntity } from '../pet_adoption/pet_adoption.entity';
import { PetEntity } from '../pet/pet.entity';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class AdoptionHistoryService {
  constructor(
    @InjectRepository(AdoptionHistoryEntity)
    private readonly adoptionHistoryRepository: Repository<AdoptionHistoryEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly dataSource: DataSource,
  ) {}

  private async toAdoptionHistoryDtoOptimized(
    entity: AdoptionHistoryEntity,
    userId?: string,
  ): Promise<AdoptionHistoryDto> {
    const { pet, petDetail, seller, buyer } = entity;

    if (!pet) {
      throw new Error('Pet information is required for adoption history');
    }

    const { father, mother } =
      await this.parentRequestService.getParentsWithRequestStatus(pet.petId);

    const fatherDisplayable = replaceParentPublicSafe(
      father,
      pet.ownerId,
      userId,
    );
    const motherDisplayable = replaceParentPublicSafe(
      mother,
      pet.ownerId,
      userId,
    );

    const petName = pet.isDeleted ? extractOriginalPetName(pet.name) : pet.name;

    return {
      petId: entity.petId,
      price: entity.price ?? undefined,
      adoptionDate: entity.adoptionDate ?? undefined,
      method: entity.method ?? undefined,
      memo: entity.memo ?? undefined,
      createdAt: entity.createdAt,
      pet: {
        petId: pet.petId,
        type: pet.type,
        species: pet.species,
        isDeleted: pet.isDeleted,
        ...omitBy(
          {
            name: petName ?? undefined,
            hatchingDate: pet.hatchingDate ?? undefined,
            sex: petDetail?.sex ?? undefined,
            morphs: petDetail?.morphs ?? undefined,
            traits: petDetail?.traits ?? undefined,
            growth: petDetail?.growth ?? undefined,
            father: fatherDisplayable ?? undefined,
            mother: motherDisplayable ?? undefined,
          },
          isNil,
        ),
      },
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
      .innerJoinAndMapOne(
        'histories.pet',
        'pets',
        'pets',
        'pets.petId = histories.petId',
      )
      .innerJoinAndMapOne(
        'histories.petDetail',
        'pet_details',
        'pet_details',
        'pet_details.petId = pets.petId',
      )
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
        'histories.price',
        'histories.adoptionDate',
        'histories.memo',
        'histories.method',
        'histories.createdAt',
        'pets.petId',
        'pets.type',
        'pets.name',
        'pets.species',
        'pets.hatchingDate',
        'pets.isDeleted',
        'pet_details.sex',
        'pet_details.morphs',
        'pet_details.traits',
        'pet_details.growth',
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

    const historyDtos = await Promise.all(
      historyEntities.map((entity) =>
        this.toAdoptionHistoryDtoOptimized(entity, userId),
      ),
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
      queryBuilder.andWhere('pets.name LIKE :keyword', {
        keyword: `%${pageOptionsDto.keyword}%`,
      });
    }

    // 종 필터링
    if (pageOptionsDto.species) {
      queryBuilder.andWhere('pets.species = :species', {
        species: pageOptionsDto.species,
      });
    }

    // 모프 필터링
    if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
      const morphsJson = JSON.stringify(pageOptionsDto.morphs);
      queryBuilder.andWhere(`JSON_OVERLAPS(pet_details.morphs, :morphs)`, {
        morphs: morphsJson,
      });
    }

    // 형질 필터링
    if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
      const traitsJson = JSON.stringify(pageOptionsDto.traits);
      queryBuilder.andWhere(`JSON_OVERLAPS(pet_details.traits, :traits)`, {
        traits: traitsJson,
      });
    }

    // 성별 필터링
    if (pageOptionsDto.sex && pageOptionsDto.sex.length > 0) {
      queryBuilder.andWhere('pet_details.sex IN (:...sex)', {
        sex: pageOptionsDto.sex,
      });
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth && pageOptionsDto.growth.length > 0) {
      queryBuilder.andWhere('pet_details.growth IN (:...growth)', {
        growth: pageOptionsDto.growth,
      });
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

    // 최소 분양 날짜 필터링 (date 컬럼이므로 문자열로 비교하여 타임존 이슈 방지)
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
        `EXISTS (
          SELECT 1 FROM parent_requests
          WHERE parent_requests.child_pet_id = pets.pet_id
            AND parent_requests.parent_pet_id = :fatherId
            AND parent_requests.role = 'father'
            AND parent_requests.status = 'approved'
        )`,
        { fatherId: pageOptionsDto.fatherId },
      );
    }

    // 모 개체 필터링
    if (pageOptionsDto.motherId) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM parent_requests
          WHERE parent_requests.child_pet_id = pets.pet_id
            AND parent_requests.parent_pet_id = :motherId
            AND parent_requests.role = 'mother'
            AND parent_requests.status = 'approved'
        )`,
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
      const hasPendingRequest =
        await this.parentRequestService.hasPendingRequestsByPetId(petId, em);
      if (hasPendingRequest) {
        throw new BadRequestException(
          '이 펫과 관련된 부모 요청을 모두 처리한 후 다시 시도해주세요.',
        );
      }

      // 4. adoption_histories에 INSERT
      const historyEntity = new AdoptionHistoryEntity();
      Object.assign(historyEntity, {
        petId,
        sellerId: adoptionEntity.sellerId,
        adoptionDate: completeAdoptionDto.adoptionDate,
        buyerId: finalBuyerId,
        price: completeAdoptionDto.price,
        method: completeAdoptionDto.method,
        memo: completeAdoptionDto.memo,
      });
      await em.save(AdoptionHistoryEntity, historyEntity);

      // 5. pet_adoption 리셋
      adoptionEntity.sellerId = finalBuyerId ?? adoptionEntity.sellerId;
      adoptionEntity.status = null;
      adoptionEntity.price = null;
      adoptionEntity.memo = null;
      adoptionEntity.buyerId = null;
      await em.save(PetAdoptionEntity, adoptionEntity);

      // 6. 입양자가 있는 경우에만 펫 소유권 이전
      if (finalBuyerId) {
        await em.update('pets', { petId }, { ownerId: finalBuyerId });
      }
    });
  }
}
