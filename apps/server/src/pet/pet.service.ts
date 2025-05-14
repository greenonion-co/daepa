import { Injectable } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePetDto, UpdatePetDto } from './pet.dto';
import { plainToInstance } from 'class-transformer';
import { PageOptionsDto, PageDto, PageMetaDto } from 'src/common/page.dto';

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

  async getPet(petId: string): Promise<PetEntity | null> {
    return await this.petRepository.findOneBy({ pet_id: petId });
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
}
