import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { AttachmentsController } from '../attachments.controller'
import { AttachmentsService } from '../attachments.service'

describe('AttachmentsController', () => {
  let controller: AttachmentsController
  let service: {
    create: Mock
    findByTicketId: Mock
    findOne: Mock
    remove: Mock
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
    service = {
      create: vi.fn().mockResolvedValue(mockAttachment),
      findByTicketId: vi.fn().mockResolvedValue([mockAttachment]),
      findOne: vi.fn().mockResolvedValue(mockAttachment),
      remove: vi.fn().mockResolvedValue({ key: 'tickets/file-uuid.pdf' }),
    }

    controller = new AttachmentsController(service as unknown as AttachmentsService)
  })

  describe('create', () => {
    it('should create a new attachment', async () => {
      const data = {
        filename: 'file-uuid.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        url: '/uploads/tickets/file-uuid.pdf',
        key: 'tickets/file-uuid.pdf',
      }

      const result = await controller.create('ticket-1', data)

      expect(result.id).toBe('attachment-1')
      expect(service.create).toHaveBeenCalledWith('ticket-1', data)
    })
  })

  describe('findAll', () => {
    it('should return all attachments for ticket', async () => {
      const result = await controller.findAll('ticket-1')

      expect(result).toHaveLength(1)
      expect(service.findByTicketId).toHaveBeenCalledWith('ticket-1')
    })
  })

  describe('findOne', () => {
    it('should return an attachment by id', async () => {
      const result = await controller.findOne('attachment-1')

      expect(result.id).toBe('attachment-1')
      expect(service.findOne).toHaveBeenCalledWith('attachment-1')
    })
  })

  describe('remove', () => {
    it('should remove an attachment and return key', async () => {
      const result = await controller.remove('attachment-1')

      expect(result.key).toBe('tickets/file-uuid.pdf')
      expect(service.remove).toHaveBeenCalledWith('attachment-1')
    })
  })
})
