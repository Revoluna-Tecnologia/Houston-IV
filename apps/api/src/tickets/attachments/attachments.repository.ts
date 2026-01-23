import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { TicketAttachment } from '@prisma/client'

interface CreateAttachmentData {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  key: string
  ticketId: string
}

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAttachmentData): Promise<TicketAttachment> {
    return this.prisma.ticketAttachment.create({ data })
  }

  async findByTicketId(ticketId: string): Promise<TicketAttachment[]> {
    return this.prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string): Promise<TicketAttachment | null> {
    return this.prisma.ticketAttachment.findUnique({ where: { id } })
  }

  async findByKey(key: string): Promise<TicketAttachment | null> {
    return this.prisma.ticketAttachment.findUnique({ where: { key } })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticketAttachment.delete({ where: { id } })
  }

  async countByTicketId(ticketId: string): Promise<number> {
    return this.prisma.ticketAttachment.count({ where: { ticketId } })
  }
}
