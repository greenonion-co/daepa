import { Injectable } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePetDto } from './pet.dto';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class PetService {
  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
  ) {}

  // 반려동물 생성
  async createPet(
    inputPetData: { petId: string; ownerId: string } & CreatePetDto,
  ): Promise<PetEntity> {
    const petData = plainToInstance(PetEntity, inputPetData);
    return await this.petRepository.save(petData);
  }

  // 반려동물 전체 조회
  async getAllPets(): Promise<PetEntity[]> {
    return await this.petRepository.find();
  }

  // 반려동물 조회
  async getPet(petId: string): Promise<PetEntity | null> {
    return await this.petRepository.findOneBy({ pet_id: petId });
  }
}
