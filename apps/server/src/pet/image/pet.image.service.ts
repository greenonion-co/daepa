import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PetImageEntity } from './pet.image.entity';
import { Repository } from 'typeorm';
import { UploadedPetImageDto } from './pet.image.dto';

@Injectable()
export class PetImageService {
  constructor(
    @InjectRepository(PetImageEntity)
    private readonly petImageRepository: Repository<PetImageEntity>,
  ) {}

  async saveImages(petId: string, images: UploadedPetImageDto[]) {
    const petImages = images.map((image) => ({
      petId,
      fileName: image.fileName,
      url: image.url,
      size: image.size,
      mimeType: image.mimeType,
    }));

    await this.petImageRepository.upsert(petImages, {
      conflictPaths: ['petId', 'fileName'],
      skipUpdateIfNoValuesChanged: true,
    });

    return true;
  }
}
