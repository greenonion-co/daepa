import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { globalS3Client } from "@/lib/vendor/aws/s3/globalS3Client";
import { nanoid } from "nanoid";

class R2Service {
  private s3Client: S3Client;
  private r2ImageBaseUrl: string;
  private r2ImageBucketName: string;

  private constructor(s3Client: S3Client) {
    this.s3Client = s3Client;
    this.r2ImageBaseUrl = process.env.CLOUDFLARE_R2_IMAGE_BASE_URL ?? "";
    this.r2ImageBucketName = process.env.CLOUDFLARE_R2_IMAGE_BUCKET_NAME ?? "";
  }

  static create() {
    return new R2Service(globalS3Client);
  }

  async upload({
    petId,
    buffer,
    mimeType,
    size,
  }: {
    petId: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
  }) {
    const file = {
      name: `${petId}/${nanoid()}`,
      buffer: buffer,
      mimeType: mimeType,
      size: size,
    };

    const uploadResults = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.r2ImageBucketName,
        Key: file.name,
        Body: file.buffer,
        ContentType: file.mimeType,
        Metadata: {
          "image-status": "pending", // 사용자가 첨부한 이미지를 등록 완료하기 전까지는 pending 상태 할당
        },
      }),
    );

    if (uploadResults.$metadata.httpStatusCode !== 200) {
      throw new Error("파일 업로드 중 오류가 발생했습니다.");
    }

    return {
      name: file.name,
      url: `${this.r2ImageBaseUrl}/${file.name}`,
    };
  }
}

export const r2Service = R2Service.create();
