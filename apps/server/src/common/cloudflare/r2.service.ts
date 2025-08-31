import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { UploadedPetImageDto } from 'src/pet/pet.dto';

@Injectable()
export class R2Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>(
      'CLOUDFLARE_R2_API_BASE_URL',
    );
    const accessKeyId = this.configService.get<string>(
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    );

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('Cloudflare R2 환경변수가 올바르지 않습니다.');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(
    files: { buffer: Buffer; fileName: string; mimeType: string }[],
  ): Promise<UploadedPetImageDto[]> {
    const bucketName = this.configService.get<string>(
      'CLOUDFLARE_R2_IMAGE_BUCKET_NAME',
    );

    const commands = files.map((file) => {
      return new PutObjectCommand({
        Bucket: bucketName ?? 'daepa',
        Key: file.fileName,
        Body: file.buffer,
        ContentType: file.mimeType,
      });
    });
    const results = await Promise.all(
      commands.map((command) => this.s3Client.send(command)),
    );
    if (results.some((result) => result.$metadata.httpStatusCode !== 200)) {
      throw new Error('파일 업로드 중 오류가 발생했습니다.');
    }

    const baseUrl =
      this.configService.get<string>('CLOUDFLARE_R2_IMAGE_BASE_URL') ?? '';
    const uploadSuccessFiles = files.map(({ buffer, fileName, mimeType }) => ({
      fileName,
      url: `${baseUrl}/${fileName}`,
      size: buffer.byteLength,
      mimeType,
    }));

    return uploadSuccessFiles;
  }

  async updateFileKey(fileName: string, newFileName: string) {
    const bucketName = this.configService.get<string>(
      'CLOUDFLARE_R2_IMAGE_BUCKET_NAME',
    );
    const baseUrl =
      this.configService.get<string>('CLOUDFLARE_R2_IMAGE_BASE_URL') ?? '';

    const command = new CopyObjectCommand({
      Bucket: bucketName,
      Key: newFileName,
      CopySource: `${bucketName}/${fileName}`,
    });

    await this.s3Client.send(command);

    return {
      fileName: newFileName,
      url: `${baseUrl}/${newFileName}`,
    };
  }
}
