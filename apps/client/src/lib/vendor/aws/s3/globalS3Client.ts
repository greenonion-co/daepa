import { S3Client } from "@aws-sdk/client-s3";

export class GlobalS3ClientSingleton {
  private static instance: S3Client | null = null;
  private static isInitialized = false;

  private constructor() {
    // private constructor to prevent direct instantiation
  }

  public static getInstance(): S3Client {
    if (!GlobalS3ClientSingleton.instance) {
      GlobalS3ClientSingleton.instance = new S3Client({
        region: "auto",
        endpoint: process.env.CLOUDFLARE_R2_API_BASE_URL ?? "",
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
        },
      });
      GlobalS3ClientSingleton.isInitialized = true;
    }
    return GlobalS3ClientSingleton.instance;
  }

  public static isClientInitialized(): boolean {
    return GlobalS3ClientSingleton.isInitialized;
  }

  public static resetInstance(): void {
    GlobalS3ClientSingleton.instance = null;
    GlobalS3ClientSingleton.isInitialized = false;
  }
}

export const globalS3Client = GlobalS3ClientSingleton.getInstance();
