export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface FileInfo {
  exists: boolean;
  size?: number;
  mimeType?: string;
}

export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");

export interface IStorageProvider {
  upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    subDir?: string,
  ): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getFileInfo(key: string): Promise<FileInfo>;
}
