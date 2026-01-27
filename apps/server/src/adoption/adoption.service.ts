import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsWhere,
  EntityManager,
  DataSource,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { AdoptionEntity } from './adoption.entity';
import {
  AdoptionDto,
  AdoptionFilterDto,
  CreateAdoptionDto,
  UpdateAdoptionDto,
} from './adoption.dto';
import { nanoid } from 'nanoid';
import { PageMetaDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
import { ADOPTION_SALE_STATUS } from 'src/pet/pet.constants';
import { isNil, isUndefined, omitBy } from 'es-toolkit';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_STATUS } from 'src/user/user.constant';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { replaceParentPublicSafe } from '../common/utils/pet-parent.helper';
import { extractOriginalPetName } from '../common/utils/pet-name.helper';

@Injectable()
export class AdoptionService {
  constructor(
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly dataSource: DataSource,
  ) {}

  private generateAdoptionId(): string {
    return nanoid(8);
  }

  private async toAdoptionDtoOptimized(
    entity: AdoptionEntity,
    userId?: string,
  ): Promise<AdoptionDto> {
    if (!entity.pet) {
      throw new Error('Pet information is required for adoption');
    }

    const { pet, petDetail, seller, buyer, ...adoptionData } = entity;

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
      ...adoptionData,
      price: adoptionData.price ?? undefined,
      adoptionDate: adoptionData.adoptionDate ?? undefined,
      method: adoptionData.method ?? undefined,
      status: adoptionData.status,
      memo: adoptionData.memo ?? undefined,
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
              ? {
                  status: seller.status,
                }
              : seller,
          buyer:
            buyer?.status === USER_STATUS.DELETED
              ? {
                  status: buyer.status,
                }
              : buyer,
        },
        isNil,
      ),
    };
  }

  private async updatePetOwner(
    entityManager: EntityManager,
    petId: string,
    newOwnerId?: string | null,
  ) {
    await entityManager.update(
      'pets',
      { petId },
      { ownerId: newOwnerId ?? null },
    );
  }

  private createAdoptionQueryBuilder() {
    return this.adoptionRepository
      .createQueryBuilder('adoptions')
      .innerJoinAndMapOne(
        'adoptions.pet',
        'pets',
        'pets',
        'pets.petId = adoptions.petId',
      )
      .innerJoinAndMapOne(
        'adoptions.petDetail',
        'pet_details',
        'pet_details',
        'pet_details.petId = pets.petId',
      )
      .leftJoinAndMapOne(
        'adoptions.seller',
        'users',
        'seller',
        'seller.userId = adoptions.sellerId',
      )
      .leftJoinAndMapOne(
        'adoptions.buyer',
        'users',
        'buyer',
        'buyer.userId = adoptions.buyerId',
      )
      .select([
        'adoptions.id',
        'adoptions.adoptionId',
        'adoptions.petId',
        'adoptions.price',
        'adoptions.adoptionDate',
        'adoptions.memo',
        'adoptions.method',
        'adoptions.status',
        'adoptions.createdAt',
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

  async findOne(
    where: FindOptionsWhere<AdoptionEntity>,
    userId?: string,
  ): Promise<AdoptionDto | null> {
    const qb = this.createAdoptionQueryBuilder().where(
      'adoptions.isDeleted = :isDeleted',
      { isDeleted: false },
    );

    // where 조건 추가
    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined) {
        qb.andWhere(`adoptions.${key} = :${key}`, { [key]: value });
      }
    }

    const adoptionEntity = await qb.getOne();
    if (!adoptionEntity) {
      return null;
      // throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
    }

    return await this.toAdoptionDtoOptimized(adoptionEntity, userId);
  }

  async findAll(
    pageOptionsDto: AdoptionFilterDto,
    userId: string,
  ): Promise<PageDto<AdoptionDto>> {
    const qb = this.createAdoptionQueryBuilder().where(
      'adoptions.sellerId = :sellerId AND adoptions.isDeleted = :isDeleted',
      {
        sellerId: userId,
        isDeleted: false,
      },
    );

    // findAll은 판매완료된 분양정보만 조회
    pageOptionsDto.status = ADOPTION_SALE_STATUS.SOLD;
    this.buildAdoptionFilterQuery(qb, pageOptionsDto);

    qb.orderBy('adoptions.adoptionDate', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const [adoptionEntities, totalCount] = await qb.getManyAndCount();

    const adoptionDtos = await Promise.all(
      adoptionEntities.map((entity) =>
        this.toAdoptionDtoOptimized(entity, userId),
      ),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(adoptionDtos, pageMetaDto);
  }

  private buildAdoptionFilterQuery(
    queryBuilder: SelectQueryBuilder<AdoptionEntity>,
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

    // 모프 필터링 (OR 조건: 선택한 모프 중 하나라도 포함되면 매칭)
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

    // 판매 상태 필터링
    if (pageOptionsDto.status) {
      queryBuilder.andWhere('adoptions.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    // 분양 방식 필터링
    if (pageOptionsDto.method) {
      queryBuilder.andWhere('adoptions.method = :method', {
        method: pageOptionsDto.method,
      });
    }

    // 최소 분양 가격 필터링
    if (pageOptionsDto.minPrice !== undefined) {
      queryBuilder.andWhere('adoptions.price >= :minPrice', {
        minPrice: pageOptionsDto.minPrice,
      });
    }

    // 최대 분양 가격 필터링
    if (pageOptionsDto.maxPrice !== undefined) {
      queryBuilder.andWhere('adoptions.price <= :maxPrice', {
        maxPrice: pageOptionsDto.maxPrice,
      });
    }

    // 최소 분양 날짜 필터링
    if (pageOptionsDto.startDate) {
      queryBuilder.andWhere('adoptions.adoptionDate >= :startDate', {
        startDate: pageOptionsDto.startDate,
      });
    }

    // 최대 분양 날짜 필터링
    if (pageOptionsDto.endDate) {
      queryBuilder.andWhere('adoptions.adoptionDate <= :endDate', {
        endDate: pageOptionsDto.endDate,
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

  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
    entityManager?: EntityManager,
  ): Promise<{ adoptionId: string }> {
    const run = async (em: EntityManager) => {
      // 펫 존재 여부 확인
      const pet = await em.findOne(PetEntity, {
        where: { petId: createAdoptionDto.petId, isDeleted: false },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }
      if (pet.ownerId !== sellerId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 이미 분양 정보가 있는지 확인
      const existingAdoption = await em.existsBy(AdoptionEntity, {
        petId: createAdoptionDto.petId,
        isActive: true,
        isDeleted: false,
      });

      if (existingAdoption) {
        throw new BadRequestException('이미 분양 정보가 있습니다.');
      }

      if (createAdoptionDto.buyerId) {
        if (
          createAdoptionDto.status &&
          ![
            ADOPTION_SALE_STATUS.ON_RESERVATION,
            ADOPTION_SALE_STATUS.SOLD,
          ].includes(createAdoptionDto.status)
        ) {
          throw new BadRequestException(
            '예약중, 판매 완료 상태일 때만 입양자 정보를 입력할 수 있습니다.',
          );
        }

        const buyer = await em.findOne(UserEntity, {
          where: { userId: createAdoptionDto.buyerId },
        });

        if (!buyer) {
          throw new NotFoundException('입양자 정보를 찾을 수 없습니다.');
        }
      }

      const adoptionId = this.generateAdoptionId();

      const adoptionEntity = new AdoptionEntity();
      Object.assign(adoptionEntity, {
        ...createAdoptionDto,
        adoptionId,
        sellerId,
        buyerId: createAdoptionDto.buyerId,
        isActive:
          createAdoptionDto.status === ADOPTION_SALE_STATUS.SOLD ? false : true,
      });

      await em.save(AdoptionEntity, adoptionEntity);

      if (createAdoptionDto.status === ADOPTION_SALE_STATUS.SOLD) {
        await this.updatePetOwner(
          em,
          createAdoptionDto.petId,
          createAdoptionDto.buyerId,
        );
      }

      return { adoptionId };
    };

    if (entityManager) {
      return await run(entityManager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return await run(entityManager);
    });
  }

  async updateAdoption(
    adoptionId: string,
    updateAdoptionDto: UpdateAdoptionDto,
    entityManager?: EntityManager,
  ): Promise<{ adoptionId: string }> {
    const run = async (em: EntityManager) => {
      const adoptionEntity = await em.findOne(AdoptionEntity, {
        where: {
          adoptionId,
          isDeleted: false,
        },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      if (updateAdoptionDto.buyerId) {
        if (
          updateAdoptionDto.status &&
          ![
            ADOPTION_SALE_STATUS.ON_RESERVATION,
            ADOPTION_SALE_STATUS.SOLD,
          ].includes(updateAdoptionDto.status)
        ) {
          throw new BadRequestException(
            '예약중, 판매 완료 상태일 때만 입양자 정보를 입력할 수 있습니다.',
          );
        }

        const buyer = await em.findOne(UserEntity, {
          where: { userId: updateAdoptionDto.buyerId },
        });

        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const newAdoptionEntity = new AdoptionEntity();
      Object.assign(newAdoptionEntity, {
        ...adoptionEntity,
        ...omitBy(updateAdoptionDto, isUndefined),
        isActive: isUndefined(updateAdoptionDto.status)
          ? adoptionEntity.isActive // status가 없으면 기존 isActive 유지
          : updateAdoptionDto.status !== ADOPTION_SALE_STATUS.SOLD, // status가 있으면 새로 계산
      });

      await em.save(AdoptionEntity, newAdoptionEntity);

      if (updateAdoptionDto.status === ADOPTION_SALE_STATUS.SOLD) {
        const hasPendingRequest =
          await this.parentRequestService.hasPendingRequestsByPetId(
            newAdoptionEntity.petId,
            em,
          );
        if (hasPendingRequest) {
          throw new BadRequestException(
            '이 펫과 관련된 부모 요청을 모두 처리한 후 다시 시도해주세요.',
          );
        }

        await this.updatePetOwner(
          em,
          adoptionEntity.petId,
          updateAdoptionDto.buyerId ?? adoptionEntity.buyerId,
        );
      }

      return { adoptionId };
    };

    if (entityManager) {
      return await run(entityManager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return await run(entityManager);
    });
  }
}
