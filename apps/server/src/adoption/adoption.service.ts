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
import { isNil, omitBy } from 'es-toolkit';

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

    const { pet, petDetail, seller, buyer, ...adoptionData } = entity;
    return {
      ...adoptionData,
      seller,
      buyer,
      pet: {
        petId: pet.petId,
        type: pet.type,
        species: pet.species,
        ...omitBy(
          {
            name: pet.name ?? undefined,
            hatchingDate: pet.hatchingDate ?? undefined,
            sex: petDetail?.sex ?? undefined,
            morphs: petDetail?.morphs ?? undefined,
            traits: petDetail?.traits ?? undefined,
          },
          isNil,
        ),
      },
    };
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
        const qb = entityManager
          .createQueryBuilder(AdoptionEntity, 'adoptions')
          .leftJoinAndMapOne(
            'adoptions.pet',
            'pets',
            'pets',
            'pets.petId = adoptions.petId',
          )
          .leftJoinAndMapOne(
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
          .where('adoptions.isDeleted = :isDeleted', { isDeleted: false })
          .andWhere('adoptions.sellerId = :userId', { userId })
          .orderBy('adoptions.createdAt', pageOptionsDto.order);

        if (pageOptionsDto.keyword) {
          qb.andWhere('pets.name LIKE :keyword', {
            keyword: `%${pageOptionsDto.keyword}%`,
          });
        }

        if (pageOptionsDto.species) {
          qb.andWhere('pets.species = :species', {
            species: pageOptionsDto.species,
          });
        }

        if (pageOptionsDto.status) {
          qb.andWhere('adoptions.status = :status', {
            status: pageOptionsDto.status,
          });
        }

        qb.skip(pageOptionsDto.skip).take(pageOptionsDto.itemPerPage);

        return qb.getManyAndCount();
      },
    );

    const adoptionDtos = adoptionEntities.map((entity) =>
      this.toAdoptionDtoOptimized(entity),
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
          'pets.type',
          'pets.name',
          'pets.species',
          'pets.hatchingDate',
          'pet_details.sex',
          'pet_details.morphs',
          'pet_details.traits',
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
