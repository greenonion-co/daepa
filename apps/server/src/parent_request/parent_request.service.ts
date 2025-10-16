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
  CreateParentRequestDto,
  UnlinkParentDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';
import { PetEntity } from '../pet/pet.entity';
import { PET_SEX, PET_SPECIES, PET_TYPE } from '../pet/pet.constants';
import { UserNotificationService } from '../user_notification/user_notification.service';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';
import { PetImageEntity } from 'src/pet_image/pet_image.entity';
import { PetParentDto } from 'src/pet/pet.dto';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { UserEntity } from 'src/user/user.entity';
import { USER_ROLE, USER_STATUS } from 'src/user/user.constant';
import { UserNotificationEntity } from 'src/user_notification/user_notification.entity';
import { CreateUserNotificationDto } from 'src/user_notification/user_notification.dto';
import { PairEntity } from 'src/pair/pair.entity';

interface ParentRawData {
  pr_status: PARENT_STATUS;
  p_pet_id: string;
  p_name: string | null;
  p_species: string;
  p_hatching_date: Date | null;
  p_is_public: 0 | 1;
  p_is_deleted: 0 | 1;
  pd_sex: PET_SEX | null;
  pd_morphs: string[] | null;
  pd_traits: string[] | null;
  img_files: PetImageEntity['files'] | null;
  user_user_id: string;
  user_name: string;
  user_role: USER_ROLE;
  user_is_biz: boolean;
  user_status: USER_STATUS;
}

