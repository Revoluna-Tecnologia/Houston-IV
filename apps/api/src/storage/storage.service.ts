/**
 * Storage Service
 * Gerenciamento de arquivos e mídia — delega ao provider (local ou R2)
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { basename } from "path";
import {
  STORAGE_PROVIDER,
  IStorageProvider,
  UploadResult,
} from "./providers/storage-provider.interface";

// Re-export for backwards compatibility
export type {
  UploadResult,
  FileInfo,
} from "./providers/storage-provider.interface";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly maxFileSize: number;

  private readonly allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ]);

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.maxFileSize = this.configService.get<number>(
      "MAX_FILE_SIZE",
      25 * 1024 * 1024,
    );
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    subDir?: string,
  ): Promise<UploadResult> {
    this.validateMimeType(mimeType);
    this.validateFileSize(buffer.length);
    return this.provider.upload(buffer, fileName, mimeType, subDir);
  }

  async downloadAndSave(
    sourceUrl: string,
    subDir?: string,
  ): Promise<UploadResult> {
    this.logger.debug(`Downloading file from: ${sourceUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(sourceUrl, {
          responseType: "arraybuffer",
          maxContentLength: this.maxFileSize,
          timeout: 30000,
        }),
      );

      const buffer = Buffer.from(response.data);
      const mimeType =
        response.headers["content-type"] || "application/octet-stream";
      const contentDisposition = response.headers["content-disposition"];

      let fileName = basename(new URL(sourceUrl).pathname);
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (match) fileName = match[1];
      }

      return this.uploadBuffer(buffer, fileName, mimeType, subDir);
    } catch (error) {
      this.logger.error(`Failed to download file: ${error}`);
      throw new BadRequestException("Falha ao baixar arquivo");
    }
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.provider.getSignedUrl(key, expiresIn);
  }

  async getFileInfo(key: string) {
    return this.provider.getFileInfo(key);
  }

  getUrl(key: string): string {
    return key;
  }

  private validateMimeType(mimeType: string): void {
    if (!this.allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido: ${mimeType}`,
      );
    }
  }

  private validateFileSize(size: number): void {
    if (size > this.maxFileSize) {
      const maxMB = Math.round(this.maxFileSize / 1024 / 1024);
      throw new BadRequestException(`Arquivo muito grande. Máximo: ${maxMB}MB`);
    }
  }
}
