import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(ParentEntity)
    private readonly parentRepository: Repository<ParentEntity>,
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
    // TODO: parent 성별 검증
    return await this.parentRepository.insert({
      pet_id: petId,
      parent_id: createParentDto.parentId,
      role: createParentDto.role,
    });
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
        status: 'deleted',
      },
    );
  }
}
