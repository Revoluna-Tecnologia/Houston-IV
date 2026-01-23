import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { CommentsController } from '../comments.controller'
import { CommentsService } from '../comments.service'

describe('CommentsController', () => {
  let controller: CommentsController
  let service: {
    create: Mock
    findByTicketId: Mock
    update: Mock
    remove: Mock
  }

  const mockComment = {
    id: 'comment-1',
    content: 'Test comment',
    isInternal: false,
    ticketId: 'ticket-1',
    authorId: 'user-1',
    authorName: 'John Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    service = {
      create: vi.fn().mockResolvedValue(mockComment),
      findByTicketId: vi.fn().mockResolvedValue([mockComment]),
      update: vi.fn().mockResolvedValue({ ...mockComment, content: 'Updated comment' }),
      remove: vi.fn().mockResolvedValue(undefined),
    }

    controller = new CommentsController(service as unknown as CommentsService)
  })

  describe('create', () => {
    it('should create a new comment', async () => {
      const dto = {
        content: 'Test comment',
        isInternal: false,
      }

      const result = await controller.create('ticket-1', dto, 'user-1', 'John Doe')

      expect(result.id).toBe('comment-1')
      expect(service.create).toHaveBeenCalledWith('ticket-1', dto, 'user-1', 'John Doe')
    })

    it('should create internal comment', async () => {
      const dto = {
        content: 'Internal note',
        isInternal: true,
      }

      await controller.create('ticket-1', dto, 'user-1', 'John Doe')

      expect(service.create).toHaveBeenCalledWith('ticket-1', dto, 'user-1', 'John Doe')
    })

    it('should use default name when name is empty', async () => {
      const dto = { content: 'Test comment' }

      await controller.create('ticket-1', dto, 'user-1', '')

      expect(service.create).toHaveBeenCalledWith('ticket-1', dto, 'user-1', 'Usuario')
    })
  })

  describe('findAll', () => {
    it('should return all comments for ticket', async () => {
      const result = await controller.findAll('ticket-1', 'true')

      expect(result).toHaveLength(1)
      expect(service.findByTicketId).toHaveBeenCalledWith('ticket-1', true)
    })

    it('should exclude internal comments when requested', async () => {
      const result = await controller.findAll('ticket-1', 'false')

      expect(result).toHaveLength(1)
      expect(service.findByTicketId).toHaveBeenCalledWith('ticket-1', false)
    })

    it('should include internal by default', async () => {
      await controller.findAll('ticket-1', 'undefined')

      expect(service.findByTicketId).toHaveBeenCalledWith('ticket-1', true)
    })
  })

  describe('update', () => {
    it('should update a comment', async () => {
      const result = await controller.update('comment-1', 'Updated comment', 'user-1')

      expect(result.content).toBe('Updated comment')
      expect(service.update).toHaveBeenCalledWith('comment-1', 'Updated comment', 'user-1')
    })
  })

  describe('remove', () => {
    it('should remove a comment', async () => {
      await controller.remove('comment-1', 'user-1')

      expect(service.remove).toHaveBeenCalledWith('comment-1', 'user-1', false)
    })
  })
})
