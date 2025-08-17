import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PetImageEntity } from './pet.image.entity';
import { Repository } from 'typeorm';
import { PetImageDto, UploadedPetImageDto } from './pet.image.dto';
import { plainToInstance } from 'class-transformer';

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

    const savedPetImagesEntities =
      await this.petImageRepository.save(petImages);

    return plainToInstance(PetImageDto, savedPetImagesEntities);
  }
}
