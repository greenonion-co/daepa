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
import { CacheService } from '../common/cache.service';
import { CACHE } from '../common/cache-keys';

@Injectable()
export class PetAdoptionService {
  constructor(
    @InjectRepository(PetAdoptionEntity)
    private readonly petAdoptionRepository: Repository<PetAdoptionEntity>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async findOne(petId: string): Promise<AdoptionDto | null> {
    const cached = await this.cacheService.wrap(
      CACHE.petAdoption.key(petId),
      async () => {
        const adoptionEntity = await this.petAdoptionRepository.findOne({
          where: { petId },
          select: [
            'id',
            'petId',
            'price',
            'memo',
            'status',
            'reservedUserId',
            'createdAt',
          ],
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
          reservedUserId: adoptionEntity.reservedUserId ?? undefined,
        };
      },
      CACHE.petAdoption.ttl,
    );

    if (!cached) {
      return null;
    }

    // reservedUser는 캐시 밖에서 fresh 조회
    let reservedUser: AdoptionDto['reservedUser'] = null;
    if (cached.reservedUserId) {
      const user = await this.dataSource.getRepository(UserEntity).findOne({
        where: { userId: cached.reservedUserId },
        select: ['userId', 'name', 'role', 'isBiz', 'status'],
      });
      if (user) {
        reservedUser = {
          userId: user.userId,
          name: user.name,
          role: user.role,
          isBiz: user.isBiz,
          status: user.status,
        };
      }
    }

    return {
      petId: cached.petId,
      status: cached.status,
      price: cached.price,
      memo: cached.memo,
      createdAt: cached.createdAt,
      reservedUser,
    } as AdoptionDto;
  }

  async createAdoption(
    userId: string,
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
      if (pet.ownerId !== userId) {
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
        status: createAdoptionDto.status ?? null,
        price: createAdoptionDto.price,
        memo: createAdoptionDto.memo,
      });

      await em.save(PetAdoptionEntity, adoptionEntity);
    };

    if (entityManager) {
      // 외부 트랜잭션: 호출자가 캐시 무효화 책임
      return await run(entityManager);
    }

    await this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });

    // NULL_SENTINEL 캐시 무효화 (findOne에서 null이 캐싱된 경우)
    await this.cacheService.del(CACHE.petAdoption.key(createAdoptionDto.petId));
  }

  async updateAdoption(
    petId: string,
    updateAdoptionDto: UpdateAdoptionDto,
    userId?: string,
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
      if (userId) {
        const pet = await em.findOne(PetEntity, {
          where: { petId },
          select: ['ownerId'],
        });
        if (!pet || pet.ownerId !== userId) {
          throw new ForbiddenException(
            '펫의 소유자만 분양 정보를 수정할 수 있습니다.',
          );
        }
      }

      // 최종 상태 결정
      const finalStatus = updateAdoptionDto.status ?? adoptionEntity.status;
      const isReservation = finalStatus === PET_ADOPTION_STATUS.ON_RESERVATION;

      // 입양자 검증
      if (updateAdoptionDto.reservedUserId !== undefined) {
        if (updateAdoptionDto.reservedUserId === null) {
          adoptionEntity.reservedUserId = null;
        } else {
          if (!isReservation) {
            throw new BadRequestException(
              '예약중 상태일 때만 입양자 정보를 입력할 수 있습니다.',
            );
          }
          const buyer = await em.findOne(UserEntity, {
            where: { userId: updateAdoptionDto.reservedUserId },
          });
          if (!buyer) {
            throw new NotFoundException('입양자를 찾을 수 없습니다.');
          }
        }
      }

      // 예약 중이 아닌 상태로 변경 시 reservedUserId 자동 초기화
      if (!isReservation && adoptionEntity.reservedUserId) {
        adoptionEntity.reservedUserId = null;
      }

      // pet_adoptions 업데이트
      const updateData = omitBy(
        {
          price: updateAdoptionDto.price,
          memo: updateAdoptionDto.memo,
          reservedUserId: updateAdoptionDto.reservedUserId,
          status: updateAdoptionDto.status,
        },
        isUndefined,
      );

      Object.assign(adoptionEntity, updateData);
      await em.save(PetAdoptionEntity, adoptionEntity);
    };

    if (entityManager) {
      // 외부 트랜잭션: 호출자가 캐시 무효화 책임
      return run(entityManager);
    }

    await this.dataSource.transaction(run);
    await this.cacheService.del(CACHE.petAdoption.key(petId));
  }
}
