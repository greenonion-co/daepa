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
import { PARENT_STATUS } from './parent.constant';
import { PetService } from 'src/pet/pet.service';
import {
  USER_NOTIFICATION_STATUS,
  USER_NOTIFICATION_TYPE,
} from 'src/user_notification/user_notification.constant';
import { UserNotificationService } from 'src/user_notification/user_notification.service';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(ParentEntity)
    private readonly parentRepository: Repository<ParentEntity>,
    @Inject(forwardRef(() => PetService))
    private readonly petService: PetService,
    private readonly userNotificationService: UserNotificationService,
  ) {}

  async findOne(petId: string, findParentDto: FindParentDto) {
    const parentEntity = await this.parentRepository.findOne({
      select: ['id', 'parent_id', 'role', 'status'],
      where: {
        pet_id: petId,
        role: findParentDto.role,
        status: In(['pending', 'approved']),
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (!parentEntity) {
      return null;
    }

    const parent = instanceToPlain(parentEntity);

    return plainToInstance(ParentDto, parent);
  }

  async createParent(petId: string, createParentDto: CreateParentDto) {
    const result = await this.parentRepository.insert({
      pet_id: petId,
      parent_id: createParentDto.parentId,
      role: createParentDto.role,
      is_my_pet: createParentDto.isMyPet ?? false,
      status: createParentDto.isMyPet
        ? PARENT_STATUS.APPROVED
        : PARENT_STATUS.PENDING,
    });

    if (!createParentDto.isMyPet) {
      await this.createParentRequestNotification({
        relationId: result.identifiers[0].id as number,
        senderPetId: petId,
        receiverPetId: createParentDto.parentId,
        message: createParentDto.message,
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
      await this.userNotificationService.createUserNotification(myId, {
        targetId: relationId.toString(),
        receiverId: opponentId,
        type: USER_NOTIFICATION_TYPE.PARENT_ACCEPT,
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
      // 부모 요청자에게 거절 user-notification 생성
      await this.userNotificationService.createUserNotification(myId, {
        targetId: relationId.toString(),
        receiverId: opponentId,
        type: USER_NOTIFICATION_TYPE.PARENT_REJECT,
        // TODO: detailJson에 거절 사유 담기
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
  }: {
    relationId: number;
    senderPetId: string;
    receiverPetId: string;
    message?: string;
  }) {
    const senderPetSummary = await this.petService.getPetSummary(senderPetId);
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
