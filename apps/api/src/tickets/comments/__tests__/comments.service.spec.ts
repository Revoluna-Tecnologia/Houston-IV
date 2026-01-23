import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { CommentsService } from '../comments.service'
import { CommentsRepository } from '../comments.repository'

describe('CommentsService', () => {
  let service: CommentsService
  let repository: {
    create: Mock
    findByTicketId: Mock
    findById: Mock
    update: Mock
    delete: Mock
    countByTicketId: Mock
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
    repository = {
      create: vi.fn().mockResolvedValue(mockComment),
      findByTicketId: vi.fn().mockResolvedValue([mockComment]),
      findById: vi.fn().mockResolvedValue(mockComment),
      update: vi.fn().mockResolvedValue({ ...mockComment, content: 'Updated' }),
      delete: vi.fn().mockResolvedValue(undefined),
      countByTicketId: vi.fn().mockResolvedValue(1),
    }

    service = new CommentsService(repository as unknown as CommentsRepository)
  })

  describe('create', () => {
    it('should create a comment', async () => {
      const dto = { content: 'Test comment', isInternal: false }

      const result = await service.create('ticket-1', dto, 'user-1', 'John Doe')

      expect(result.id).toBe('comment-1')
      expect(result.content).toBe('Test comment')
      expect(repository.create).toHaveBeenCalledWith('ticket-1', dto, 'user-1', 'John Doe')
    })

    it('should create internal comment', async () => {
      const dto = { content: 'Internal note', isInternal: true }

      await service.create('ticket-1', dto, 'user-1', 'John Doe')

      expect(repository.create).toHaveBeenCalledWith('ticket-1', dto, 'user-1', 'John Doe')
    })
  })

  describe('findByTicketId', () => {
    it('should return all comments for ticket', async () => {
      const result = await service.findByTicketId('ticket-1', true)

      expect(result).toHaveLength(1)
      expect(repository.findByTicketId).toHaveBeenCalledWith('ticket-1', true)
    })

    it('should exclude internal comments', async () => {
      const result = await service.findByTicketId('ticket-1', false)

      expect(result).toHaveLength(1)
      expect(repository.findByTicketId).toHaveBeenCalledWith('ticket-1', false)
    })
  })

  describe('update', () => {
    it('should update comment by author', async () => {
      const result = await service.update('comment-1', 'Updated content', 'user-1')

      expect(result.content).toBe('Updated')
      expect(repository.update).toHaveBeenCalledWith('comment-1', 'Updated content')
    })

    it('should throw NotFoundException when comment not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(
        service.update('non-existent', 'Updated', 'user-1')
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.update('non-existent', 'Updated', 'user-1')
      ).rejects.toThrow('Comentario nao encontrado')
    })

    it('should throw ForbiddenException when not author', async () => {
      repository.findById.mockResolvedValue({ ...mockComment, authorId: 'other-user' })

      await expect(
        service.update('comment-1', 'Updated', 'user-1')
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.update('comment-1', 'Updated', 'user-1')
      ).rejects.toThrow('Voce nao pode editar este comentario')
    })
  })

  describe('remove', () => {
    it('should remove comment by author', async () => {
      await service.remove('comment-1', 'user-1', false)

      expect(repository.delete).toHaveBeenCalledWith('comment-1')
    })

    it('should allow admin to remove any comment', async () => {
      repository.findById.mockResolvedValue({ ...mockComment, authorId: 'other-user' })

      await service.remove('comment-1', 'admin-user', true)

      expect(repository.delete).toHaveBeenCalledWith('comment-1')
    })

    it('should throw NotFoundException when comment not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(
        service.remove('non-existent', 'user-1', false)
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when not author and not admin', async () => {
      repository.findById.mockResolvedValue({ ...mockComment, authorId: 'other-user' })

      await expect(
        service.remove('comment-1', 'user-1', false)
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.remove('comment-1', 'user-1', false)
      ).rejects.toThrow('Voce nao pode remover este comentario')
    })
  })
})
