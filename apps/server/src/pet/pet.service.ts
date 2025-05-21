import { Injectable } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePetDto,
  PetParentDto,
  PetSummaryDto,
  UpdatePetDto,
} from './pet.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PageOptionsDto, PageDto, PageMetaDto } from 'src/common/page.dto';
import { PetDto } from './pet.dto';
import { ParentService } from 'src/parent/parent.service';
import { ParentDto } from 'src/parent/parent.dto';
import { PARENT_ROLE } from 'src/parent/parent.constant';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly parentService: ParentService,
  ) {}

  async createPet(
    inputPetData: { petId: string; ownerId: string } & CreatePetDto,
  ): Promise<PetEntity> {
    const petData = plainToInstance(PetEntity, inputPetData);
    return await this.petRepository.save(petData);
  }

  async getPetList<T extends PetDto | PetSummaryDto>(
    pageOptionsDto: PageOptionsDto,
    dtoClass: new () => T,
  ): Promise<{ data: T[]; pageMeta: PageMetaDto }> {
    const queryBuilder = this.petRepository.createQueryBuilder('pet');

    queryBuilder
      .orderBy('pet.id', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    const petList = entities.map((entity) => instanceToPlain(entity));
    const petDtos = petList.map((pet) => plainToInstance(dtoClass, pet));
    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return {
      data: petDtos,
      pageMeta: pageMetaDto,
    };
  }

  async getPetListFull(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetDto>> {
    const { data, pageMeta } = await this.getPetList<PetDto>(
      pageOptionsDto,
      PetDto,
    );

    const petListFullWithParent = await Promise.all(
      data.map(async (pet) => {
        const father = await this.getParent(pet.petId, 'father');
        if (father) {
          pet.father = plainToInstance(PetParentDto, father);
        }
        const mother = await this.getParent(pet.petId, 'mother');
        if (mother) {
          pet.mother = plainToInstance(PetParentDto, mother);
        }
        return pet;
      }),
    );

    return new PageDto(petListFullWithParent, pageMeta);
  }

  async getPetListSummary(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetSummaryDto>> {
    const { data, pageMeta } = await this.getPetList<PetSummaryDto>(
      pageOptionsDto,
      PetSummaryDto,
    );
    return new PageDto(data, pageMeta);
  }

  async getPet(petId: string): Promise<PetDto | null> {
    const petEntity = await this.petRepository.findOneBy({ pet_id: petId });
    if (!petEntity) {
      return null;
    }

    const pet = instanceToPlain(petEntity);

    if (typeof pet.petId === 'string') {
      pet.father = await this.getParent(pet.petId, 'father');
    }
    if (typeof pet.petId === 'string') {
      pet.mother = await this.getParent(pet.petId, 'mother');
    }

    const petDto = plainToInstance(PetDto, pet);
    return petDto;
  }

  async updatePet(
    petId: string,
    updatePetDto: UpdatePetDto,
  ): Promise<UpdateResult> {
    return await this.petRepository.update({ pet_id: petId }, updatePetDto);
  }

  async deletePet(petId: string): Promise<DeleteResult> {
    return await this.petRepository.delete({ pet_id: petId });
  }

  private async getPetSummary(petId: string): Promise<PetSummaryDto | null> {
    const petEntity = await this.petRepository.findOneBy({ pet_id: petId });
    if (!petEntity) {
      return null;
    }

    const pet = instanceToPlain(petEntity);
    return plainToInstance(PetSummaryDto, pet);
  }

  private async getParent(
    petId: string,
    role: PARENT_ROLE,
  ): Promise<Partial<ParentDto> | null> {
    const father = await this.parentService.findOne(petId, {
      role,
    });
    if (!father) return null;

    const parentSummary = await this.getPetSummary(father.parentId);
    return {
      ...parentSummary,
      status: father.status,
    };
  }

  async updateParentId({
    petId,
    parentId,
    target,
  }: {
    petId: string;
    parentId: string;
    target: 'father' | 'mother';
  }): Promise<void> {
    const fieldName = target === 'father' ? 'father_id' : 'mother_id';
    await this.petRepository.update(
      { pet_id: petId },
      { [fieldName]: parentId },
    );
  }

  async deleteParent(
    petId: string,
    target: 'father' | 'mother',
  ): Promise<void> {
    const fieldName = target === 'father' ? 'father_id' : 'mother_id';
    await this.petRepository.update({ pet_id: petId }, { [fieldName]: null });
  }
}
