import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync, unlinkSync, statSync, writeFileSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import {
  IStorageProvider,
  UploadResult,
  FileInfo,
} from "./storage-provider.interface";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>("UPLOAD_DIR", "./uploads");
    this.baseUrl = this.configService.get<string>(
      "UPLOAD_BASE_URL",
      "/uploads",
    );

    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
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
    const fullPath = join(this.uploadDir, key);

    const dir = join(this.uploadDir, subDir || "");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, buffer);
    this.logger.debug(`File uploaded locally: ${key}`);

    return {
      url: `${this.baseUrl}/${key}`,
      key,
      fileName: uniqueName,
      mimeType,
      size: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.uploadDir, key);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
      this.logger.debug(`File deleted: ${key}`);
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.baseUrl}/${key}`;
  }

  async getFileInfo(key: string): Promise<FileInfo> {
    const fullPath = join(this.uploadDir, key);
    if (!existsSync(fullPath)) {
      return { exists: false };
    }
    const stats = statSync(fullPath);
    return { exists: true, size: stats.size };
  }
}
