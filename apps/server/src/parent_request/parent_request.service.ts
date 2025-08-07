import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, DataSource, In, Repository } from 'typeorm';
import { ParentRequestEntity } from './parent_request.entity';
import {
  CreateParentRequestDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { PARENT_STATUS } from './parent_request.constants';
import { PetEntity } from '../pet/pet.entity';
import { PET_SEX } from '../pet/pet.constants';
import { UserNotificationService } from '../user_notification/user_notification.service';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';

@Injectable()
export class ParentRequestService {
  constructor(
    @InjectRepository(ParentRequestEntity)
    private readonly parentRequestRepository: Repository<ParentRequestEntity>,
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

    // 알림 생성 (병렬 처리로 성능 향상)

    await this.userNotificationService.createUserNotification(
      childPet.ownerId,
      {
        receiverId: parentPet.ownerId,
        type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
        targetId: parentRequest.id,
        detailJson: {
          childPet: {
            id: childPet?.petId,
            name: childPet?.name,
          },
          parentPet: {
            id: parentPet?.petId,
            name: parentPet.name,
          },
          role: createParentRequestDto.role,
          message: createParentRequestDto.message,
        },
      },
    );

    return parentRequest;
  }

  async updateParentRequestByNotificationId(
    userId: string,
    notificationId: number,
    updateParentRequestDto: UpdateParentRequestDto,
  ) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const notification = await this.userNotificationService.findOne(
        notificationId,
        userId,
      );

      if (!notification) {
        throw new NotFoundException('알림을 찾을 수 없습니다.');
      }

      const parentRequest = await entityManager.findOneBy(ParentRequestEntity, {
        id: notification.targetId,
      });

      //parentRequest의 상태가 pending이 아니면 오류 발생
      if (parentRequest?.status === PARENT_STATUS.APPROVED) {
        throw new BadRequestException('이미 수락된 처리된 요청입니다.');
      }
      if (parentRequest?.status === PARENT_STATUS.REJECTED) {
        throw new BadRequestException('이미 거절된 요청입니다.');
      }
      if (parentRequest?.status === PARENT_STATUS.CANCELLED) {
        throw new BadRequestException('이미 취소된 요청입니다.');
      }

      if (!parentRequest) {
        throw new NotFoundException('부모 요청을 찾을 수 없습니다.');
      }

      const { childPet, parentPet } = await this.getPetInfo(
        entityManager,
        parentRequest.childPetId,
        parentRequest.parentPetId,
      );

      // 상태 업데이트
      await entityManager.update(
        ParentRequestEntity,
        { id: parentRequest.id },
        updateParentRequestDto,
      );

      // 상태가 변경된 경우에만 알림 처리
      if (parentRequest.status !== updateParentRequestDto.status) {
        // 새로운 알림 보내기
        await this.userNotificationService.createUserNotification(userId, {
          receiverId: notification.senderId,
          type: this.getNotificationTypeByStatus(updateParentRequestDto.status),
          targetId: parentRequest.id,
          detailJson: {
            childPet: {
              id: parentRequest.childPetId,
              name: childPet?.name,
            },
            parentPet: {
              id: parentRequest.parentPetId,
              name: parentPet?.name,
            },
            role: parentRequest.role,
            message: parentRequest.message,
            ...(updateParentRequestDto.status === PARENT_STATUS.REJECTED && {
              rejectReason: updateParentRequestDto.rejectReason,
            }),
          },
        });

        await this.userNotificationService.updateUserNotificationDetailJson(
          notification.id,
          {
            status: updateParentRequestDto.status,
            ...(updateParentRequestDto.status === PARENT_STATUS.REJECTED && {
              rejectReason: updateParentRequestDto.rejectReason,
            }),
          },
        );
      }
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

  async deleteAllParentRequestsByPet(petId: string): Promise<void> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 해당 펫과 관련된 모든 parent_request를 병렬로 DELETED 상태로 변경
      await entityManager
        .createQueryBuilder()
        .update(ParentRequestEntity)
        .set({ status: PARENT_STATUS.DELETED })
        .where('status != :deletedStatus', {
          deletedStatus: PARENT_STATUS.DELETED,
        })
        .andWhere('(childPetId = :petId OR parentPetId = :petId)', { petId })
        .execute();
    });
  }

  async getPetInfo(
    entityManager: EntityManager,
    childPetId: string,
    parentPetId: string,
  ) {
    const [childPet, parentPet] = await Promise.all([
      entityManager.findOne(PetEntity, {
        where: { petId: childPetId },
        select: ['name', 'petId', 'ownerId'],
      }),
      entityManager.findOne(PetEntity, {
        where: { petId: parentPetId },
        select: ['name', 'petId', 'ownerId'],
      }),
    ]);
    return { childPet, parentPet };
  }

  async getParentsWithRequestStatus(petId: string): Promise<{
    father: (PetEntity & { status: PARENT_STATUS }) | null;
    mother: (PetEntity & { status: PARENT_STATUS }) | null;
  }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const parentRequests = await entityManager.find(ParentRequestEntity, {
        where: {
          childPetId: petId,
          status: In([PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED]),
        },
        select: ['parentPetId', 'status'],
      });

      if (parentRequests.length === 0) {
        return { father: null, mother: null };
      }

      // 부모 펫 정보를 한 번에 가져옴
      const parentPetIds = parentRequests.map((req) => req.parentPetId);
      const parentPets = await entityManager.find(PetEntity, {
        where: { petId: In(parentPetIds) },
        select: ['petId', 'name', 'species', 'morphs', 'sex', 'hatchingDate'],
      });

      const requestMap = new Map(
        parentRequests.map((req) => [req.parentPetId, req.status]),
      );

      // father와 mother 분리
      const fatherPet = parentPets.find((pet) => pet.sex === PET_SEX.MALE);
      const motherPet = parentPets.find((pet) => pet.sex === PET_SEX.FEMALE);

      const father = fatherPet
        ? {
            ...fatherPet,
            status: requestMap.get(fatherPet.petId) || PARENT_STATUS.PENDING,
          }
        : null;

      const mother = motherPet
        ? {
            ...motherPet,
            status: requestMap.get(motherPet.petId) || PARENT_STATUS.PENDING,
          }
        : null;

      return { father, mother };
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
