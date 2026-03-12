import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { StorageService } from "../storage.service";
import { IStorageProvider } from "../providers/storage-provider.interface";
import { of, throwError } from "rxjs";
import { AxiosResponse } from "axios";

describe("StorageService", () => {
  let service: StorageService;
  let mockProvider: Record<string, Mock>;
  let configService: { get: Mock };
  let httpService: { get: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockProvider = {
      upload: vi.fn().mockResolvedValue({
        url: "/uploads/test-uuid.jpg",
        key: "test-uuid.jpg",
        fileName: "test-uuid.jpg",
        mimeType: "image/jpeg",
        size: 15,
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      getSignedUrl: vi.fn().mockResolvedValue("/uploads/test-uuid.jpg"),
      getFileInfo: vi.fn().mockResolvedValue({ exists: true, size: 1024 }),
    };

    configService = {
      get: vi.fn((key: string, defaultValue?: string | number) => {
        const config: Record<string, string | number> = {
          MAX_FILE_SIZE: 25 * 1024 * 1024,
        };
        return config[key] ?? defaultValue;
      }),
    };

    httpService = {
      get: vi.fn(),
    };

    service = new StorageService(
      mockProvider as unknown as IStorageProvider,
      configService as unknown as ConfigService,
      httpService as unknown as HttpService,
    );
  });

  describe("uploadBuffer", () => {
    it("should upload a valid image file via provider", async () => {
      const buffer = Buffer.from("fake image data");
      const result = await service.uploadBuffer(
        buffer,
        "test.jpg",
        "image/jpeg",
      );

      expect(mockProvider.upload).toHaveBeenCalledWith(
        buffer,
        "test.jpg",
        "image/jpeg",
        undefined,
      );
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("should upload to subdirectory", async () => {
      const buffer = Buffer.from("fake data");
      await service.uploadBuffer(buffer, "test.png", "image/png", "avatars");

      expect(mockProvider.upload).toHaveBeenCalledWith(
        buffer,
        "test.png",
        "image/png",
        "avatars",
      );
    });

    it("should throw BadRequestException for invalid mime type", async () => {
      const buffer = Buffer.from("fake data");
      await expect(
        service.uploadBuffer(buffer, "malware.exe", "application/x-msdownload"),
      ).rejects.toThrow(BadRequestException);

      expect(mockProvider.upload).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException for file too large", async () => {
      const largeBuffer = Buffer.alloc(30 * 1024 * 1024); // 30MB
      await expect(
        service.uploadBuffer(largeBuffer, "large.jpg", "image/jpeg"),
      ).rejects.toThrow(BadRequestException);

      expect(mockProvider.upload).not.toHaveBeenCalled();
    });

    it("should accept video files", async () => {
      const buffer = Buffer.from("fake video data");
      await service.uploadBuffer(buffer, "video.mp4", "video/mp4");

      expect(mockProvider.upload).toHaveBeenCalled();
    });

    it("should accept audio files", async () => {
      const buffer = Buffer.from("fake audio data");
      await service.uploadBuffer(buffer, "audio.mp3", "audio/mpeg");

      expect(mockProvider.upload).toHaveBeenCalled();
    });

    it("should accept Excel files", async () => {
      const buffer = Buffer.from("fake excel data");
      const mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      await service.uploadBuffer(buffer, "spreadsheet.xlsx", mimeType);

      expect(mockProvider.upload).toHaveBeenCalled();
    });
  });

  describe("downloadAndSave", () => {
    it("should download and save file from URL", async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: Buffer.from("downloaded data"),
        headers: {
          "content-type": "image/png",
          "content-disposition": 'attachment; filename="image.png"',
        },
      };
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.downloadAndSave(
        "https://example.com/image.png",
      );

      expect(mockProvider.upload).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle download errors", async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error("Network error")),
      );

      await expect(
        service.downloadAndSave("https://example.com/image.png"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("delete", () => {
    it("should delegate to provider", async () => {
      await service.delete("test-file.jpg");
      expect(mockProvider.delete).toHaveBeenCalledWith("test-file.jpg");
    });
  });

  describe("getSignedUrl", () => {
    it("should delegate to provider", async () => {
      await service.getSignedUrl("test-file.jpg", 3600);
      expect(mockProvider.getSignedUrl).toHaveBeenCalledWith(
        "test-file.jpg",
        3600,
      );
    });
  });

  describe("getFileInfo", () => {
    it("should delegate to provider", async () => {
      const result = await service.getFileInfo("test-file.jpg");
      expect(mockProvider.getFileInfo).toHaveBeenCalledWith("test-file.jpg");
      expect(result.exists).toBe(true);
    });
  });
});
