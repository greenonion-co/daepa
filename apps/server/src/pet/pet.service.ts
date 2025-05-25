import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { DeleteResult, Repository } from 'typeorm';
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
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
  ) {}

  async createPet(
    inputPetData: { petId: string; ownerId: string } & CreatePetDto,
  ): Promise<void> {
    const petData = plainToInstance(PetEntity, inputPetData);
    await this.petRepository.insert(petData);

    await this.createParentInfo({
      petId: inputPetData.petId,
      fatherId: inputPetData.fatherId,
      motherId: inputPetData.motherId,
    });
  }

  async getPetList<T extends PetDto | PetSummaryDto>(
    pageOptionsDto: PageOptionsDto,
    dtoClass: new () => T,
  ): Promise<{ data: T[]; pageMeta: PageMetaDto }> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.user_id = pets.owner_id',
      );

    queryBuilder
      .orderBy('pets.id', pageOptionsDto.order)
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
        const father = await this.getParent(pet.petId, PARENT_ROLE.FATHER);
        if (father) {
          pet.father = plainToInstance(PetParentDto, father);
        }
        const mother = await this.getParent(pet.petId, PARENT_ROLE.MOTHER);
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
    const petEntity = await this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.user_id = pets.owner_id',
      )
      .where('pets.pet_id = :petId', { petId })
      .getOne();

    if (!petEntity) {
      return null;
    }

    const pet = instanceToPlain(petEntity);

    if (typeof pet.petId === 'string') {
      pet.father = await this.getParent(pet.petId, PARENT_ROLE.FATHER);
    }
    if (typeof pet.petId === 'string') {
      pet.mother = await this.getParent(pet.petId, PARENT_ROLE.MOTHER);
    }

    const petDto = plainToInstance(PetDto, pet);
    return petDto;
  }

  async updatePet(petId: string, updatePetDto: UpdatePetDto): Promise<void> {
    const { fatherId, motherId, ...updateData } = updatePetDto;

    await this.petRepository.update({ pet_id: petId }, updateData);

    await this.createParentInfo({
      petId,
      fatherId,
      motherId,
    });
  }

  async deletePet(petId: string): Promise<DeleteResult> {
    return await this.petRepository.delete({ pet_id: petId });
  }

  async getPetSummary(petId: string): Promise<PetSummaryDto | null> {
    const petEntity = await this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.user_id = pets.owner_id',
      )
      .where('pets.pet_id = :petId', { petId })
      .getOne();

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
    const parentInfo = await this.parentService.findOne(petId, {
      role,
    });
    if (!parentInfo) return null;

    const parentPetSummary = await this.getPetSummary(parentInfo.parentId);
    return {
      ...parentPetSummary,
      status: parentInfo.status,
    };
  }

  private async createParentInfo({
    petId,
    fatherId,
    motherId,
  }: {
    petId: string;
    fatherId?: string;
    motherId?: string;
  }): Promise<void> {
    if (fatherId) {
      await this.parentService.createParent(petId, {
        parentId: fatherId,
        role: PARENT_ROLE.FATHER,
      });
    }
    if (motherId) {
      await this.parentService.createParent(petId, {
        parentId: motherId,
        role: PARENT_ROLE.MOTHER,
      });
    }
  }
}
