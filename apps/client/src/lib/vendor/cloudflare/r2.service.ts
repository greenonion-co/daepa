import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { globalS3Client } from "@/lib/vendor/aws/s3/globalS3Client";
import { nanoid } from "nanoid";

class R2Service {
  private s3Client: S3Client;
  private r2ImageBaseUrl: string;
  private r2ImageBucketName: string;

  private constructor(s3Client: S3Client) {
    this.s3Client = s3Client;
    const baseUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_IMAGE_BASE_URL ?? "";
    const bucket = process.env.CLOUDFLARE_R2_IMAGE_BUCKET_NAME ?? "";
    this.r2ImageBaseUrl = baseUrl.replace(/\/+$/, "");
    this.r2ImageBucketName = bucket;
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
      name: `${petId}/${nanoid(10)}`,
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
      }),
    );

    const code = uploadResults.$metadata.httpStatusCode ?? 0;
    if (code < 200 || code >= 300) {
      throw new Error("파일 업로드 중 오류가 발생했습니다.");
    }

    return {
      fileName: file.name,
      size: file.size,
      mimeType: file.mimeType,
      url: `${this.r2ImageBaseUrl}/${file.name}`,
    };
  }
}

export const r2Service = R2Service.create();
