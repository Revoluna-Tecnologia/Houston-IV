import { Injectable, NotFoundException } from '@nestjs/common'
import { AttachmentsRepository } from './attachments.repository'
import type { TicketAttachment } from '@prisma/client'
import type { AttachmentResponseDto } from './dto'

interface CreateAttachmentInput {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  key: string
}

@Injectable()
export class AttachmentsService {
  constructor(private readonly repository: AttachmentsRepository) {}

  async create(ticketId: string, data: CreateAttachmentInput): Promise<AttachmentResponseDto> {
    const attachment = await this.repository.create({ ...data, ticketId })
    return this.toResponseDto(attachment)
  }

  async findByTicketId(ticketId: string): Promise<AttachmentResponseDto[]> {
    const attachments = await this.repository.findByTicketId(ticketId)
    return attachments.map((a) => this.toResponseDto(a))
  }

  async findOne(id: string): Promise<AttachmentResponseDto> {
    const attachment = await this.repository.findById(id)
    if (!attachment) {
      throw new NotFoundException('Anexo nao encontrado')
    }
    return this.toResponseDto(attachment)
  }

  async remove(id: string): Promise<{ key: string }> {
    const attachment = await this.repository.findById(id)
    if (!attachment) {
      throw new NotFoundException('Anexo nao encontrado')
    }
    const key = attachment.key
    await this.repository.delete(id)
    return { key }
  }

  private toResponseDto(attachment: TicketAttachment): AttachmentResponseDto {
    return {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: attachment.url,
      key: attachment.key,
      ticketId: attachment.ticketId,
      createdAt: attachment.createdAt,
    }
  }
}
