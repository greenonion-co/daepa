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
import { isNil, omitBy } from 'es-toolkit';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_STATUS } from 'src/user/user.constant';

@Injectable()
export class AdoptionService {
  constructor(
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
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
    newOwnerId?: string,
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
        'adoptions.location',
        'adoptions.status',
        'adoptions.createdAt',
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
  }

  async findOne(where: FindOptionsWhere<AdoptionEntity>): Promise<AdoptionDto> {
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
      throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
    }

    return this.toAdoptionDtoOptimized(adoptionEntity);
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

    qb.orderBy('adoptions.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const [adoptionEntities, totalCount] = await qb.getManyAndCount();

    const adoptionDtos = adoptionEntities.map((entity) =>
      this.toAdoptionDtoOptimized(entity),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(adoptionDtos, pageMetaDto);
  }

  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
  ): Promise<{ adoptionId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 확인
      const pet = await entityManager.findOne(PetEntity, {
        where: { petId: createAdoptionDto.petId, isDeleted: false },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }
      if (pet.ownerId !== sellerId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 이미 분양 정보가 있는지 확인
      const existingAdoption = await entityManager.existsBy(AdoptionEntity, {
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

        const buyer = await entityManager.findOne(UserEntity, {
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

      await entityManager.save(AdoptionEntity, adoptionEntity);

      if (createAdoptionDto.status === ADOPTION_SALE_STATUS.SOLD) {
        await this.updatePetOwner(
          entityManager,
          createAdoptionDto.petId,
          createAdoptionDto.buyerId,
        );
      }

      return { adoptionId };
    });
  }

  async updateAdoption(
    adoptionId: string,
    updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<{ adoptionId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const adoptionEntity = await entityManager.findOne(AdoptionEntity, {
        where: {
          adoptionId,
          isDeleted: false,
        },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      if (updateAdoptionDto.buyerId) {
        const buyer = await entityManager.findOne(UserEntity, {
          where: { userId: updateAdoptionDto.buyerId },
        });

        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const newAdoptionEntity = new AdoptionEntity();
      Object.assign(newAdoptionEntity, {
        ...adoptionEntity,
        ...updateAdoptionDto,
        buyerId: updateAdoptionDto.buyerId ?? null,
        isActive:
          updateAdoptionDto.status === ADOPTION_SALE_STATUS.SOLD ? false : true,
      });

      await entityManager.save(AdoptionEntity, newAdoptionEntity);

      if (updateAdoptionDto.status === ADOPTION_SALE_STATUS.SOLD) {
        await this.updatePetOwner(
          entityManager,
          adoptionEntity.petId,
          updateAdoptionDto.buyerId,
        );
      }

      return { adoptionId };
    });
  }

  async findByAdoptionId(adoptionId: string): Promise<AdoptionDto> {
    const adoption = await this.findOne({ adoptionId: adoptionId });

    if (!adoption) {
      throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
    }

    return adoption;
  }
}
