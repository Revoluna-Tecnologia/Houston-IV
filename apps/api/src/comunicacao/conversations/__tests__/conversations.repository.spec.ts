import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ConversationType } from '@prisma/client'
import { ConversationsRepository } from '../conversations.repository'
import { PrismaService } from '../../../prisma/prisma.service'

describe('ConversationsRepository', () => {
  let repository: ConversationsRepository
  let prisma: {
    conversation: {
      create: Mock
      findUnique: Mock
      findFirst: Mock
      findMany: Mock
      update: Mock
      delete: Mock
      count: Mock
    }
    chatParticipant: {
      findFirst: Mock
      findMany: Mock
    }
  }

  const mockConversation = {
    id: 'conv-1',
    type: ConversationType.direct,
    name: null,
    grupoId: 'grupo-1',
    createdById: 'user-1',
    isArchived: false,
    lastMessageAt: new Date(),
    lastMessagePreview: 'Hello',
    zapsterGroupId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [],
  }

  beforeEach(() => {
    prisma = {
      conversation: {
        create: vi.fn().mockResolvedValue(mockConversation),
        findUnique: vi.fn().mockResolvedValue(mockConversation),
        findFirst: vi.fn().mockResolvedValue(mockConversation),
        findMany: vi.fn().mockResolvedValue([mockConversation]),
        update: vi.fn().mockResolvedValue(mockConversation),
        delete: vi.fn().mockResolvedValue(mockConversation),
        count: vi.fn().mockResolvedValue(1),
      },
      chatParticipant: {
        findFirst: vi.fn().mockResolvedValue({ id: 'participant-1' }),
        findMany: vi.fn().mockResolvedValue([{ conversationId: 'conv-1' }]),
      },
    }

    repository = new ConversationsRepository(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('should create a new conversation', async () => {
      const data = {
        type: ConversationType.direct,
        createdById: 'user-1',
        grupoId: 'grupo-1',
      }

      const result = await repository.create(data)

      expect(result).toEqual(mockConversation)
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ConversationType.direct,
          createdById: 'user-1',
          grupoId: 'grupo-1',
        }),
      })
    })

    it('should create a group conversation with name', async () => {
      const data = {
        type: ConversationType.group,
        name: 'Group Chat',
        createdById: 'user-1',
        grupoId: 'grupo-1',
      }

      await repository.create(data)

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ConversationType.group,
          name: 'Group Chat',
        }),
      })
    })
  })

  describe('findById', () => {
    it('should find conversation by id with participants', async () => {
      const result = await repository.findById('conv-1')

      expect(result).toEqual(mockConversation)
      expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        include: {
          participants: {
            where: { leftAt: null },
            include: {
              medico: {
                select: {
                  id: true,
                  nome: true,
                  telefone: true,
                },
              },
            },
          },
        },
      })
    })

    it('should return null when not found', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByZapsterGroupId', () => {
    it('should find conversation by zapster group id', async () => {
      const result = await repository.findByZapsterGroupId('zapster-123')

      expect(result).toEqual(mockConversation)
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: { zapsterGroupId: 'zapster-123' },
        include: expect.any(Object),
      })
    })
  })

  describe('findDirectByPhone', () => {
    it('should find direct conversation by phones', async () => {
      const result = await repository.findDirectByPhone(
        'grupo-1',
        '11999999999',
        '11888888888'
      )

      expect(result).toEqual(mockConversation)
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          type: 'direct',
          grupoId: 'grupo-1',
          AND: [
            {
              participants: {
                some: {
                  phoneNumber: '5511999999999',
                  leftAt: null,
                },
              },
            },
            {
              participants: {
                some: {
                  phoneNumber: '5511888888888',
                  leftAt: null,
                },
              },
            },
          ],
        },
        include: expect.any(Object),
      })
    })
  })

  describe('findDirectByParticipantPhone', () => {
    it('should find direct conversation by participant phone', async () => {
      const result = await repository.findDirectByParticipantPhone('11999999999')

      expect(result).toEqual(mockConversation)
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          type: 'direct',
          participants: {
            some: {
              phoneNumber: '5511999999999',
              leftAt: null,
            },
          },
        },
        include: expect.any(Object),
      })
    })
  })

  describe('findAll', () => {
    it('should find all conversations with pagination', async () => {
      const filters = {
        grupoIds: ['grupo-1'],
        userId: 'user-1',
        page: 1,
        limit: 20,
      }

      const result = await repository.findAll(filters)

      expect(result.data).toHaveLength(1)
      expect(result.meta).toEqual(
        expect.objectContaining({
          total: 1,
          page: 1,
          limit: 20,
        })
      )
      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            grupoId: { in: ['grupo-1'] },
          }),
          skip: 0,
          take: 20,
        })
      )
    })

    it('should filter by type', async () => {
      const filters = {
        type: ConversationType.group,
        grupoIds: ['grupo-1'],
        userId: 'user-1',
        page: 1,
        limit: 20,
      }

      await repository.findAll(filters)

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ConversationType.group,
          }),
        })
      )
    })

    it('should filter by archived status', async () => {
      const filters = {
        isArchived: true,
        grupoIds: ['grupo-1'],
        userId: 'user-1',
        page: 1,
        limit: 20,
      }

      await repository.findAll(filters)

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: true,
          }),
        })
      )
    })

    it('should filter by search term', async () => {
      const filters = {
        search: 'test',
        grupoIds: ['grupo-1'],
        userId: 'user-1',
        page: 1,
        limit: 20,
      }

      await repository.findAll(filters)

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              {
                participants: {
                  some: {
                    phoneNumber: { contains: 'test' },
                  },
                },
              },
            ],
          }),
        })
      )
    })

    it('should paginate correctly', async () => {
      const filters = {
        grupoIds: ['grupo-1'],
        userId: 'user-1',
        page: 2,
        limit: 10,
      }

      await repository.findAll(filters)

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('update', () => {
    it('should update conversation', async () => {
      const data = { name: 'Updated Name' }

      const result = await repository.update('conv-1', data)

      expect(result).toEqual(mockConversation)
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data,
      })
    })

    it('should update last message info', async () => {
      const data = {
        lastMessageAt: new Date(),
        lastMessagePreview: 'New message',
      }

      await repository.update('conv-1', data)

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data,
      })
    })
  })

  describe('delete', () => {
    it('should delete conversation', async () => {
      await repository.delete('conv-1')

      expect(prisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
      })
    })
  })

  describe('isParticipant', () => {
    it('should return true when user is participant', async () => {
      const result = await repository.isParticipant('conv-1', 'user-1')

      expect(result).toBe(true)
      expect(prisma.chatParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          userId: 'user-1',
          leftAt: null,
        },
      })
    })

    it('should return false when user is not participant', async () => {
      prisma.chatParticipant.findFirst.mockResolvedValue(null)

      const result = await repository.isParticipant('conv-1', 'user-2')

      expect(result).toBe(false)
    })
  })

  describe('getUserConversationIds', () => {
    it('should return conversation ids for user', async () => {
      const result = await repository.getUserConversationIds('user-1')

      expect(result).toEqual(['conv-1'])
      expect(prisma.chatParticipant.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          leftAt: null,
        },
        select: {
          conversationId: true,
        },
      })
    })
  })
})
