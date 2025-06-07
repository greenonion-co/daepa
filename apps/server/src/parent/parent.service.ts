import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ParentEntity } from './parent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CreateParentDto,
  FindParentDto,
  ParentDto,
  UpdateParentDto,
} from './parent.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PARENT_ROLE, PARENT_STATUS } from './parent.constant';
import { PetService } from 'src/pet/pet.service';
import {
  USER_NOTIFICATION_STATUS,
  USER_NOTIFICATION_TYPE,
} from 'src/user_notification/user_notification.constant';
import { UserNotificationService } from 'src/user_notification/user_notification.service';
import { EggService } from 'src/egg/egg.service';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(ParentEntity)
    private readonly parentRepository: Repository<ParentEntity>,
    @Inject(forwardRef(() => PetService))
    private readonly petService: PetService,
    @Inject(forwardRef(() => EggService))
    private readonly eggService: EggService,
    private readonly userNotificationService: UserNotificationService,
  ) {}

  private createParentQueryBuilder(petId: string) {
    return this.parentRepository
      .createQueryBuilder('parent')
      .select(['parent.id', 'parent.parent_id', 'parent.role', 'parent.status'])
      .innerJoin('pets', 'pet', 'pet.pet_id = parent.parent_id')
      .where('parent.pet_id = :petId', { petId })
      .andWhere('pet.is_deleted = :isDeleted', { isDeleted: false });
  }

  async findOne(petId: string, findParentDto: FindParentDto) {
    const parentEntity = await this.createParentQueryBuilder(petId)
      .andWhere('parent.role = :role', { role: findParentDto.role })
      .andWhere('parent.status IN (:...statuses)', {
        statuses: ['pending', 'approved'],
      })
      .orderBy('parent.created_at', 'DESC')
      .getOne();

    if (!parentEntity) {
      return null;
    }

    const parent = instanceToPlain(parentEntity);

    return plainToInstance(ParentDto, parent);
  }

  async findParents(petId: string) {
    const parentEntities = await this.createParentQueryBuilder(petId)
      .andWhere('parent.status = :status', { status: PARENT_STATUS.APPROVED })
      .getMany();

    const fatherEntity = parentEntities.find(
      (parent) => parent.role === PARENT_ROLE.FATHER,
    );
    const motherEntity = parentEntities.find(
      (parent) => parent.role === PARENT_ROLE.MOTHER,
    );

    return {
      father: fatherEntity
        ? plainToInstance(ParentDto, instanceToPlain(fatherEntity))
        : null,
      mother: motherEntity
        ? plainToInstance(ParentDto, instanceToPlain(motherEntity))
        : null,
    };
  }

  async createParent(
    userId: string,
    petId: string,
    createParentDto: CreateParentDto,
    createOptions: {
      isEgg?: boolean;
      isDirectApprove?: boolean; // 부모 요청을 skip하고 바로 approved 상태로 생성
    },
  ) {
    const parentOwnerId = await this.petService.getPetOwnerId(
      createParentDto.parentId,
    );

    const isMyPet = parentOwnerId === userId;

    const result = await this.parentRepository.insert({
      pet_id: petId,
      parent_id: createParentDto.parentId,
      role: createParentDto.role,
      is_my_pet: isMyPet,
      status:
        isMyPet || createOptions.isDirectApprove
          ? PARENT_STATUS.APPROVED
          : PARENT_STATUS.PENDING,
    });

    if (!isMyPet) {
      await this.createParentRequestNotification({
        relationId: result.identifiers[0].id as number,
        senderPetId: petId,
        receiverPetId: createParentDto.parentId,
        message: createParentDto.message,
        isEgg: createOptions.isEgg,
      });
    }
  }

  async updateParentStatus({
    myId,
    updateParentDto,
  }: {
    myId: string;
    updateParentDto: UpdateParentDto;
  }) {
    const { status, opponentId, relationId } = updateParentDto;
    await this.parentRepository.update(
      {
        id: relationId,
      },
      {
        status,
      },
    );

    // 부모 요청 수락인 경우
    if (status === PARENT_STATUS.APPROVED) {
      // 본인 수신 notification 상태 수정
      const requestedInfo = await this.userNotificationService.updateWhere(
        {
          sender_id: opponentId,
          receiver_id: myId,
          type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
          target_id: relationId.toString(),
        },
        { type: USER_NOTIFICATION_TYPE.PARENT_ACCEPT },
      );
      if (!requestedInfo) {
        throw new NotFoundException('Updated user_notification info not found');
      }
      // 상대방에게 새로운 notification 발신
      await this.userNotificationService.createUserNotification(myId, {
        targetId: relationId.toString(),
        receiverId: opponentId,
        type: USER_NOTIFICATION_TYPE.PARENT_ACCEPT,
        detailJson: {
          senderPet: requestedInfo.detail_json.receiverPet,
          receiverPet: requestedInfo.detail_json.senderPet,
        },
      });
      return {
        message: '부모 요청을 정상적으로 승인하였습니다.',
        // TODO: detailJson에 필요정보 담기
      };
    }

    // 부모 요청 셀프 취소인 경우
    if (status === PARENT_STATUS.CANCELLED) {
      // 상대방의 user_notification을 DELETED 상태로 변경하여 상대방 알림 삭제
      await this.userNotificationService.updateWhere(
        {
          sender_id: myId,
          receiver_id: opponentId,
          type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
          target_id: relationId.toString(),
        },
        { status: USER_NOTIFICATION_STATUS.DELETED },
      );
      return {
        message: '부모 요청을 정상적으로 취소하였습니다.',
      };
    }

    // 부모 요청 거절인 경우
    if (status === PARENT_STATUS.REJECTED) {
      // 본인 수신 notification 상태 수정
      const requestedInfo = await this.userNotificationService.updateWhere(
        {
          sender_id: opponentId,
          receiver_id: myId,
          type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
          target_id: relationId.toString(),
        },
        { type: USER_NOTIFICATION_TYPE.PARENT_REJECT },
      );
      if (!requestedInfo) {
        throw new NotFoundException('Updated user_notification info not found');
      }
      // 상대방에게 새로운 notification 발신
      await this.userNotificationService.createUserNotification(myId, {
        targetId: relationId.toString(),
        receiverId: opponentId,
        type: USER_NOTIFICATION_TYPE.PARENT_REJECT,
        detailJson: {
          message: updateParentDto.rejectReason,
          senderPet: requestedInfo.detail_json.receiverPet,
          receiverPet: requestedInfo.detail_json.senderPet,
        },
      });
      return {
        message: '부모 요청을 정상적으로 거절하였습니다.',
      };
    }

    return {
      message: '부모 관계 상태 업데이트 중 오류 발생',
    };
  }

  async deleteParent(relationId: number) {
    await this.parentRepository.update(
      {
        id: relationId,
      },
      {
        status: PARENT_STATUS.DELETED,
      },
    );
  }

  private async createParentRequestNotification({
    relationId,
    senderPetId,
    receiverPetId,
    message,
    isEgg,
  }: {
    relationId: number;
    senderPetId: string;
    receiverPetId: string;
    message?: string;
    isEgg?: boolean;
  }) {
    const senderPetSummary = isEgg
      ? await this.eggService.getEgg(senderPetId)
      : await this.petService.getPetSummary(senderPetId);
    if (!senderPetSummary) {
      throw new NotFoundException(
        'Sender pet(id: ' + senderPetId + ') not found',
      );
    }
    const receiverPetSummary =
      await this.petService.getPetSummary(receiverPetId);
    if (!receiverPetSummary) {
      throw new NotFoundException(
        'Receiver pet(id: ' + receiverPetId + ') not found',
      );
    }

    const notificationDetail = {
      senderPet: senderPetSummary,
      receiverPet: receiverPetSummary,
      message,
    };

    await this.userNotificationService.createUserNotification(
      senderPetSummary.owner.userId,
      {
        targetId: relationId.toString(),
        receiverId: receiverPetSummary.owner.userId,
        type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
        detailJson: notificationDetail,
      },
    );
  }
}
