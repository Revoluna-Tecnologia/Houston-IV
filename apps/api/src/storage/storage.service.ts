/**
 * Storage Service
 * Gerenciamento de arquivos e mídia para o módulo de comunicação
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { createWriteStream, existsSync, mkdirSync, unlinkSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { firstValueFrom } from 'rxjs'
import { randomUUID } from 'crypto'

export interface UploadResult {
  url: string
  path: string
  fileName: string
  mimeType: string
  size: number
}

export interface FileInfo {
  exists: boolean
  size?: number
  mimeType?: string
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly uploadDir: string
  private readonly baseUrl: string
  private readonly maxFileSize: number

  // MIME types permitidos
  private readonly allowedMimeTypes = new Set([
    // Imagens
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Vídeos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Áudios
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ])

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads')
    this.baseUrl = this.configService.get<string>('UPLOAD_BASE_URL', '/uploads')
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 25 * 1024 * 1024) // 25MB

    // Garantir que o diretório de upload existe
    this.ensureUploadDir()
  }

  /**
   * Faz upload de um arquivo a partir de um buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    subDir?: string
  ): Promise<UploadResult> {
    this.validateMimeType(mimeType)
    this.validateFileSize(buffer.length)

    const ext = extname(fileName) || this.getExtensionFromMimeType(mimeType)
    const uniqueName = `${randomUUID()}${ext}`
    const relativePath = subDir ? `${subDir}/${uniqueName}` : uniqueName
    const fullPath = join(this.uploadDir, relativePath)

    // Garantir que o subdiretório existe
    const dir = join(this.uploadDir, subDir || '')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    // Salvar arquivo
    await this.writeFile(fullPath, buffer)

    const url = `${this.baseUrl}/${relativePath}`

    this.logger.debug(`File uploaded: ${relativePath}`)

    return {
      url,
      path: relativePath,
      fileName: uniqueName,
      mimeType,
      size: buffer.length,
    }
  }

  /**
   * Faz download de um arquivo de uma URL e salva localmente
   */
  async downloadAndSave(
    sourceUrl: string,
    subDir?: string
  ): Promise<UploadResult> {
    this.logger.debug(`Downloading file from: ${sourceUrl}`)

    try {
      const response = await firstValueFrom(
        this.httpService.get(sourceUrl, {
          responseType: 'arraybuffer',
          maxContentLength: this.maxFileSize,
          timeout: 30000,
        })
      )

      const buffer = Buffer.from(response.data)
      const mimeType = response.headers['content-type'] || 'application/octet-stream'
      const contentDisposition = response.headers['content-disposition']

      let fileName = basename(new URL(sourceUrl).pathname)
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/i)
        if (match) fileName = match[1]
      }

      return this.uploadBuffer(buffer, fileName, mimeType, subDir)
    } catch (error) {
      this.logger.error(`Failed to download file: ${error}`)
      throw new BadRequestException('Falha ao baixar arquivo')
    }
  }

  /**
   * Deleta um arquivo
   */
  async delete(urlOrPath: string): Promise<void> {
    const path = urlOrPath.startsWith(this.baseUrl)
      ? urlOrPath.replace(this.baseUrl, '')
      : urlOrPath

    const fullPath = join(this.uploadDir, path)

    if (existsSync(fullPath)) {
      unlinkSync(fullPath)
      this.logger.debug(`File deleted: ${path}`)
    }
  }

  /**
   * Verifica se um arquivo existe e retorna informações
   */
  getFileInfo(urlOrPath: string): FileInfo {
    const path = urlOrPath.startsWith(this.baseUrl)
      ? urlOrPath.replace(this.baseUrl, '')
      : urlOrPath

    const fullPath = join(this.uploadDir, path)

    if (!existsSync(fullPath)) {
      return { exists: false }
    }

    const stats = statSync(fullPath)
    const ext = extname(fullPath)

    return {
      exists: true,
      size: stats.size,
      mimeType: this.getMimeTypeFromExtension(ext),
    }
  }

  /**
   * Gera URL de acesso para um arquivo
   */
  getUrl(path: string): string {
    return `${this.baseUrl}/${path}`
  }

  /**
   * Valida se o MIME type é permitido
   */
  private validateMimeType(mimeType: string): void {
    if (!this.allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException(`Tipo de arquivo não permitido: ${mimeType}`)
    }
  }

  /**
   * Valida o tamanho do arquivo
   */
  private validateFileSize(size: number): void {
    if (size > this.maxFileSize) {
      const maxMB = Math.round(this.maxFileSize / 1024 / 1024)
      throw new BadRequestException(`Arquivo muito grande. Máximo: ${maxMB}MB`)
    }
  }

  /**
   * Garante que o diretório de upload existe
   */
  private ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true })
      this.logger.log(`Upload directory created: ${this.uploadDir}`)
    }
  }

  /**
   * Escreve buffer em arquivo
   */
  private writeFile(path: string, buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = createWriteStream(path)
      stream.on('finish', resolve)
      stream.on('error', reject)
      stream.write(buffer)
      stream.end()
    })
  }

  /**
   * Obtém extensão a partir do MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'audio/webm': '.webm',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
      'text/csv': '.csv',
    }
    return mimeToExt[mimeType] || '.bin'
  }

  /**
   * Obtém MIME type a partir da extensão
   */
  private getMimeTypeFromExtension(ext: string): string {
    const extToMime: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    }
    return extToMime[ext.toLowerCase()] || 'application/octet-stream'
  }
}
