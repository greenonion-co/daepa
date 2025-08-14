import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, EntityManager, DataSource } from 'typeorm';
import { AdoptionEntity } from './adoption.entity';
import {
  AdoptionDto,
  AdoptionFilterDto,
  CreateAdoptionDto,
  UpdateAdoptionDto,
} from './adoption.dto';
import { PetService } from 'src/pet/pet.service';
import { UserService } from 'src/user/user.service';
import { nanoid } from 'nanoid';
import { PageMetaDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
import {
  ADOPTION_SALE_STATUS,
  PET_ADOPTION_LOCATION,
} from 'src/pet/pet.constants';
import { PetEntity } from 'src/pet/pet.entity';

@Injectable()
export class AdoptionService {
  constructor(
    private readonly petService: PetService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  private generateAdoptionId(): string {
    return nanoid(8);
  }

  private toAdoptionDtoOptimized(entity: AdoptionEntity): AdoptionDto {
    if (!entity.pet) {
      throw new Error('Pet information is required for adoption');
    }

    const { pet, ...adoptionData } = entity;

    return {
      ...adoptionData,
      pet: this.toPetSummaryDtoOptimized(pet),
    };
  }

  private toPetSummaryDtoOptimized(pet: PetEntity) {
    const { petId, name, species, morphs, traits, hatchingDate, sex } = pet;
    return { petId, name, species, morphs, traits, hatchingDate, sex };
  }

  private async updatePetStatus(
    entityManager: EntityManager,
    petId: string,
    newAdoptionDto: UpdateAdoptionDto,
  ) {
    const status =
      newAdoptionDto.status ||
      (newAdoptionDto.buyerId
        ? ADOPTION_SALE_STATUS.ON_RESERVATION
        : ADOPTION_SALE_STATUS.ON_SALE);

    if (status === ADOPTION_SALE_STATUS.SOLD) {
      const newOwnerId = newAdoptionDto.buyerId || null;
      await entityManager.update('pets', { petId }, { ownerId: newOwnerId });
    }
  }

  private updateEntityFields<T extends object, U extends object>(
    entity: T,
    updateDto: U,
    fieldMappings: Partial<Record<keyof U, (value: any) => Partial<T>>>,
  ): void {
    for (const [key, mapper] of Object.entries(fieldMappings)) {
      const value = updateDto[key as keyof U];
      if (value !== undefined && mapper) {
        Object.assign(entity, (mapper as (value: any) => Partial<T>)(value));
      }
    }
  }

  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
  ): Promise<{ adoptionId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 확인
      const pet = await this.petService.findPetByPetId(createAdoptionDto.petId);
      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (pet?.owner?.userId !== sellerId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 이미 분양 정보가 있는지 확인
      const existingAdoption = await entityManager.existsBy(AdoptionEntity, {
        petId: createAdoptionDto.petId,
        isDeleted: false,
      });

      if (existingAdoption) {
        throw new BadRequestException('이미 분양 정보가 있습니다.');
      }

      if (createAdoptionDto.buyerId) {
        const buyer = await this.userService.findOne({
          userId: createAdoptionDto.buyerId,
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const adoptionId = this.generateAdoptionId();

      const adoptionEntity = new AdoptionEntity();
      Object.assign(adoptionEntity, {
        ...createAdoptionDto,
        adoptionId,
        sellerId,
        buyerId: createAdoptionDto.buyerId,
      });

      await entityManager.save(AdoptionEntity, adoptionEntity);

      await this.updatePetStatus(
        entityManager,
        createAdoptionDto.petId,
        createAdoptionDto,
      );

      return { adoptionId };
    });
  }

  async findAll(
    pageOptionsDto: AdoptionFilterDto,
    userId: string,
  ): Promise<PageDto<AdoptionDto>> {
    const [adoptionEntities, totalCount] = await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        const queryBuilder = entityManager
          .createQueryBuilder(AdoptionEntity, 'adoptions')
          .leftJoinAndMapOne(
            'adoptions.pet',
            'pets',
            'pets',
            'pets.petId = adoptions.petId',
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
          .where('adoptions.isDeleted = :isDeleted', { isDeleted: false })
          .andWhere('adoptions.sellerId = :userId', { userId });

        // 키워드 검색 (펫 이름/설명 + 분양 메모)
        if (pageOptionsDto.keyword) {
          queryBuilder.andWhere(
            '(pets.name LIKE :keyword OR pets.desc LIKE :keyword OR adoptions.memo LIKE :keyword)',
            { keyword: `%${pageOptionsDto.keyword}%` },
          );
        }

        // 종 필터링
        if (pageOptionsDto.species) {
          queryBuilder.andWhere('pets.species = :species', {
            species: pageOptionsDto.species,
          });
        }

        // 성별 필터링
        if (pageOptionsDto.sex) {
          queryBuilder.andWhere('pets.sex = :sex', { sex: pageOptionsDto.sex });
        }

        // 공개 여부 필터링 (펫 공개 여부)
        if (pageOptionsDto.isPublic !== undefined) {
          queryBuilder.andWhere('pets.isPublic = :isPublic', {
            isPublic: pageOptionsDto.isPublic,
          });
        }

        // 생년월일 범위 필터링
        if (pageOptionsDto.startYmd !== undefined) {
          queryBuilder.andWhere('pets.hatchingDate >= :startYmd', {
            startYmd: pageOptionsDto.startYmd,
          });
        }
        if (pageOptionsDto.endYmd !== undefined) {
          queryBuilder.andWhere('pets.hatchingDate <= :endYmd', {
            endYmd: pageOptionsDto.endYmd,
          });
        }

        // 모프 필터링
        if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
          pageOptionsDto.morphs.forEach((morph, index) => {
            queryBuilder.andWhere(
              `JSON_CONTAINS(pets.morphs, :morph${index})`,
              {
                [`morph${index}`]: JSON.stringify(morph),
              },
            );
          });
        }

        // 형질 필터링
        if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
          pageOptionsDto.traits.forEach((trait, index) => {
            queryBuilder.andWhere(
              `JSON_CONTAINS(pets.traits, :trait${index})`,
              {
                [`trait${index}`]: JSON.stringify(trait),
              },
            );
          });
        }

        // 먹이 필터링
        if (pageOptionsDto.foods) {
          queryBuilder.andWhere('JSON_CONTAINS(pets.foods, :food)', {
            food: JSON.stringify(pageOptionsDto.foods),
          });
        }

        // 판매 상태 필터링
        if (pageOptionsDto.status) {
          queryBuilder.andWhere('adoptions.status = :status', {
            status: pageOptionsDto.status,
          });
        }

        // 성장단계 필터링
        if (pageOptionsDto.growth) {
          queryBuilder.andWhere('pets.growth = :growth', {
            growth: pageOptionsDto.growth,
          });
        }

        return queryBuilder
          .orderBy('adoptions.createdAt', pageOptionsDto.order)
          .skip(pageOptionsDto.skip)
          .take(pageOptionsDto.itemPerPage)
          .getManyAndCount();
      },
    );

    const adoptionDtos = adoptionEntities.map((adoption) =>
      this.toAdoptionDtoOptimized(adoption),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return new PageDto(adoptionDtos, pageMetaDto);
  }

  async findOne(
    where: FindOptionsWhere<AdoptionEntity>,
  ): Promise<AdoptionDto | null> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const queryBuilder = entityManager
        .createQueryBuilder(AdoptionEntity, 'adoptions')
        .leftJoinAndMapOne(
          'adoptions.pet',
          'pets',
          'pets',
          'pets.petId = adoptions.petId',
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
        .where('adoptions.isDeleted = :isDeleted', { isDeleted: false })
        .select([
          'adoptions.adoptionId',
          'adoptions.petId',
          'adoptions.price',
          'adoptions.adoptionDate',
          'adoptions.memo',
          'adoptions.location',
          'adoptions.status',
          'adoptions.createdAt',
          'adoptions.updatedAt',
          'pets.petId',
          'pets.name',
          'pets.species',
          'pets.morphs',
          'pets.traits',
          'pets.hatchingDate',
          'pets.sex',
          'pets.ownerId',
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

      // where 조건 추가
      for (const key of Object.keys(where)) {
        const value = where[key as keyof typeof where];
        if (value !== undefined) {
          queryBuilder.andWhere(`adoptions.${key} = :${key}`, { [key]: value });
        }
      }

      const adoptionEntity = await queryBuilder.getOne();

      if (!adoptionEntity) {
        return null;
      }

      return this.toAdoptionDtoOptimized(adoptionEntity);
    });
  }

  async findByAdoptionId(adoptionId: string): Promise<AdoptionDto> {
    const adoption = await this.findOne({ adoptionId: adoptionId });

    if (!adoption) {
      throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
    }

    return adoption;
  }

  async updateAdoption(
    adoptionId: string,
    updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<{ adoptionId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const adoptionEntity = await entityManager.findOne(AdoptionEntity, {
        where: { adoptionId: adoptionId, isDeleted: false },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      if (updateAdoptionDto.buyerId) {
        const buyer = await this.userService.findOne({
          userId: updateAdoptionDto.buyerId,
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const fieldMappings: Partial<
        Record<keyof UpdateAdoptionDto, (value: any) => Partial<AdoptionEntity>>
      > = {
        adoptionDate: (value: Date) => ({ adoptionDate: new Date(value) }),
        price: (value: number) => ({ price: value }),
        buyerId: (value: string) => ({ buyerId: value }),
        memo: (value: string) => ({ memo: value }),
        location: (value: PET_ADOPTION_LOCATION) => ({ location: value }),
        status: (value: ADOPTION_SALE_STATUS) => ({ status: value }),
      };

      this.updateEntityFields(adoptionEntity, updateAdoptionDto, fieldMappings);

      await entityManager.save(AdoptionEntity, adoptionEntity);

      await this.updatePetStatus(
        entityManager,
        adoptionEntity.petId,
        updateAdoptionDto,
      );

      return { adoptionId };
    });
  }
}
