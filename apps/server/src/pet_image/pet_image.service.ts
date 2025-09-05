import { Injectable } from '@nestjs/common';
import { PetImageEntity } from './pet_image.entity';
import { EntityManager, Repository } from 'typeorm';
import { PetImageItem, UpsertPetImageDto } from './pet_image.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { R2Service } from 'src/common/cloudflare/r2.service';

@Injectable()
export class PetImageService {
  constructor(
    @InjectRepository(PetImageEntity)
    private readonly petImageRepository: Repository<PetImageEntity>,
    private readonly r2Service: R2Service,
  ) {}

  async saveAndUploadConfirmedImages(
    entityManager: EntityManager,
    petId: string,
    imageList: UpsertPetImageDto[],
  ) {
    const needUploadImageList: PetImageItem[] = [];
    const savedImageList: PetImageItem[] = [];

    for (const image of imageList) {
      if (image.fileName.startsWith('PENDING/')) {
        needUploadImageList.push({
          fileName: image.fileName,
          url: image.url,
          mimeType: image.mimeType,
          size: image.size,
        });
      } else {
        savedImageList.push({
          fileName: image.fileName,
          url: image.url,
          mimeType: image.mimeType,
          size: image.size,
        });
      }
    }

    for (const image of needUploadImageList) {
      const { fileName, url } = await this.r2Service.updateFileKey(
        image.fileName,
        image.fileName.replace('PENDING/', `${petId}/`),
      );
      savedImageList.push({
        fileName: fileName,
        url: url,
        mimeType: image.mimeType,
        size: image.size,
      });
    }

    const existing = await entityManager.findOne(PetImageEntity, {
      where: { petId },
    });

    if (existing) {
      return entityManager.update(
        PetImageEntity,
        { petId },
        {
          files: savedImageList,
        },
      );
    }

    return entityManager.insert(PetImageEntity, {
      petId,
      files: savedImageList,
    });
  }
}
