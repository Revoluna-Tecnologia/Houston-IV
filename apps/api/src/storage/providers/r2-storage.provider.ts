import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { extname } from "path";
import {
  IStorageProvider,
  UploadResult,
  FileInfo,
} from "./storage-provider.interface";

@Injectable()
export class R2StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>("R2_ACCOUNT_ID");
    this.bucket = this.configService.getOrThrow<string>("R2_BUCKET_NAME");
    this.publicUrl = this.configService.get<string>("R2_PUBLIC_URL");

    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>("R2_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.getOrThrow<string>(
          "R2_SECRET_ACCESS_KEY",
        ),
      },
    });

    this.logger.log(`R2 Storage initialized — bucket: ${this.bucket}`);
  }

  async upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    subDir?: string,
  ): Promise<UploadResult> {
    const ext = extname(fileName) || ".bin";
    const uniqueName = `${randomUUID()}${ext}`;
    const key = subDir ? `${subDir}/${uniqueName}` : uniqueName;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: buffer.length,
      }),
    );

    const url = this.publicUrl
      ? `${this.publicUrl}/${key}`
      : await this.getSignedUrl(key);

    this.logger.debug(`File uploaded to R2: ${key}`);

    return {
      url,
      key,
      fileName: uniqueName,
      mimeType,
      size: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    this.logger.debug(`File deleted from R2: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async getFileInfo(key: string): Promise<FileInfo> {
    try {
      const response = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        exists: true,
        size: response.ContentLength,
        mimeType: response.ContentType,
      };
    } catch {
      return { exists: false };
    }
  }
}
