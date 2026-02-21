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
import { isUndefined, omitBy } from 'es-toolkit';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PetAdoptionService {
  constructor(
    @InjectRepository(PetAdoptionEntity)
    private readonly petAdoptionRepository: Repository<PetAdoptionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(petId: string): Promise<AdoptionDto | null> {
    const adoptionEntity = await this.petAdoptionRepository.findOne({
      where: { petId },
      select: ['id', 'petId', 'price', 'memo', 'status', 'createdAt'],
    });

    if (!adoptionEntity) {
      return null;
    }

    return {
      petId: adoptionEntity.petId,
      status: adoptionEntity.status,
      price: adoptionEntity.price ?? undefined,
      memo: adoptionEntity.memo ?? undefined,
      createdAt: adoptionEntity.createdAt,
    };
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
    sellerId?: string,
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

      // 2. 요청자 소유 펫인지 확인
      if (sellerId && adoptionEntity.sellerId !== sellerId) {
        throw new ForbiddenException(
          '펫의 소유자만 분양 정보를 수정할 수 있습니다.',
        );
      }

      // 입양자 검증
      if (updateAdoptionDto.buyerId !== undefined) {
        if (updateAdoptionDto.buyerId === null) {
          adoptionEntity.buyerId = null;
        } else {
          const finalStatus = updateAdoptionDto.status ?? adoptionEntity.status;
          const isReservation =
            finalStatus === PET_ADOPTION_STATUS.ON_RESERVATION;

          if (!isReservation) {
            throw new BadRequestException(
              '예약중 상태일 때만 입양자 정보를 입력할 수 있습니다.',
            );
          }

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
