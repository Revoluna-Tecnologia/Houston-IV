import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ParticipantRole } from '@prisma/client'
import { ParticipantsRepository } from '../participants.repository'
import { PrismaService } from '../../../prisma/prisma.service'

describe('ParticipantsRepository', () => {
  let repository: ParticipantsRepository
  let prisma: {
    chatParticipant: {
      create: Mock
      findUnique: Mock
      findFirst: Mock
      findMany: Mock
      update: Mock
      updateMany: Mock
    }
  }

  const mockParticipant = {
    id: 'participant-1',
    conversationId: 'conv-1',
    userId: 'user-1',
    medicoId: null,
    phoneNumber: '5511999999999',
    role: ParticipantRole.admin,
    isMuted: false,
    unreadCount: 0,
    lastReadAt: null,
    joinedAt: new Date(),
    leftAt: null,
    medico: null,
  }

  beforeEach(() => {
    prisma = {
      chatParticipant: {
        create: vi.fn().mockResolvedValue(mockParticipant),
        findUnique: vi.fn().mockResolvedValue(mockParticipant),
        findFirst: vi.fn().mockResolvedValue(mockParticipant),
        findMany: vi.fn().mockResolvedValue([mockParticipant]),
        update: vi.fn().mockResolvedValue(mockParticipant),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }

    repository = new ParticipantsRepository(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('should create a new participant', async () => {
      const data = {
        conversationId: 'conv-1',
        userId: 'user-1',
        phoneNumber: '11999999999',
        role: ParticipantRole.admin,
      }

      const result = await repository.create(data)

      expect(result).toEqual(mockParticipant)
      expect(prisma.chatParticipant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId: 'conv-1',
          userId: 'user-1',
          phoneNumber: '5511999999999', // normalized
          role: ParticipantRole.admin,
        }),
        include: {
          medico: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
        },
      })
    })

    it('should normalize phone number', async () => {
      const data = {
        conversationId: 'conv-1',
        phoneNumber: '(11) 99999-9999',
      }

      await repository.create(data)

      expect(prisma.chatParticipant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '5511999999999',
        }),
        include: expect.any(Object),
      })
    })

    it('should default role to member', async () => {
      const data = {
        conversationId: 'conv-1',
        phoneNumber: '11999999999',
      }

      await repository.create(data)

      expect(prisma.chatParticipant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: ParticipantRole.member,
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('createMany', () => {
    it('should create multiple participants', async () => {
      const participants = [
        { conversationId: 'conv-1', phoneNumber: '11999999999' },
        { conversationId: 'conv-1', phoneNumber: '11888888888' },
      ]

      const result = await repository.createMany(participants)

      expect(result).toHaveLength(2)
      expect(prisma.chatParticipant.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('findById', () => {
    it('should find participant by id', async () => {
      const result = await repository.findById('participant-1')

      expect(result).toEqual(mockParticipant)
      expect(prisma.chatParticipant.findUnique).toHaveBeenCalledWith({
        where: { id: 'participant-1' },
        include: {
          medico: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },
        },
      })
    })

    it('should return null when not found', async () => {
      prisma.chatParticipant.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByConversationAndPhone', () => {
    it('should find participant by conversation and phone', async () => {
      const result = await repository.findByConversationAndPhone(
        'conv-1',
        '11999999999'
      )

      expect(result).toEqual(mockParticipant)
      expect(prisma.chatParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          phoneNumber: '5511999999999',
          leftAt: null,
        },
        include: expect.any(Object),
      })
    })
  })

  describe('findByConversationAndUser', () => {
    it('should find participant by conversation and user', async () => {
      const result = await repository.findByConversationAndUser('conv-1', 'user-1')

      expect(result).toEqual(mockParticipant)
      expect(prisma.chatParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          userId: 'user-1',
          leftAt: null,
        },
        include: expect.any(Object),
      })
    })
  })

  describe('findByConversation', () => {
    it('should find all participants in conversation', async () => {
      const result = await repository.findByConversation('conv-1')

      expect(result).toHaveLength(1)
      expect(prisma.chatParticipant.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          leftAt: null,
        },
        include: expect.any(Object),
        orderBy: { joinedAt: 'asc' },
      })
    })

    it('should include left participants when requested', async () => {
      const result = await repository.findByConversation('conv-1', true)

      expect(result).toHaveLength(1)
      expect(prisma.chatParticipant.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
        },
        include: expect.any(Object),
        orderBy: { joinedAt: 'asc' },
      })
    })
  })

  describe('update', () => {
    it('should update participant', async () => {
      const data = { role: ParticipantRole.admin }

      const result = await repository.update('participant-1', data)

      expect(result).toEqual(mockParticipant)
      expect(prisma.chatParticipant.update).toHaveBeenCalledWith({
        where: { id: 'participant-1' },
        data,
      })
    })

    it('should update mute status', async () => {
      const data = { isMuted: true }

      await repository.update('participant-1', data)

      expect(prisma.chatParticipant.update).toHaveBeenCalledWith({
        where: { id: 'participant-1' },
        data: { isMuted: true },
      })
    })
  })

  describe('remove', () => {
    it('should soft delete participant', async () => {
      await repository.remove('participant-1')

      expect(prisma.chatParticipant.update).toHaveBeenCalledWith({
        where: { id: 'participant-1' },
        data: { leftAt: expect.any(Date) },
      })
    })
  })

  describe('resetUnreadCount', () => {
    it('should reset unread count for participant', async () => {
      await repository.resetUnreadCount('conv-1', 'user-1')

      expect(prisma.chatParticipant.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          userId: 'user-1',
        },
        data: {
          unreadCount: 0,
          lastReadAt: expect.any(Date),
        },
      })
    })
  })

  describe('incrementUnreadExcept', () => {
    it('should increment unread for all except sender', async () => {
      await repository.incrementUnreadExcept('conv-1', '11999999999')

      expect(prisma.chatParticipant.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          phoneNumber: { not: '5511999999999' },
          leftAt: null,
        },
        data: {
          unreadCount: { increment: 1 },
        },
      })
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count for participant', async () => {
      prisma.chatParticipant.findFirst.mockResolvedValue({ unreadCount: 5 })

      const result = await repository.getUnreadCount('conv-1', 'user-1')

      expect(result).toBe(5)
      expect(prisma.chatParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          userId: 'user-1',
          leftAt: null,
        },
        select: { unreadCount: true },
      })
    })

    it('should return 0 when participant not found', async () => {
      prisma.chatParticipant.findFirst.mockResolvedValue(null)

      const result = await repository.getUnreadCount('conv-1', 'user-1')

      expect(result).toBe(0)
    })
  })
})
