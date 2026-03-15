import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager, DataSource, In } from 'typeorm';
import { ParentRequestEntity } from './parent_request.entity';
import {
  CreateParentDto,
  UnlinkParentDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';
import { PetEntity } from '../pet/pet.entity';
import { PET_SEX, PET_TYPE } from '../pet/pet.constants';
import { UserNotificationService } from '../user_notification/user_notification.service';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';
import { PetParentDto } from 'src/pet/pet.dto';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { UserEntity } from 'src/user/user.entity';
import { UserNotificationEntity } from 'src/user_notification/user_notification.entity';
import { CreateUserNotificationDto } from 'src/user_notification/user_notification.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { plainToInstance } from 'class-transformer';
import { PetRelationService } from '../pet_relation/pet_relation.service';
import { PetRelationEntity } from '../pet_relation/pet_relation.entity';
import { CacheService } from '../common/cache.service';
import { CACHE } from '../common/cache-keys';
import { loadPetData } from '../pet/pet.loader';

@Injectable()
export class ParentRequestService {
  constructor(
    private readonly userNotificationService: UserNotificationService,
    private readonly petRelationService: PetRelationService,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async linkParent(
    childPetId: string,
    userId: string,
    createParentDto: CreateParentDto,
    manager?: EntityManager,
  ) {
    const run = async (entityManager: EntityManager) => {
      const { parentId, role, message } = createParentDto;
      // 펫 존재 여부 및 소유권 확인
      const { childPet, parentPet } = await this.getPetInfo(
        entityManager,
        childPetId,
        parentId,
      );
      if (!childPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }
      if (!parentPet) {
        throw new NotFoundException('부모로 지정된 펫을 찾을 수 없습니다.');
      }
      if (childPet.petId === parentPet.petId) {
        throw new BadRequestException('자기 자신을 부모로 지정할 수 없습니다.');
      }
      if (!parentPet.ownerId || !childPet.ownerId) {
        throw new NotFoundException('주인 정보를 찾을 수 없습니다.');
      }
      if (childPet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }
      if (parentPet.type === PET_TYPE.EGG) {
        throw new BadRequestException('알은 부모로 지정할 수 없습니다.');
      }
      if (
        role === PARENT_ROLE.FATHER &&
        parentPet.petDetail?.sex !== PET_SEX.MALE
      ) {
        throw new BadRequestException(
          '아버지로 지정된 펫은 수컷이어야 합니다.',
        );
      }
      if (
        role === PARENT_ROLE.MOTHER &&
        parentPet.petDetail?.sex !== PET_SEX.FEMALE
      ) {
        throw new BadRequestException(
          '어머니로 지정된 펫은 암컷이어야 합니다.',
        );
      }
      const isMyChild = await entityManager.exists(ParentRequestEntity, {
        where: {
          childPetId: parentPet.petId,
          parentPetId: childPetId,
          status: PARENT_STATUS.APPROVED,
        },
      });
      if (isMyChild) {
        throw new BadRequestException(
          '자식 관계의 펫을 부모로 지정할 수 없습니다.',
        );
      }

      // TODO!: 페어가 삭제된 경우에 대한 처리가 필요. IsDeleted를 추가하고 체크해야함
      const isPair = await entityManager.exists(PairEntity, {
        where: {
          ownerId: childPet.ownerId,
          fatherId:
            parentPet.petDetail?.sex === PET_SEX.MALE
              ? parentPet.petId
              : childPetId,
          motherId:
            parentPet.petDetail?.sex === PET_SEX.FEMALE
              ? parentPet.petId
              : childPetId,
        },
      });
      if (isPair) {
        throw new BadRequestException(
          '개체의 페어를 부모로 지정할 수 없습니다.',
        );
      }

      // 기존 부모 요청 확인
      const existingRequest = await entityManager
        .createQueryBuilder(ParentRequestEntity, 'parentRequest')
        .setLock('pessimistic_write')
        .where({
          childPetId,
          role,
          status: In([PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED]),
        })
        .getOne();
      if (existingRequest) {
        throw new ConflictException('이미 존재하는 부모 연동 요청입니다.');
      }

      const isParentMyPet = userId === parentPet.ownerId;
      // 부모 관계 생성
      const parentRequest = await entityManager.save(ParentRequestEntity, {
        childPetId,
        parentPetId: parentId,
        role,
        message,
        status: isParentMyPet ? PARENT_STATUS.APPROVED : PARENT_STATUS.PENDING,
      });

      // isParentMyPet인 경우는 연동상태가 즉시 확정이기 때문에 pet_relation에 펫-부모 정보를 업데이트한다.
      if (isParentMyPet) {
        await this.petRelationService.upsertParentRelation(
          childPetId,
          role,
          parentId,
          entityManager,
        );
      }

      // 내 펫이 아닌 경우 요청 알림 생성
      if (!isParentMyPet) {
        try {
          const notification =
            await this.userNotificationService.createUserNotification(
              entityManager,
              childPet.ownerId,
              {
                receiverId: parentPet.ownerId,
                type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
                targetId: parentRequest.id,
                detailJson: {
                  status: PARENT_STATUS.PENDING,
                  childPet: {
                    id: childPet?.petId ?? '',
                    name: childPet.name ?? undefined,
                  },
                  parentPet: {
                    id: parentPet?.petId ?? '',
                    name: parentPet.name ?? undefined,
                  },
                  role,
                  message,
                },
              },
            );
          return { notification, parentLinked: false };
        } catch (error: unknown) {
          const err = error as Partial<{ code: string }>;

          if (err && err.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('동일한 알림이 이미 존재합니다.');
          }
          throw new InternalServerErrorException('알림 생성에 실패했습니다.');
        }
      }
      return { notification: null, parentLinked: isParentMyPet };
    };

    if (manager) {
      // 외부 트랜잭션 사용 시 호출부에서 푸시 발송 및 캐시 무효화 처리 필요
      await run(manager);
      return;
    }

    const result = await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        return await run(entityManager);
      },
    );

    // 트랜잭션 커밋 후 푸시 알림 발송
    if (result?.notification) {
      this.userNotificationService.sendPushNotificationForNotification(
        result.notification,
      );
    }

    // 트랜잭션 커밋 후 캐시 무효화 (즉시 확정된 부모 관계)
    if (result?.parentLinked) {
      await this.invalidateRelationCaches(childPetId, createParentDto.parentId);
    }
  }

  async unlinkParent(
    petId: string,
    userId: string,
    unlinkParentDto: UnlinkParentDto,
  ) {
    const { role } = unlinkParentDto;
    const result = await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        // 펫 존재 여부 및 소유권 확인
        const pet = await entityManager.findOne(PetEntity, {
          where: { petId, isDeleted: false },
        });
        if (!pet) {
          throw new NotFoundException('펫을 찾을 수 없습니다.');
        }
        if (pet.ownerId !== userId) {
          throw new ForbiddenException('펫의 소유자가 아닙니다.');
        }

        // 해당 role의 부모 관계 찾기
        const parentRequest = await entityManager.findOne(ParentRequestEntity, {
          where: {
            childPetId: petId,
            role,
            status: In([PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED]),
          },
        });

        if (!parentRequest) {
          throw new NotFoundException('해당 부모 관계를 찾을 수 없습니다.');
        }

        if (parentRequest.status === PARENT_STATUS.PENDING) {
          const { childPet, parentPet } = await this.getPetInfo(
            entityManager,
            parentRequest.childPetId,
            parentRequest.parentPetId,
          );

          if (!childPet?.ownerId || !parentPet?.ownerId) {
            throw new NotFoundException('주인 정보를 찾을 수 없습니다.');
          }

          await entityManager
            .createQueryBuilder()
            .update(UserNotificationEntity)
            .set({
              detailJson: () => `JSON_SET(detailJson, '$.status', :status)`,
            })
            .setParameter('status', PARENT_STATUS.CANCELLED)
            .where({
              senderId: childPet.ownerId,
              receiverId: parentPet.ownerId,
              type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
              targetId: parentRequest.id,
            })
            .execute();

          // 부모 요청 상태를 CANCELLED로 업데이트
          await entityManager.update(
            ParentRequestEntity,
            { id: parentRequest.id },
            {
              status: PARENT_STATUS.CANCELLED,
            },
          );

          try {
            const notification =
              await this.userNotificationService.createUserNotification(
                entityManager,
                childPet.ownerId,
                {
                  receiverId: parentPet.ownerId,
                  type: USER_NOTIFICATION_TYPE.PARENT_CANCEL,
                  targetId: parentRequest.id,
                  detailJson: {
                    status: PARENT_STATUS.CANCELLED,
                    childPet: {
                      id: parentRequest.childPetId,
                      name: childPet?.name ?? undefined,
                    },
                    parentPet: {
                      id: parentRequest.parentPetId,
                      name: parentPet?.name ?? undefined,
                    },
                    role: parentRequest.role,
                    message: '부모 요청이 취소되었습니다.',
                  },
                },
              );
            return { notification, parentUnlinked: false };
          } catch (error: unknown) {
            const err = error as { code?: string };
            if (err?.code === 'ER_DUP_ENTRY') {
              throw new ConflictException(
                '동일한 취소 알림이 이미 존재합니다.',
              );
            }
            throw new InternalServerErrorException(
              '취소 알림 생성에 실패했습니다.',
            );
          }
        }

        // APPROVED 상태였던 부모 관계를 해제하는 경우 pet_relations 업데이트
        const parentUnlinked = parentRequest.status === PARENT_STATUS.APPROVED;
        if (parentUnlinked) {
          await this.petRelationService.removeParentRelation(
            petId,
            role,
            entityManager,
          );
        }

        await entityManager.update(
          ParentRequestEntity,
          { id: parentRequest.id },
          {
            status: PARENT_STATUS.CANCELLED,
          },
        );
        return {
          notification: null,
          parentUnlinked,
          parentPetId: parentRequest.parentPetId,
        };
      },
    );

    // 트랜잭션 커밋 후 푸시 알림 발송
    if (result?.notification) {
      this.userNotificationService.sendPushNotificationForNotification(
        result.notification,
      );
    }

    // 트랜잭션 커밋 후 캐시 무효화 (해제된 부모 관계)
    if (result?.parentUnlinked && result.parentPetId) {
      await this.invalidateRelationCaches(petId, result.parentPetId);
    }
  }

  async updateParentRequestByNotificationId(
    userId: string,
    notificationId: number,
    updateParentRequestDto: UpdateParentRequestDto,
  ) {
    // 삭제된 펫으로 인한 취소 메시지를 트랜잭션 외부에서 throw하기 위한 변수
    let cancelledByDeletedPetReason: string | null = null;

    const result = await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        const existingNotification = await entityManager.findOneBy(
          UserNotificationEntity,
          {
            id: notificationId,
            receiverId: userId,
            isDeleted: false,
            type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
          },
        );

        if (!existingNotification) {
          throw new NotFoundException('알림을 찾을 수 없습니다.');
        }

        const parentRequest = await entityManager.findOneBy(
          ParentRequestEntity,
          {
            id: existingNotification.targetId,
          },
        );

        if (!parentRequest) {
          throw new NotFoundException('부모 요청을 찾을 수 없습니다.');
        }

        //parentRequest의 상태가 pending이 아니면 오류 발생
        if (parentRequest.status === updateParentRequestDto.status) {
          throw new BadRequestException('유효한 요청이 아닙니다.');
        }
        if (parentRequest.status === PARENT_STATUS.APPROVED) {
          throw new BadRequestException('이미 수락된 처리된 요청입니다.');
        }
        if (parentRequest.status === PARENT_STATUS.REJECTED) {
          throw new BadRequestException('이미 거절된 요청입니다.');
        }
        if (parentRequest.status === PARENT_STATUS.CANCELLED) {
          throw new BadRequestException('이미 취소된 요청입니다.');
        }

        // 펫 정보 조회 (삭제 여부 포함, isDeleted 필터 없이 조회하여 삭제된 펫도 감지)
        const [childPet, parentPet] = await Promise.all([
          entityManager.findOne(PetEntity, {
            where: { petId: parentRequest.childPetId },
            select: ['name', 'petId', 'ownerId', 'isDeleted'],
          }),
          entityManager
            .createQueryBuilder(PetEntity, 'pet')
            .innerJoinAndMapOne(
              'pet.petDetail',
              PetDetailEntity,
              'petDetail',
              'petDetail.petId = pet.petId',
            )
            .select([
              'pet.type',
              'pet.name',
              'pet.petId',
              'pet.ownerId',
              'pet.isDeleted',
              'petDetail.sex',
            ])
            .where('pet.petId = :parentPetId', {
              parentPetId: parentRequest.parentPetId,
            })
            .getOne(),
        ]);

        const isChildPetDeleted = !childPet || childPet.isDeleted;
        const isParentPetDeleted = !parentPet || parentPet.isDeleted;

        // 삭제된 펫이 있으면 요청 자동 취소 (트랜잭션 내에서 업데이트 후 커밋)
        if (isChildPetDeleted || isParentPetDeleted) {
          await entityManager.update(
            ParentRequestEntity,
            { id: parentRequest.id },
            { status: PARENT_STATUS.CANCELLED },
          );

          const deletedPetType = isChildPetDeleted ? '자식' : '부모';
          cancelledByDeletedPetReason = `삭제된 펫(${deletedPetType})이 포함되어, 요청이 취소되었습니다.`;

          await entityManager.update(
            UserNotificationEntity,
            { id: existingNotification.id },
            {
              detailJson: {
                ...existingNotification.detailJson,
                message: cancelledByDeletedPetReason,
                status: PARENT_STATUS.CANCELLED,
              },
            },
          );

          // 트랜잭션 정상 종료 (커밋) 후 외부에서 예외 throw
          return;
        }

        if (!parentPet.ownerId || !childPet.ownerId) {
          throw new NotFoundException('주인 정보를 찾을 수 없습니다.');
        }

        // 부모 요청 상태 업데이트
        await entityManager.update(
          ParentRequestEntity,
          { id: parentRequest.id },
          updateParentRequestDto,
        );

        // updateParentRequestDto.status가 approved인 경우는 펫-부모 정보를 업데이트한다.
        if (updateParentRequestDto.status === PARENT_STATUS.APPROVED) {
          await this.petRelationService.upsertParentRelation(
            parentRequest.childPetId,
            parentRequest.role,
            parentRequest.parentPetId,
            entityManager,
          );
        }

        // 상대방에게 답장 알림 전송
        const createNotification: CreateUserNotificationDto = {
          receiverId: existingNotification.senderId,
          type: this.getNotificationTypeByStatus(updateParentRequestDto.status),
          targetId: parentRequest.id,
          detailJson: {
            status: updateParentRequestDto.status,
            childPet: {
              id: parentRequest.childPetId,
              name: childPet?.name ?? undefined,
            },
            parentPet: {
              id: parentRequest.parentPetId,
              name: parentPet?.name ?? undefined,
            },
            role: parentRequest.role,
            message: parentRequest.message,
            ...(updateParentRequestDto.status === PARENT_STATUS.REJECTED && {
              rejectReason: updateParentRequestDto.rejectReason,
            }),
          },
        };
        const notification =
          await this.userNotificationService.createUserNotification(
            entityManager,
            parentPet.ownerId,
            createNotification,
          );

        // 기존 알림 상태 업데이트
        const updateExistingNotification = {
          ...existingNotification.detailJson,
          status: updateParentRequestDto.status,
          ...(updateParentRequestDto.status === PARENT_STATUS.REJECTED && {
            rejectReason: updateParentRequestDto.rejectReason,
          }),
        };
        await entityManager.update(
          UserNotificationEntity,
          { id: existingNotification.id },
          { detailJson: updateExistingNotification },
        );

        return {
          notification,
          parentLinked:
            updateParentRequestDto.status === PARENT_STATUS.APPROVED,
          childPetId: parentRequest.childPetId,
          parentPetId: parentRequest.parentPetId,
        };
      },
    );

    // 트랜잭션 커밋 후 푸시 알림 발송
    if (result?.notification) {
      this.userNotificationService.sendPushNotificationForNotification(
        result.notification,
      );
    }

    // 트랜잭션 커밋 후 캐시 무효화 (승인된 부모 관계)
    if (result?.parentLinked && result.childPetId && result.parentPetId) {
      await this.invalidateRelationCaches(
        result.childPetId,
        result.parentPetId,
      );
    }

    // 트랜잭션 커밋 후 삭제된 펫으로 인한 취소 예외 throw
    if (cancelledByDeletedPetReason) {
      throw new BadRequestException(cancelledByDeletedPetReason);
    }
  }

  async getPetInfo(
    entityManager: EntityManager,
    childPetId: string,
    parentPetId: string,
  ) {
    const [childPet, parentPet] = await Promise.all([
      entityManager.findOne(PetEntity, {
        where: { petId: childPetId, isDeleted: false },
        select: ['name', 'petId', 'ownerId'],
      }),
      entityManager
        .createQueryBuilder(PetEntity, 'pet')
        .innerJoinAndMapOne(
          'pet.petDetail',
          PetDetailEntity,
          'petDetail',
          'petDetail.petId = pet.petId',
        )
        .select([
          'pet.type',
          'pet.name',
          'pet.petId',
          'pet.ownerId',
          'petDetail.sex',
        ])
        .where('pet.petId = :parentPetId', { parentPetId })
        .andWhere('pet.isDeleted = :isDeleted', { isDeleted: false })
        .getOne(),
    ]);

    return { childPet, parentPet };
  }

  async getParentsWithRequestStatus(
    petId: string,
    options?: { statuses?: PARENT_STATUS[] },
    manager?: EntityManager,
  ): Promise<{
    father: PetParentDto | null;
    mother: PetParentDto | null;
  }> {
    const statuses = options?.statuses ?? [
      PARENT_STATUS.PENDING,
      PARENT_STATUS.APPROVED,
    ];

    const run = async (em: EntityManager) => {
      // 1. parent_request만 조회 (단일 테이블)
      const requests = await em
        .createQueryBuilder(ParentRequestEntity, 'pr')
        .select(['pr.parentPetId', 'pr.status', 'pr.role'])
        .where('pr.childPetId = :petId', { petId })
        .andWhere('pr.status IN (:...statuses)', { statuses })
        .getRawMany<{
          pr_parent_pet_id: string;
          pr_status: PARENT_STATUS;
          pr_role: PARENT_ROLE;
        }>();

      if (requests.length === 0) {
        return { father: null, mother: null };
      }

      // 2. 각 부모 펫 데이터를 pet 캐시에서 조회 + owner 정보 별도 조회
      let father: PetParentDto | null = null;
      let mother: PetParentDto | null = null;

      await Promise.all(
        requests.map(async (req) => {
          const parentPetId = req.pr_parent_pet_id;

          // pet 캐시 활용 (findPetByPetId와 동일한 캐시 키 + 동일한 fallback)
          const petData = await this.cacheService.wrap(
            CACHE.pet.key(parentPetId),
            () => loadPetData(this.dataSource.manager, parentPetId),
            CACHE.pet.ttl,
          );

          if (!petData) return;

          // owner 정보는 캐시 밖에서 매번 조회
          const owner = await em.findOne(UserEntity, {
            where: { userId: petData.ownerId },
            select: ['userId', 'name', 'role', 'isBiz', 'status'],
          });

          const parent = plainToInstance(PetParentDto, {
            petId: petData.petId,
            name: petData.name ?? '',
            species: petData.species,
            sex: petData.sex,
            morphs: petData.morphs,
            traits: petData.traits,
            hatchingDate: petData.hatchingDate,
            status: req.pr_status,
            owner: owner
              ? {
                  userId: owner.userId,
                  name: owner.name,
                  role: owner.role,
                  isBiz: owner.isBiz,
                  status: owner.status,
                }
              : undefined,
            isPublic: !!petData.isPublic,
            isDeleted: !!petData.isDeleted,
          });

          if (req.pr_role === PARENT_ROLE.FATHER) father = parent;
          else if (req.pr_role === PARENT_ROLE.MOTHER) mother = parent;
        }),
      );

      return { father, mother };
    };

    if (manager) {
      return await run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return await run(entityManager);
    });
  }

  /**
   * 부모 관계 변경 후 영향받는 모든 자식 펫의 clutchMates/siblings 캐시 무효화
   * - 변경된 본인(childPetId) + 같은 부모를 공유하는 다른 자식들
   */
  private async invalidateRelationCaches(
    childPetId: string,
    parentId: string,
  ): Promise<void> {
    // 해당 부모의 모든 자식 조회 (커밋 후이므로 현재 DB 상태 반영)
    const siblingRelations = await this.dataSource.manager.find(
      PetRelationEntity,
      {
        where: [{ fatherId: parentId }, { motherId: parentId }],
        select: ['petId'],
      },
    );

    const petIdsToInvalidate = new Set(siblingRelations.map((r) => r.petId));
    petIdsToInvalidate.add(childPetId);

    await Promise.all(
      [...petIdsToInvalidate].flatMap((id) => [
        this.cacheService.del(CACHE.clutchMates.key(id)),
        this.cacheService.del(CACHE.siblings.key(id)),
      ]),
    );
  }

  private getNotificationTypeByStatus(
    status: PARENT_STATUS,
  ): USER_NOTIFICATION_TYPE {
    switch (status) {
      case PARENT_STATUS.APPROVED:
        return USER_NOTIFICATION_TYPE.PARENT_ACCEPT;
      case PARENT_STATUS.REJECTED:
        return USER_NOTIFICATION_TYPE.PARENT_REJECT;
      case PARENT_STATUS.CANCELLED:
        return USER_NOTIFICATION_TYPE.PARENT_CANCEL;
      default:
        return USER_NOTIFICATION_TYPE.PARENT_REQUEST;
    }
  }

  /**
   * 특정 펫과 관련된 PENDING 상태의 부모 요청이 존재하는지 확인
   * @param petId - 자식 또는 부모로 포함된 펫 ID
   * @param manager - 선택적 EntityManager (외부 트랜잭션 지원)
   * @returns PENDING 요청 존재 여부
   */
  async getPendingRequestCount(
    petId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const run = async (em: EntityManager) => {
      return em.countBy(ParentRequestEntity, [
        { childPetId: petId, status: PARENT_STATUS.PENDING },
        { parentPetId: petId, status: PARENT_STATUS.PENDING },
      ]);
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }
}