@Injectable()
export class ParentRequestService {
  constructor(
    private readonly userNotificationService: UserNotificationService,
    private readonly dataSource: DataSource,
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
        throw new BadRequestException('페어를 부모로 지정할 수 없습니다.');
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

      // 내 펫이 아닌 경우 요청 알림 전송
      if (!isParentMyPet) {
        try {
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
                  photos: childPet?.photos?.files ?? undefined,
                },
                parentPet: {
                  id: parentPet?.petId ?? '',
                  name: parentPet.name ?? undefined,
                  photos: parentPet?.photos?.files ?? undefined,
                },
                role,
                message,
              },
            },
          );
        } catch (error: unknown) {
          const err = error as Partial<{ code: string }>;

          if (err && err.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('동일한 알림이 이미 존재합니다.');
          }
          throw new InternalServerErrorException('알림 생성에 실패했습니다.');
        }
      }
    };

    if (manager) {
      await run(manager);
      return;
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });
  }

  async unlinkParent(
    petId: string,
    userId: string,
    unlinkParentDto: UnlinkParentDto,
  ) {
    const { role } = unlinkParentDto;
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
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

        try {
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
        } catch (error: unknown) {
          const err = error as { code?: string };
          if (err?.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('동일한 취소 알림이 이미 존재합니다.');
          }
          throw new InternalServerErrorException(
            '취소 알림 생성에 실패했습니다.',
          );
        }
      }

      await entityManager.update(
        ParentRequestEntity,
        { id: parentRequest.id },
        {
          status: PARENT_STATUS.CANCELLED,
        },
      );
    });
  }

  async updateParentRequestByNotificationId(
    userId: string,
    notificationId: number,
    updateParentRequestDto: UpdateParentRequestDto,
  ) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
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

      const parentRequest = await entityManager.findOneBy(ParentRequestEntity, {
        id: existingNotification.targetId,
      });

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

      const { childPet, parentPet } = await this.getPetInfo(
        entityManager,
        parentRequest.childPetId,
        parentRequest.parentPetId,
      );

      if (!parentPet?.ownerId || !childPet?.ownerId) {
        throw new NotFoundException('주인 정보를 찾을 수 없습니다.');
      }

      // 부모 요청 상태 업데이트
      await entityManager.update(
        ParentRequestEntity,
        { id: parentRequest.id },
        updateParentRequestDto,
      );

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
            photos: childPet?.photos?.files ?? undefined,
          },
          parentPet: {
            id: parentRequest.parentPetId,
            name: parentPet?.name ?? undefined,
            photos: parentPet?.photos?.files ?? undefined,
          },
          role: parentRequest.role,
          message: parentRequest.message,
          ...(updateParentRequestDto.status === PARENT_STATUS.REJECTED && {
            rejectReason: updateParentRequestDto.rejectReason,
          }),
        },
      };
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
    });
  }

  private async createParentRequest(
    entityManager: EntityManager,
    createParentRequestDto: CreateParentRequestDto,
  ): Promise<ParentRequestEntity> {
    const parentPetExists = await entityManager.existsBy(PetEntity, {
      petId: createParentRequestDto.parentPetId,
    });

    if (!parentPetExists) {
      throw new NotFoundException('부모 펫을 찾을 수 없습니다.');
    }

    // 기존 요청이 있는지 확인 (중복 방지)
    const existingRequest = await entityManager.existsBy(ParentRequestEntity, {
      childPetId: createParentRequestDto.childPetId,
      parentPetId: createParentRequestDto.parentPetId,
      status: PARENT_STATUS.PENDING,
    });

    if (existingRequest) {
      throw new ConflictException('이미 존재하는 부모 연동 요청입니다.');
    }

    const parentRequest = entityManager.create(ParentRequestEntity, {
      childPetId: createParentRequestDto.childPetId,
      parentPetId: createParentRequestDto.parentPetId,
      role: createParentRequestDto.role,
      status: createParentRequestDto.status ?? PARENT_STATUS.PENDING,
      message: createParentRequestDto.message,
    });

    return await entityManager.save(ParentRequestEntity, parentRequest);
  }

  async findActiveRequestByChildAndParent(
    entityManager: EntityManager,
    childPetId: string,
    parentPetId: string,
  ): Promise<ParentRequestEntity | null> {
    return await entityManager.findOne(ParentRequestEntity, {
      where: {
        childPetId,
        parentPetId,
        status: In([PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED]),
      },
      select: ['id', 'childPetId', 'parentPetId', 'role', 'status', 'message'],
    });
  }

  async findPendingRequestByChildAndParent(
    entityManager: EntityManager,
    childPetId: string,
    parentPetId: string,
  ): Promise<ParentRequestEntity | null> {
    return await entityManager.findOne(ParentRequestEntity, {
      where: {
        childPetId,
        parentPetId,
        status: PARENT_STATUS.PENDING,
      },
      select: ['id', 'childPetId', 'parentPetId', 'role', 'status', 'message'],
    });
  }

  async findPendingRequestByChildAndRole(
    childPetId: string,
  ): Promise<ParentRequestEntity | null> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return await entityManager.findOne(ParentRequestEntity, {
        where: {
          childPetId,
          status: PARENT_STATUS.PENDING,
        },
        select: [
          'id',
          'childPetId',
          'parentPetId',
          'role',
          'status',
          'message',
        ],
      });
    });
  }

  async deleteParentRequest(
    childPetId: string,
    parentPetId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const parentRequest = await entityManager.findOne(ParentRequestEntity, {
        where: {
          childPetId,
          parentPetId,
        },
        select: ['id'],
      });

      if (parentRequest) {
        await entityManager.update(
          ParentRequestEntity,
          { id: parentRequest.id },
          { status: PARENT_STATUS.DELETED },
        );
      }
    });
  }

  async deleteAllParentRequestsByPet(
    petId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      await em
        .createQueryBuilder()
        .update(ParentRequestEntity)
        .set({ status: PARENT_STATUS.DELETED })
        .where('status != :deletedStatus', {
          deletedStatus: PARENT_STATUS.DELETED,
        })
        .andWhere('(childPetId = :petId OR parentPetId = :petId)', { petId })
        .execute();
    };

    if (manager) {
      await run(manager);
      return;
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });
  }

  async getPetInfo(
    entityManager: EntityManager,
    childPetId: string,
    parentPetId: string,
  ) {
    const [childPetInfo, parentPetInfo, childPetPhotos, parentPetPhotos] =
      await Promise.all([
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
        entityManager.findOne(PetImageEntity, {
          where: { petId: childPetId },
          select: ['files'],
        }),
        entityManager.findOne(PetImageEntity, {
          where: { petId: parentPetId },
          select: ['files'],
        }),
      ]);

    const childPet = childPetInfo
      ? {
          ...childPetInfo,
          photos: childPetPhotos,
        }
      : null;
    const parentPet = parentPetInfo
      ? {
          ...parentPetInfo,
          photos: parentPetPhotos,
        }
      : null;

    return { childPet, parentPet };
  }

  async getParentsWithRequestStatus(
    petId: string,
    manager?: EntityManager,
  ): Promise<{
    father: PetParentDto | null;
    mother: PetParentDto | null;
  }> {
    const run = async (em: EntityManager) => {
      const parentData = await em
        .createQueryBuilder(ParentRequestEntity, 'pr')
        .leftJoin(PetEntity, 'p', 'p.petId = pr.parentPetId')
        .leftJoin(PetDetailEntity, 'pd', 'pd.petId = pr.parentPetId')
        .leftJoin(PetImageEntity, 'img', 'img.petId = pr.parentPetId')
        .leftJoin(UserEntity, 'user', 'user.userId = p.ownerId')
        .select([
          'pr.status',
          'p.petId',
          'p.name',
          'p.species',
          'p.hatchingDate',
          'p.isPublic',
          'p.isDeleted',
          'pd.sex',
          'pd.morphs',
          'pd.traits',
          'img.files',
          'user.userId',
          'user.name',
          'user.role',
          'user.isBiz',
          'user.status',
        ])
        .where('pr.childPetId = :petId', { petId })
        .andWhere('pr.status IN (:...statuses)', {
          statuses: [PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED],
        })
        .getRawMany<ParentRawData>();

      if (parentData.length === 0) {
        return { father: null, mother: null };
      }

      let father: PetParentDto | null = null;
      let mother: PetParentDto | null = null;

      for (const row of parentData) {
        const base: PetParentDto = {
          petId: row.p_pet_id,
          name: row.p_name ?? '',
          species: row.p_species as PET_SPECIES,
          sex: row.pd_sex ?? undefined,
          morphs: row.pd_morphs ?? undefined,
          traits: row.pd_traits ?? undefined,
          hatchingDate: row.p_hatching_date ?? undefined,
          photos: row.img_files ?? undefined,
          status: row.pr_status,
          owner: {
            userId: row.user_user_id,
            name: row.user_name,
            role: row.user_role,
            isBiz: row.user_is_biz,
            status: row.user_status,
          },
          isPublic: !!row.p_is_public,
          isDeleted: !!row.p_is_deleted,
        };

        const info = { ...base, photos: row.img_files ?? undefined };

        if (row.pd_sex === PET_SEX.MALE) father = info;
        else if (row.pd_sex === PET_SEX.FEMALE) mother = info;
      }

      return { father, mother };
    };

    if (manager) {
      return await run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return await run(entityManager);
    });
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
}
