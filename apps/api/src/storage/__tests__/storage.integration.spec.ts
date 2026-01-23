import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { BadRequestException } from '@nestjs/common'
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { StorageService } from '../storage.service'

describe('StorageService (Integration)', () => {
  let module: TestingModule
  let service: StorageService
  let testUploadDir: string

  beforeAll(async () => {
    testUploadDir = join(process.cwd(), 'test-uploads')

    // Clean up test directory if exists
    if (existsSync(testUploadDir)) {
      rmSync(testUploadDir, { recursive: true })
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        HttpModule,
      ],
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue: unknown) => {
              const config: Record<string, unknown> = {
                UPLOAD_DIR: testUploadDir,
                UPLOAD_BASE_URL: '/test-uploads',
                MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB for tests
              }
              return config[key] ?? defaultValue
            },
          },
        },
      ],
    }).compile()

    service = module.get<StorageService>(StorageService)
  })

  afterAll(async () => {
    // Clean up test directory
    if (existsSync(testUploadDir)) {
      rmSync(testUploadDir, { recursive: true })
    }

    await module.close()
  })

  beforeEach(() => {
    // Ensure test directory is clean
    if (existsSync(testUploadDir)) {
      rmSync(testUploadDir, { recursive: true })
    }
    mkdirSync(testUploadDir, { recursive: true })
  })

  describe('uploadBuffer', () => {
    it('should upload a buffer as a file', async () => {
      const buffer = Buffer.from('Hello, World!')
      const fileName = 'test.txt'
      const mimeType = 'text/plain'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result).toBeDefined()
      expect(result.url).toContain('/test-uploads/')
      expect(result.fileName).toMatch(/\.txt$/)
      expect(result.mimeType).toBe(mimeType)
      expect(result.size).toBe(buffer.length)

      // Verify file exists
      const fullPath = join(testUploadDir, result.path)
      expect(existsSync(fullPath)).toBe(true)

      // Verify file content
      const savedContent = readFileSync(fullPath, 'utf-8')
      expect(savedContent).toBe('Hello, World!')
    })

    it('should upload image file', async () => {
      // Create a minimal PNG (1x1 transparent pixel)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x78, 0x9c, 0x63, 0x60, 0x60, 0x60, 0x60,
        0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a,
        0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND chunk
        0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ])

      const result = await service.uploadBuffer(pngBuffer, 'image.png', 'image/png')

      expect(result.mimeType).toBe('image/png')
      expect(result.fileName).toMatch(/\.png$/)
    })

    it('should upload to subdirectory', async () => {
      const buffer = Buffer.from('Subdir content')
      const fileName = 'subdir-file.txt'
      const mimeType = 'text/plain'
      const subDir = 'documents/2024'

      const result = await service.uploadBuffer(buffer, fileName, mimeType, subDir)

      expect(result.path).toContain('documents/2024/')

      const fullPath = join(testUploadDir, result.path)
      expect(existsSync(fullPath)).toBe(true)
    })

    it('should generate unique filenames', async () => {
      const buffer = Buffer.from('Content')
      const fileName = 'same-name.txt'
      const mimeType = 'text/plain'

      const result1 = await service.uploadBuffer(buffer, fileName, mimeType)
      const result2 = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result1.fileName).not.toBe(result2.fileName)
    })

    it('should throw BadRequestException for disallowed MIME types', async () => {
      const buffer = Buffer.from('Executable content')
      const fileName = 'malware.exe'
      const mimeType = 'application/x-msdownload'

      await expect(service.uploadBuffer(buffer, fileName, mimeType)).rejects.toThrow(
        BadRequestException
      )
      await expect(service.uploadBuffer(buffer, fileName, mimeType)).rejects.toThrow(
        'Tipo de arquivo não permitido'
      )
    })

    it('should throw BadRequestException for files too large', async () => {
      // Create a buffer larger than 10MB (test max size)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024)
      const fileName = 'large-file.txt'
      const mimeType = 'text/plain'

      await expect(service.uploadBuffer(largeBuffer, fileName, mimeType)).rejects.toThrow(
        BadRequestException
      )
      await expect(service.uploadBuffer(largeBuffer, fileName, mimeType)).rejects.toThrow(
        'Arquivo muito grande'
      )
    })

    it('should accept PDF files', async () => {
      const buffer = Buffer.from('%PDF-1.4 mock content')
      const fileName = 'document.pdf'
      const mimeType = 'application/pdf'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe('application/pdf')
      expect(result.fileName).toMatch(/\.pdf$/)
    })

    it('should accept CSV files', async () => {
      const buffer = Buffer.from('name,email\nJohn,john@example.com')
      const fileName = 'data.csv'
      const mimeType = 'text/csv'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      expect(result.mimeType).toBe('text/csv')
      expect(result.fileName).toMatch(/\.csv$/)
    })
  })

  describe('delete', () => {
    it('should delete an existing file', async () => {
      const buffer = Buffer.from('To be deleted')
      const fileName = 'to-delete.txt'
      const mimeType = 'text/plain'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      const fullPath = join(testUploadDir, result.path)
      expect(existsSync(fullPath)).toBe(true)

      await service.delete(result.url)

      expect(existsSync(fullPath)).toBe(false)
    })

    it('should delete file by path', async () => {
      const buffer = Buffer.from('Delete by path')
      const fileName = 'delete-path.txt'
      const mimeType = 'text/plain'

      const result = await service.uploadBuffer(buffer, fileName, mimeType)

      await service.delete(result.path)

      const fullPath = join(testUploadDir, result.path)
      expect(existsSync(fullPath)).toBe(false)
    })

    it('should not throw when deleting non-existent file', async () => {
      await expect(service.delete('/non-existent-file.txt')).resolves.not.toThrow()
    })
  })

  describe('getFileInfo', () => {
    it('should return file info for existing file', async () => {
      const buffer = Buffer.from('File info content')
      const fileName = 'info-file.txt'
      const mimeType = 'text/plain'

      const uploaded = await service.uploadBuffer(buffer, fileName, mimeType)

      const info = service.getFileInfo(uploaded.url)

      expect(info.exists).toBe(true)
      expect(info.size).toBe(buffer.length)
      expect(info.mimeType).toBe('text/plain')
    })

    it('should return exists=false for non-existent file', () => {
      const info = service.getFileInfo('/non-existent-file.txt')

      expect(info.exists).toBe(false)
      expect(info.size).toBeUndefined()
      expect(info.mimeType).toBeUndefined()
    })

    it('should detect MIME type from extension', async () => {
      const buffer = Buffer.from('PDF content')

      const uploaded = await service.uploadBuffer(buffer, 'test.pdf', 'application/pdf')
      const info = service.getFileInfo(uploaded.path)

      expect(info.mimeType).toBe('application/pdf')
    })
  })

  describe('getUrl', () => {
    it('should generate correct URL for path', () => {
      const url = service.getUrl('documents/2024/file.pdf')

      expect(url).toBe('/test-uploads/documents/2024/file.pdf')
    })

    it('should handle simple file names', () => {
      const url = service.getUrl('simple-file.txt')

      expect(url).toBe('/test-uploads/simple-file.txt')
    })
  })

  describe('MIME type validation', () => {
    const allowedTypes = [
      { mimeType: 'image/jpeg', ext: '.jpg' },
      { mimeType: 'image/png', ext: '.png' },
      { mimeType: 'image/gif', ext: '.gif' },
      { mimeType: 'image/webp', ext: '.webp' },
      { mimeType: 'video/mp4', ext: '.mp4' },
      { mimeType: 'video/webm', ext: '.webm' },
      { mimeType: 'audio/mpeg', ext: '.mp3' },
      { mimeType: 'audio/ogg', ext: '.ogg' },
      { mimeType: 'application/pdf', ext: '.pdf' },
      { mimeType: 'text/plain', ext: '.txt' },
      { mimeType: 'text/csv', ext: '.csv' },
    ]

    for (const { mimeType, ext } of allowedTypes) {
      it(`should accept ${mimeType} files`, async () => {
        const buffer = Buffer.from('content')
        const result = await service.uploadBuffer(buffer, `file${ext}`, mimeType)
        expect(result.mimeType).toBe(mimeType)
      })
    }

    const disallowedTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/javascript',
      'text/html',
      'application/x-php',
    ]

    for (const mimeType of disallowedTypes) {
      it(`should reject ${mimeType} files`, async () => {
        const buffer = Buffer.from('malicious content')
        await expect(
          service.uploadBuffer(buffer, 'file.bin', mimeType)
        ).rejects.toThrow(BadRequestException)
      })
    }
  })
})
