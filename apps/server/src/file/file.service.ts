import { Injectable } from '@nestjs/common';
import { R2Service } from 'src/common/cloudflare/r2.service';
import { UploadImagesRequestDto } from './file.dto';
import { PetImageService } from 'src/pet/image/pet.image.service';

@Injectable()
export class FileService {
  constructor(
    private readonly r2Service: R2Service,
    private readonly petImageService: PetImageService,
  ) {}

  async uploadImages({ petId, files }: UploadImagesRequestDto) {
    const uploadedFiles = await this.r2Service.upload(
      files.map((file, index) => ({
        buffer: file.buffer,
        fileName: `${petId}/profile_${index + 1}`,
        mimeType: file.mimetype,
      })),
    );

    const savedPetImages = await this.petImageService.saveImages(
      petId,
      uploadedFiles,
    );

    return savedPetImages;
  }
}
