import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { AttachmentsRepository } from '../attachments.repository'
import { PrismaService } from '../../../prisma/prisma.service'

describe('AttachmentsRepository', () => {
  let repository: AttachmentsRepository
  let prisma: {
    ticketAttachment: {
      create: Mock
      findMany: Mock
      findUnique: Mock
      delete: Mock
      count: Mock
    }
  }

  const mockAttachment = {
    id: 'attachment-1',
    filename: 'file-uuid.pdf',
    originalName: 'document.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    url: '/uploads/tickets/file-uuid.pdf',
    key: 'tickets/file-uuid.pdf',
    ticketId: 'ticket-1',
    createdAt: new Date(),
  }

  beforeEach(() => {
    prisma = {
      ticketAttachment: {
        create: vi.fn().mockResolvedValue(mockAttachment),
        findMany: vi.fn().mockResolvedValue([mockAttachment]),
        findUnique: vi.fn().mockResolvedValue(mockAttachment),
        delete: vi.fn().mockResolvedValue(mockAttachment),
        count: vi.fn().mockResolvedValue(1),
      },
    }

    repository = new AttachmentsRepository(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('should create an attachment', async () => {
      const data = {
        filename: 'file-uuid.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        url: '/uploads/tickets/file-uuid.pdf',
        key: 'tickets/file-uuid.pdf',
        ticketId: 'ticket-1',
      }

      const result = await repository.create(data)

      expect(result).toEqual(mockAttachment)
      expect(prisma.ticketAttachment.create).toHaveBeenCalledWith({ data })
    })
  })

  describe('findByTicketId', () => {
    it('should find all attachments for ticket', async () => {
      const result = await repository.findByTicketId('ticket-1')

      expect(result).toHaveLength(1)
      expect(prisma.ticketAttachment.findMany).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1' },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findById', () => {
    it('should find attachment by id', async () => {
      const result = await repository.findById('attachment-1')

      expect(result).toEqual(mockAttachment)
      expect(prisma.ticketAttachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
      })
    })

    it('should return null when not found', async () => {
      prisma.ticketAttachment.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByKey', () => {
    it('should find attachment by key', async () => {
      const result = await repository.findByKey('tickets/file-uuid.pdf')

      expect(result).toEqual(mockAttachment)
      expect(prisma.ticketAttachment.findUnique).toHaveBeenCalledWith({
        where: { key: 'tickets/file-uuid.pdf' },
      })
    })
  })

  describe('delete', () => {
    it('should delete attachment', async () => {
      await repository.delete('attachment-1')

      expect(prisma.ticketAttachment.delete).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
      })
    })
  })

  describe('countByTicketId', () => {
    it('should count attachments for ticket', async () => {
      const result = await repository.countByTicketId('ticket-1')

      expect(result).toBe(1)
      expect(prisma.ticketAttachment.count).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1' },
      })
    })
  })
})
