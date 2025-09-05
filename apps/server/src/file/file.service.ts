import { Injectable } from '@nestjs/common';
import { R2Service } from 'src/common/cloudflare/r2.service';
import { UploadImagesRequestDto } from './file.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class FileService {
  constructor(private readonly r2Service: R2Service) {}

  async uploadImages({ files }: UploadImagesRequestDto) {
    const uploadedImages: string[] = [];

    const uploadedFiles = await this.r2Service.upload(
      files.map((file) => {
        const fileName = `${randomUUID()}-${file.originalname}`;

        return {
          buffer: file.buffer,
          fileName,
          mimeType: file.mimetype,
        };
      }),
    );

    uploadedFiles.map(({ url }) => uploadedImages.push(url));

    return uploadedImages;
  }
}
