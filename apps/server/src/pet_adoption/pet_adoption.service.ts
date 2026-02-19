import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, DataSource, Repository } from 'typeorm';
import { PetAdoptionEntity } from './pet_adoption.entity';
import {
  AdoptionDto,
  CreateAdoptionDto,
  UpdateAdoptionDto,
} from './pet_adoption.dto';
import { PET_ADOPTION_STATUS } from 'src/pet/pet.constants';
import { isNil, isUndefined, omitBy } from 'es-toolkit';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_STATUS } from 'src/user/user.constant';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { replaceParentPublicSafe } from '../common/utils/pet-parent.helper';
import { extractOriginalPetName } from '../common/utils/pet-name.helper';

@Injectable()
export class PetAdoptionService {
  constructor(
    @InjectRepository(PetAdoptionEntity)
    private readonly petAdoptionRepository: Repository<PetAdoptionEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly dataSource: DataSource,
  ) {}

  private async toAdoptionDtoOptimized(
    entity: PetAdoptionEntity,
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

  private createPetAdoptionQueryBuilder() {
    return this.petAdoptionRepository
      .createQueryBuilder('pet_adoptions')
      .innerJoinAndMapOne(
        'pet_adoptions.pet',
        'pets',
        'pets',
        'pets.petId = pet_adoptions.petId',
      )
      .innerJoinAndMapOne(
        'pet_adoptions.petDetail',
        'pet_details',
        'pet_details',
        'pet_details.petId = pets.petId',
      )
      .leftJoinAndMapOne(
        'pet_adoptions.seller',
        'users',
        'seller',
        'seller.userId = pet_adoptions.sellerId',
      )
      .leftJoinAndMapOne(
        'pet_adoptions.buyer',
        'users',
        'buyer',
        'buyer.userId = pet_adoptions.buyerId',
      )
      .select([
        'pet_adoptions.id',
        'pet_adoptions.petId',
        'pet_adoptions.price',
        'pet_adoptions.memo',
        'pet_adoptions.status',
        'pet_adoptions.createdAt',
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

  async findOne(petId: string, userId?: string): Promise<AdoptionDto | null> {
    const qb = this.createPetAdoptionQueryBuilder().where(
      'pet_adoptions.petId = :petId',
      { petId },
    );

    const adoptionEntity = await qb.getOne();
    if (!adoptionEntity) {
      return null;
    }

    return await this.toAdoptionDtoOptimized(adoptionEntity, userId);
  }

  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
    entityManager?: EntityManager,
  ): Promise<void> {
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

      // 이미 분양 정보가 있는지 확인 (petId UNIQUE이므로 중복 방지)
      const existing = await em.findOne(PetAdoptionEntity, {
        where: { petId: createAdoptionDto.petId },
      });

      if (existing) {
        throw new BadRequestException('이미 분양 정보가 있습니다.');
      }

      const adoptionEntity = new PetAdoptionEntity();
      Object.assign(adoptionEntity, {
        petId: createAdoptionDto.petId,
        sellerId,
        status: createAdoptionDto.status ?? null,
        price: createAdoptionDto.price,
        memo: createAdoptionDto.memo,
      });

      await em.save(PetAdoptionEntity, adoptionEntity);
    };

    if (entityManager) {
      return await run(entityManager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return await run(entityManager);
    });
  }

  async updateAdoption(
    petId: string,
    updateAdoptionDto: UpdateAdoptionDto,
    entityManager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      // 1. 기존 분양 정보 조회
      const adoptionEntity = await em.findOne(PetAdoptionEntity, {
        where: { petId },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      // 입양자 검증
      if (updateAdoptionDto.buyerId !== undefined) {
        const finalStatus = updateAdoptionDto.status ?? adoptionEntity.status;
        const isReservation =
          finalStatus === PET_ADOPTION_STATUS.ON_RESERVATION;

        if (!isReservation) {
          throw new BadRequestException(
            '예약중 상태일 때만 입양자 정보를 입력할 수 있습니다.',
          );
        }

        if (updateAdoptionDto.buyerId) {
          const buyer = await em.findOne(UserEntity, {
            where: { userId: updateAdoptionDto.buyerId },
          });
          if (!buyer) {
            throw new NotFoundException('입양자를 찾을 수 없습니다.');
          }
        }
      }

      // pet_adoptions 업데이트
      const updateData = omitBy(
        {
          price: updateAdoptionDto.price,
          memo: updateAdoptionDto.memo,
          buyerId: updateAdoptionDto.buyerId,
          status: updateAdoptionDto.status,
        },
        isUndefined,
      );

      Object.assign(adoptionEntity, updateData);
      await em.save(PetAdoptionEntity, adoptionEntity);
    };

    return entityManager
      ? run(entityManager)
      : this.dataSource.transaction(run);
  }
}
