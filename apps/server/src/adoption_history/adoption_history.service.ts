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
  UpdateAdoptionHistoryDto,
  PetSnapshotData,
  PetAdoptionCompletedDto,
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
import {
  extractOriginalPetName,
  resolveUniqueNameForOwner,
} from '../common/utils/pet-name.helper';
import { PetAdoptionEntity } from '../pet_adoption/pet_adoption.entity';
import { PetEntity } from '../pet/pet.entity';
import { PetDetailEntity } from '../pet_detail/pet_detail.entity';
import { UserEntity } from '../user/user.entity';
import { PARENT_STATUS } from '../parent_request/parent_request.constants';
import { CacheService } from '../common/cache.service';
import { CACHE } from '../common/cache-keys';
import { UserNotificationService } from '../user_notification/user_notification.service';
import { CreateUserNotificationDto } from '../user_notification/user_notification.dto';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';
import { UserNotificationEntity } from '../user_notification/user_notification.entity';

@Injectable()
export class AdoptionHistoryService {
  constructor(
    @InjectRepository(AdoptionHistoryEntity)
    private readonly adoptionHistoryRepository: Repository<AdoptionHistoryEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly userNotificationService: UserNotificationService,
  ) {}

  private toAdoptionHistoryDto(
    entity: AdoptionHistoryEntity,
  ): AdoptionHistoryDto {
    const { seller, buyer, petSnapshot } = entity;

    return {
      id: entity.id,
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
            hatchingDate: petSnapshot.hatchingDate,
            isDeleted: petSnapshot.isDeleted,
            father: petSnapshot.father ?? undefined,
            mother: petSnapshot.mother ?? undefined,
          }
        : ({} as PetAdoptionCompletedDto),
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
        `JSON_UNQUOTE(JSON_EXTRACT(histories.petSnapshot, '$.name')) LIKE :keyword`,
        { keyword: `%${pageOptionsDto.keyword}%` },
      );
    }

    // 종 필터링
    if (pageOptionsDto.species) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.petSnapshot, '$.species')) = :species`,
        { species: pageOptionsDto.species },
      );
    }

    // 모프 필터링
    if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
      const morphsJson = JSON.stringify(pageOptionsDto.morphs);
      queryBuilder.andWhere(
        `JSON_OVERLAPS(JSON_EXTRACT(histories.petSnapshot, '$.morphs'), :morphs)`,
        { morphs: morphsJson },
      );
    }

    // 형질 필터링
    if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
      const traitsJson = JSON.stringify(pageOptionsDto.traits);
      queryBuilder.andWhere(
        `JSON_OVERLAPS(JSON_EXTRACT(histories.petSnapshot, '$.traits'), :traits)`,
        { traits: traitsJson },
      );
    }

    // 성별 필터링
    if (pageOptionsDto.sex && pageOptionsDto.sex.length > 0) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.petSnapshot, '$.sex')) IN (:...sex)`,
        { sex: pageOptionsDto.sex },
      );
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth && pageOptionsDto.growth.length > 0) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.petSnapshot, '$.growth')) IN (:...growth)`,
        { growth: pageOptionsDto.growth },
      );
    }

    // 분양 방식 필터링
    if (pageOptionsDto.method && pageOptionsDto.method.length > 0) {
      queryBuilder.andWhere('histories.method IN (:...method)', {
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
        `JSON_UNQUOTE(JSON_EXTRACT(histories.petSnapshot, '$.father.petId')) = :fatherId`,
        { fatherId: pageOptionsDto.fatherId },
      );
    }

    // 모 개체 필터링
    if (pageOptionsDto.motherId) {
      queryBuilder.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(histories.petSnapshot, '$.mother.petId')) = :motherId`,
        { motherId: pageOptionsDto.motherId },
      );
    }
  }

  async completeAdoption(
    petId: string,
    completeAdoptionDto: CompleteAdoptionDto,
    userId: string,
  ): Promise<void> {
    const savedNotification = await this.dataSource.transaction(
      async (em: EntityManager) => {
        // 1. 기존 분양 정보 조회
        const adoptionEntity = await em.findOne(PetAdoptionEntity, {
          where: { petId },
        });

        if (!adoptionEntity) {
          throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
        }

        // 2. 펫 정보 조회 및 소유자 확인
        const pet = await em.findOne(PetEntity, {
          where: { petId },
          select: [
            'petId',
            'ownerId',
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

        if (pet.ownerId !== userId) {
          throw new ForbiddenException('분양 정보의 소유자가 아닙니다.');
        }

        // 3. 입양자가 있는 경우 존재 확인
        const finalBuyerId = completeAdoptionDto.buyerId ?? null;

        if (finalBuyerId) {
          const buyer = await em.findOne(UserEntity, {
            where: { userId: finalBuyerId },
          });
          if (!buyer) {
            throw new NotFoundException('입양자를 찾을 수 없습니다.');
          }
        }

        // 4. 판매자(현 소유주) 이름 조회 (알림용)
        const seller = await em.findOne(UserEntity, {
          where: { userId: pet.ownerId },
          select: ['userId', 'name'],
        });

        // 5. 부모 요청 확인
        const pendingCount =
          await this.parentRequestService.getPendingRequestCount(petId, em);
        if (pendingCount > 0) {
          throw new BadRequestException(
            `이 펫과 관련된 부모 요청(${pendingCount}건)을 모두 처리한 후 다시 시도해주세요.`,
          );
        }

        // 5. 펫 스냅샷 생성
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
          hatchingDate: pet.hatchingDate?.toString() ?? undefined,
          isDeleted: pet.isDeleted || undefined,
          father: father ? { petId: father.petId, name: father.name } : null,
          mother: mother ? { petId: mother.petId, name: mother.name } : null,
        };

        // 6. adoption_histories에 INSERT
        const historyEntity = new AdoptionHistoryEntity();
        Object.assign(historyEntity, {
          petId,
          sellerId: pet.ownerId,
          adoptionDate: completeAdoptionDto.adoptionDate,
          buyerId: finalBuyerId,
          price: completeAdoptionDto.price,
          method: completeAdoptionDto.method,
          memo: completeAdoptionDto.memo,
          petSnapshot,
        });
        await em.save(AdoptionHistoryEntity, historyEntity);

        // 7. pet_adoption 리셋
        adoptionEntity.status = null;
        adoptionEntity.price = null;
        adoptionEntity.memo = null;
        adoptionEntity.reservedUserId = null;
        await em.save(PetAdoptionEntity, adoptionEntity);

        // 8. 펫 소유권 이전 + 이전 소유주 개인화 필드 초기화
        // - isPublic: false — 매수인이 의도적으로 공개를 선택하지 않은 상태에서 자동 공개/한도 우회 방지
        // - desc: null — 이전 소유주의 소개말(개인 메모 성격)
        // - isBreeder: false — 브리더 지정은 매수인이 직접 결정할 사안
        // - name: 매수인의 기존 펫과 이름 충돌 시 자동 접미사 부여 (UNIQUE_OWNER_PET_NAME 제약 대응)
        const transferName =
          finalBuyerId && petName
            ? await resolveUniqueNameForOwner(petName, finalBuyerId, em)
            : petName;

        await em.update(
          'pets',
          { petId },
          {
            ownerId: finalBuyerId ?? null,
            name: transferName,
            isPublic: false,
            desc: null,
            isBreeder: false,
          },
        );

        // 9. 매수인에게 분양 완료 알림 생성 (트랜잭션 내)
        let savedNotification: UserNotificationEntity | null = null;
        if (finalBuyerId) {
          const notificationDto: CreateUserNotificationDto = {
            receiverId: finalBuyerId,
            type: USER_NOTIFICATION_TYPE.ADOPTION_COMPLETE,
            detailJson: {
              seller: { id: pet.ownerId, name: seller?.name },
              primaryPet: {
                id: petId,
                name: petName,
              },
              adoptionDate: completeAdoptionDto.adoptionDate ?? null,
              price: completeAdoptionDto.price ?? null,
              method: completeAdoptionDto.method ?? null,
            },
          };
          savedNotification =
            await this.userNotificationService.createUserNotification(
              em,
              pet.ownerId,
              notificationDto,
            );
        }

        return savedNotification;
      },
    );

    // 10. 캐시 무효화 (트랜잭션 커밋 후)
    await Promise.all([
      this.cacheService.del(CACHE.pet.key(petId)),
      this.cacheService.del(CACHE.petAdoption.key(petId)),
    ]);

    // 11. 푸시 알림 발송 (트랜잭션 커밋 후)
    if (savedNotification) {
      this.userNotificationService.sendPushNotificationForNotification(
        savedNotification,
      );
    }
  }

  /** 수정 가능한 필드 목록 */
  private static readonly UPDATABLE_FIELDS: (keyof UpdateAdoptionHistoryDto)[] =
    ['memo'];

  async update(
    id: number,
    dto: UpdateAdoptionHistoryDto,
    userId: string,
  ): Promise<void> {
    const history = await this.adoptionHistoryRepository.findOne({
      where: { id },
    });

    if (!history) {
      throw new NotFoundException('분양 이력을 찾을 수 없습니다.');
    }

    if (history.sellerId !== userId) {
      throw new ForbiddenException('분양 이력의 소유자가 아닙니다.');
    }

    for (const field of AdoptionHistoryService.UPDATABLE_FIELDS) {
      if (field in dto) {
        history[field] = dto[field] ?? null;
      }
    }

    await this.adoptionHistoryRepository.save(history);
  }
}
