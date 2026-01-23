import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { AttachmentsService } from '../attachments.service'
import { AttachmentsRepository } from '../attachments.repository'

describe('AttachmentsService', () => {
  let service: AttachmentsService
  let repository: {
    create: Mock
    findByTicketId: Mock
    findById: Mock
    findByKey: Mock
    delete: Mock
    countByTicketId: Mock
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
    repository = {
      create: vi.fn().mockResolvedValue(mockAttachment),
      findByTicketId: vi.fn().mockResolvedValue([mockAttachment]),
      findById: vi.fn().mockResolvedValue(mockAttachment),
      findByKey: vi.fn().mockResolvedValue(mockAttachment),
      delete: vi.fn().mockResolvedValue(undefined),
      countByTicketId: vi.fn().mockResolvedValue(1),
    }

    service = new AttachmentsService(repository as unknown as AttachmentsRepository)
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
      }

      const result = await service.create('ticket-1', data)

      expect(result.id).toBe('attachment-1')
      expect(result.filename).toBe('file-uuid.pdf')
      expect(repository.create).toHaveBeenCalledWith({ ...data, ticketId: 'ticket-1' })
    })
  })

  describe('findByTicketId', () => {
    it('should return all attachments for ticket', async () => {
      const result = await service.findByTicketId('ticket-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('attachment-1')
      expect(repository.findByTicketId).toHaveBeenCalledWith('ticket-1')
    })
  })

  describe('findOne', () => {
    it('should return an attachment by id', async () => {
      const result = await service.findOne('attachment-1')

      expect(result.id).toBe('attachment-1')
      expect(repository.findById).toHaveBeenCalledWith('attachment-1')
    })

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException)
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Anexo nao encontrado'
      )
    })
  })

  describe('remove', () => {
    it('should remove attachment and return key', async () => {
      const result = await service.remove('attachment-1')

      expect(result.key).toBe('tickets/file-uuid.pdf')
      expect(repository.delete).toHaveBeenCalledWith('attachment-1')
    })

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException)
    })
  })
})
