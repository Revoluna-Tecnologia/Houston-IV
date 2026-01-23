import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { StorageService } from '../storage.service'
import { of, throwError } from 'rxjs'
import { AxiosResponse } from 'axios'
import { EventEmitter } from 'events'

// Create mock stream
const createMockStream = () => {
  const emitter = new EventEmitter()
  return {
    on: (event: string, cb: () => void) => {
      emitter.on(event, cb)
      return createMockStream()
    },
    write: vi.fn(() => {
      // Trigger finish after write
      setImmediate(() => emitter.emit('finish'))
      return true
    }),
    end: vi.fn(),
  }
}

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  statSync: vi.fn().mockReturnValue({ size: 1024 }),
  createWriteStream: vi.fn(() => createMockStream()),
}))

describe('StorageService', () => {
  let service: StorageService
  let configService: { get: Mock }
  let httpService: { get: Mock }

  beforeEach(() => {
    vi.clearAllMocks()

    configService = {
      get: vi.fn((key: string, defaultValue?: string | number) => {
        const config: Record<string, string | number> = {
          UPLOAD_DIR: './test-uploads',
          UPLOAD_BASE_URL: '/uploads',
          MAX_FILE_SIZE: 25 * 1024 * 1024,
        }
        return config[key] ?? defaultValue
      }),
    }

    httpService = {
      get: vi.fn(),
    }

    service = new StorageService(
      configService as unknown as ConfigService,
      httpService as unknown as HttpService
    )
  })

  describe('uploadBuffer', () => {
    it('should upload a valid image file', async () => {
      const buffer = Buffer.from('fake image data')
      const fileName = 'test.jpg'
      const mimeType = 'image/jpeg'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe('image/jpeg')
      expect(result.size).toBe(buffer.length)
      expect(result.url).toContain('/uploads/')
      expect(result.fileName).toMatch(/\.jpg$/)
    })

    it('should upload a PDF document', async () => {
      const buffer = Buffer.from('fake pdf data')
      const fileName = 'document.pdf'
      const mimeType = 'application/pdf'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe('application/pdf')
      expect(result.fileName).toMatch(/\.pdf$/)
    })

    it('should upload to subdirectory', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(false)

      const buffer = Buffer.from('fake data')
      const fileName = 'test.png'
      const mimeType = 'image/png'
      const subDir = 'avatars'

      const result = await service.uploadBuffer(buffer, fileName, mimeType, subDir)

      expect(result.path).toContain('avatars/')
      expect(result.url).toContain('/uploads/avatars/')
      expect(fs.mkdirSync).toHaveBeenCalled()
    })

    it('should throw BadRequestException for invalid mime type', async () => {
      const buffer = Buffer.from('fake data')
      const fileName = 'malware.exe'
      const mimeType = 'application/x-msdownload'

      await expect(
        service.uploadBuffer(buffer, fileName, mimeType)
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.uploadBuffer(buffer, fileName, mimeType)
      ).rejects.toThrow('Tipo de arquivo não permitido')
    })

    it('should throw BadRequestException for file too large', async () => {
      const largeBuffer = Buffer.alloc(30 * 1024 * 1024) // 30MB
      const fileName = 'large.jpg'
      const mimeType = 'image/jpeg'

      await expect(
        service.uploadBuffer(largeBuffer, fileName, mimeType)
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.uploadBuffer(largeBuffer, fileName, mimeType)
      ).rejects.toThrow('Arquivo muito grande')
    })

    it('should accept video files', async () => {
      const buffer = Buffer.from('fake video data')
      const fileName = 'video.mp4'
      const mimeType = 'video/mp4'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe('video/mp4')
    })

    it('should accept audio files', async () => {
      const buffer = Buffer.from('fake audio data')
      const fileName = 'audio.mp3'
      const mimeType = 'audio/mpeg'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe('audio/mpeg')
    })

    it('should accept Excel files', async () => {
      const buffer = Buffer.from('fake excel data')
      const fileName = 'spreadsheet.xlsx'
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe(mimeType)
    })
  })

  describe('downloadAndSave', () => {
    it('should download and save file from URL', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: Buffer.from('downloaded data'),
        headers: {
          'content-type': 'image/png',
          'content-disposition': 'attachment; filename="image.png"',
        },
      }

      httpService.get.mockReturnValue(of(mockResponse))

      const result = await service.downloadAndSave('https://example.com/image.png')

      expect(result.mimeType).toBe('image/png')
      expect(result.size).toBe(15)
    })

    it('should handle download errors', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Network error')))

      await expect(
        service.downloadAndSave('https://example.com/image.png')
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.downloadAndSave('https://example.com/image.png')
      ).rejects.toThrow('Falha ao baixar arquivo')
    })

    it('should save to subdirectory', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: Buffer.from('downloaded data'),
        headers: {
          'content-type': 'image/jpeg',
        },
      }

      httpService.get.mockReturnValue(of(mockResponse))

      const result = await service.downloadAndSave(
        'https://example.com/photo.jpg',
        'photos'
      )

      expect(result.path).toContain('photos/')
    })
  })

  describe('delete', () => {
    it('should delete file by URL', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(true)

      await service.delete('/uploads/test-file.jpg')

      expect(fs.unlinkSync).toHaveBeenCalled()
    })

    it('should delete file by path', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(true)

      await service.delete('test-file.jpg')

      expect(fs.unlinkSync).toHaveBeenCalled()
    })

    it('should not throw if file does not exist', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(false)

      await expect(service.delete('non-existent.jpg')).resolves.not.toThrow()
    })
  })

  describe('getFileInfo', () => {
    it('should return file info for existing file', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(true)
      ;(fs.statSync as Mock).mockReturnValue({ size: 1024 })

      const result = service.getFileInfo('/uploads/test.jpg')

      expect(result.exists).toBe(true)
      expect(result.size).toBe(1024)
      expect(result.mimeType).toBe('image/jpeg')
    })

    it('should return exists false for missing file', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(false)

      const result = service.getFileInfo('/uploads/missing.jpg')

      expect(result.exists).toBe(false)
      expect(result.size).toBeUndefined()
    })

    it('should detect PDF mime type', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(true)
      ;(fs.statSync as Mock).mockReturnValue({ size: 2048 })

      const result = service.getFileInfo('/uploads/document.pdf')

      expect(result.mimeType).toBe('application/pdf')
    })

    it('should detect PNG mime type', async () => {
      const fs = await import('fs')
      ;(fs.existsSync as Mock).mockReturnValue(true)
      ;(fs.statSync as Mock).mockReturnValue({ size: 512 })

      const result = service.getFileInfo('/uploads/image.png')

      expect(result.mimeType).toBe('image/png')
    })
  })

  describe('getUrl', () => {
    it('should generate correct URL', () => {
      const result = service.getUrl('test-file.jpg')

      expect(result).toBe('/uploads/test-file.jpg')
    })

    it('should handle subdirectory paths', () => {
      const result = service.getUrl('avatars/user-123.jpg')

      expect(result).toBe('/uploads/avatars/user-123.jpg')
    })
  })
})
