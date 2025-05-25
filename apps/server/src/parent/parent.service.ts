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
  DeleteParentDto,
  FindParentDto,
  ParentDto,
  UpdateParentDto,
} from './parent.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PARENT_STATUS } from './parent.constant';
import { PetService } from 'src/pet/pet.service';
import { USER_NOTIFICATION_TYPE } from 'src/user_notification/user_notification.constant';
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
      select: ['parent_id', 'role', 'status'],
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
    await this.parentRepository.insert({
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
        senderPetId: petId,
        receiverPetId: createParentDto.parentId,
        message: createParentDto.message,
      });
    }
  }

  async updateParentStatus(petId: string, updateParentDto: UpdateParentDto) {
    return await this.parentRepository.update(
      {
        pet_id: petId,
        parent_id: updateParentDto.parentId,
      },
      {
        status: updateParentDto.updateStatus,
      },
    );
  }
  async deleteParent(petId: string, deleteParentDto: DeleteParentDto) {
    return await this.parentRepository.update(
      {
        pet_id: petId,
        parent_id: deleteParentDto.parentId,
      },
      {
        status: PARENT_STATUS.DELETED,
      },
    );
  }

  private async createParentRequestNotification({
    senderPetId,
    receiverPetId,
    message,
  }: {
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
        receiverId: receiverPetSummary.owner.userId,
        type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
        detailJson: notificationDetail,
      },
    );
  }
}
