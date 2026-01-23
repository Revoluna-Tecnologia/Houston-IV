import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { CommentsRepository } from '../comments.repository'
import { PrismaService } from '../../../prisma/prisma.service'

describe('CommentsRepository', () => {
  let repository: CommentsRepository
  let prisma: {
    ticketComment: {
      create: Mock
      findMany: Mock
      findUnique: Mock
      update: Mock
      delete: Mock
      count: Mock
    }
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
    prisma = {
      ticketComment: {
        create: vi.fn().mockResolvedValue(mockComment),
        findMany: vi.fn().mockResolvedValue([mockComment]),
        findUnique: vi.fn().mockResolvedValue(mockComment),
        update: vi.fn().mockResolvedValue({ ...mockComment, content: 'Updated' }),
        delete: vi.fn().mockResolvedValue(mockComment),
        count: vi.fn().mockResolvedValue(1),
      },
    }

    repository = new CommentsRepository(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('should create a comment', async () => {
      const dto = { content: 'Test comment', isInternal: false }

      const result = await repository.create('ticket-1', dto, 'user-1', 'John Doe')

      expect(result).toEqual(mockComment)
      expect(prisma.ticketComment.create).toHaveBeenCalledWith({
        data: {
          content: 'Test comment',
          isInternal: false,
          ticketId: 'ticket-1',
          authorId: 'user-1',
          authorName: 'John Doe',
        },
      })
    })

    it('should default isInternal to false', async () => {
      const dto = { content: 'Test comment' }

      await repository.create('ticket-1', dto, 'user-1', 'John Doe')

      expect(prisma.ticketComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isInternal: false,
        }),
      })
    })
  })

  describe('findByTicketId', () => {
    it('should find all comments for ticket', async () => {
      const result = await repository.findByTicketId('ticket-1', true)

      expect(result).toHaveLength(1)
      expect(prisma.ticketComment.findMany).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1' },
        orderBy: { createdAt: 'asc' },
      })
    })

    it('should exclude internal comments when requested', async () => {
      await repository.findByTicketId('ticket-1', false)

      expect(prisma.ticketComment.findMany).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1', isInternal: false },
        orderBy: { createdAt: 'asc' },
      })
    })
  })

  describe('findById', () => {
    it('should find comment by id', async () => {
      const result = await repository.findById('comment-1')

      expect(result).toEqual(mockComment)
      expect(prisma.ticketComment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      })
    })

    it('should return null when not found', async () => {
      prisma.ticketComment.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update comment content', async () => {
      const result = await repository.update('comment-1', 'Updated content')

      expect(result.content).toBe('Updated')
      expect(prisma.ticketComment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: 'Updated content' },
      })
    })
  })

  describe('delete', () => {
    it('should delete comment', async () => {
      await repository.delete('comment-1')

      expect(prisma.ticketComment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      })
    })
  })

  describe('countByTicketId', () => {
    it('should count comments for ticket', async () => {
      const result = await repository.countByTicketId('ticket-1')

      expect(result).toBe(1)
      expect(prisma.ticketComment.count).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1' },
      })
    })
  })
})
