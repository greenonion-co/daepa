import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityManager, DataSource, In } from 'typeorm';
import { ParentRequestEntity } from './parent_request.entity';
import {
  CreateParentRequestDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { PARENT_STATUS } from './parent_request.constants';
import { PetEntity } from '../pet/pet.entity';
import { PET_SEX, PET_SPECIES } from '../pet/pet.constants';
import { UserNotificationService } from '../user_notification/user_notification.service';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';
import { PetImageEntity } from 'src/pet_image/pet_image.entity';
import { PetParentDto } from 'src/pet/pet.dto';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { UserEntity } from 'src/user/user.entity';
import { USER_ROLE, USER_STATUS } from 'src/user/user.constant';
import { UserNotificationEntity } from 'src/user_notification/user_notification.entity';
import { CreateUserNotificationDto } from 'src/user_notification/user_notification.dto';

interface ParentRawData {
  pr_status: PARENT_STATUS;
  p_pet_id: string;
  p_name: string | null;
  p_species: string;
  p_hatching_date: Date | null;
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

  async createParentRequestWithNotification(
    entityManager: EntityManager,
    createParentRequestDto: CreateParentRequestDto,
  ): Promise<ParentRequestEntity> {
    // 자식 펫과 부모 펫 정보를 병렬로 조회 (성능 향상)
    const { childPet, parentPet } = await this.getPetInfo(
      entityManager,
      createParentRequestDto.childPetId,
      createParentRequestDto.parentPetId,
    );

    if (!parentPet?.ownerId || !childPet?.ownerId) {
      throw new NotFoundException('주인 정보를 찾을 수 없습니다.');
    }

    // parent_request 테이블에 요청 생성
    const parentRequest = await this.createParentRequest(
      entityManager,
      createParentRequestDto,
    );

    try {
      await this.userNotificationService.createUserNotification(
        entityManager,
        childPet.ownerId,
        {
          receiverId: parentPet.ownerId,
          type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
          targetId: parentRequest.id,
          detailJson: {
            status: createParentRequestDto.status,
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
            role: createParentRequestDto.role,
            message: createParentRequestDto.message,
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

    return parentRequest;
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
          where: { petId: childPetId },
          select: ['name', 'petId', 'ownerId'],
        }),
        entityManager.findOne(PetEntity, {
          where: { petId: parentPetId },
          select: ['name', 'petId', 'ownerId'],
        }),
        entityManager.findOne(PetImageEntity, {
          where: { petId: childPetId },
          select: ['files'],
        }),
        entityManager.findOne(PetImageEntity, {
          where: { petId: parentPetId },
          select: ['files'],
        }),
      ]);

    const childPet = {
      ...childPetInfo,
      photos: childPetPhotos,
    };
    const parentPet = {
      ...parentPetInfo,
      photos: parentPetPhotos,
    };

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
