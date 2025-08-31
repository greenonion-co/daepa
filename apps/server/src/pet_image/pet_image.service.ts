import { Injectable } from '@nestjs/common';
import { PetImageEntity } from './pet_image.entity';
import { EntityManager, Repository } from 'typeorm';
import { UpsertPetImageDto } from './pet_image.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { R2Service } from 'src/common/cloudflare/r2.service';

@Injectable()
export class PetImageService {
  constructor(
    @InjectRepository(PetImageEntity)
    private readonly petImageRepository: Repository<PetImageEntity>,
    private readonly r2Service: R2Service,
  ) {}

  async save(dto: UpsertPetImageDto) {
    return this.petImageRepository.save(dto);
  }

  async saveList(dtoList: UpsertPetImageDto[]) {
    return this.petImageRepository.save(dtoList);
  }

  async saveAndUploadConfirmedImages(
    entityManager: EntityManager,
    petId: string,
    imageList: UpsertPetImageDto[],
  ) {
    const needUploadImageList: UpsertPetImageDto[] = [];
    const savedImageList: UpsertPetImageDto[] = [];

    for (const image of imageList) {
      if (!image.petId && image.fileName.startsWith('PENDING/')) {
        needUploadImageList.push(image);
      } else {
        savedImageList.push(image);
      }
    }

    for (const image of needUploadImageList) {
      const { fileName, url } = await this.r2Service.updateFileKey(
        image.fileName,
        image.fileName.replace('PENDING/', `${petId}/`),
      );
      savedImageList.push({
        ...image,
        fileName,
        url,
        petId,
      });
    }

    return entityManager.save(PetImageEntity, savedImageList);
  }
}
