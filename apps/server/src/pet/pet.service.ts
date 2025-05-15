import { Injectable } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePetDto, PetSummaryDto, UpdatePetDto } from './pet.dto';
import { plainToInstance } from 'class-transformer';
import { PageOptionsDto, PageDto, PageMetaDto } from 'src/common/page.dto';
import { PetDto } from './pet.dto';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
  ) {}

  async createPet(
    inputPetData: { petId: string; ownerId: string } & CreatePetDto,
  ): Promise<PetEntity> {
    const petData = plainToInstance(PetEntity, inputPetData);
    return await this.petRepository.save(petData);
  }

  async getAllPets(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetEntity>> {
    const queryBuilder = this.petRepository.createQueryBuilder('pet');

    queryBuilder
      .orderBy('pet.id', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async getPet(petId: string): Promise<PetDto | null> {
    const pet = await this.petRepository.findOneBy({ pet_id: petId });

    if (!pet) {
      return null;
    }

    const petDto = plainToInstance(PetDto, pet);

    if (pet.father_id) {
      petDto.father = await this.getPetSummary(pet.father_id);
    }

    if (pet.mother_id) {
      petDto.mother = await this.getPetSummary(pet.mother_id);
    }

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

  private async getPetSummary(petId: string): Promise<PetSummaryDto> {
    const pet = await this.petRepository.findOneBy({ pet_id: petId });
    return plainToInstance(PetSummaryDto, pet);
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
