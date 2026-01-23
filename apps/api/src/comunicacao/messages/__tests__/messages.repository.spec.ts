import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { MessageType, MessageStatus } from '@prisma/client'
import { MessagesRepository } from '../messages.repository'
import { PrismaService } from '../../../prisma/prisma.service'

describe('MessagesRepository', () => {
  let repository: MessagesRepository
  let prisma: {
    chatMessage: {
      create: Mock
      findUnique: Mock
      findFirst: Mock
      findMany: Mock
      update: Mock
      updateMany: Mock
      count: Mock
    }
  }

  const mockMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderPhone: '5511999999999',
    content: 'Hello World',
    messageType: MessageType.text,
    replyToId: null,
    replyTo: null,
    metadata: {},
    status: MessageStatus.sent,
    whatsappMessageId: 'wamid.123456',
    createdAt: new Date(),
    deliveredAt: null,
    readAt: null,
    deletedAt: null,
  }

  beforeEach(() => {
    prisma = {
      chatMessage: {
        create: vi.fn().mockResolvedValue(mockMessage),
        findUnique: vi.fn().mockResolvedValue(mockMessage),
        findFirst: vi.fn().mockResolvedValue(mockMessage),
        findMany: vi.fn().mockResolvedValue([mockMessage]),
        update: vi.fn().mockResolvedValue(mockMessage),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        count: vi.fn().mockResolvedValue(1),
      },
    }

    repository = new MessagesRepository(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('should create a new message', async () => {
      const data = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderPhone: '5511999999999',
        content: 'Hello World',
        messageType: MessageType.text,
      }

      const result = await repository.create(data)

      expect(result).toEqual(mockMessage)
      expect(prisma.chatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderPhone: '5511999999999',
          content: 'Hello World',
          messageType: MessageType.text,
          status: MessageStatus.sending,
        }),
        include: {
          replyTo: {
            select: {
              id: true,
              content: true,
              messageType: true,
              senderPhone: true,
            },
          },
        },
      })
    })

    it('should create message with reply', async () => {
      const data = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderPhone: '5511999999999',
        content: 'Reply message',
        replyToId: 'msg-original',
      }

      await repository.create(data)

      expect(prisma.chatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          replyToId: 'msg-original',
        }),
        include: expect.any(Object),
      })
    })

    it('should create message with metadata', async () => {
      const data = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderPhone: '5511999999999',
        content: 'Image message',
        messageType: MessageType.image,
        metadata: {
          fileUrl: 'https://example.com/image.jpg',
          mimeType: 'image/jpeg',
        },
      }

      await repository.create(data)

      expect(prisma.chatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {
            fileUrl: 'https://example.com/image.jpg',
            mimeType: 'image/jpeg',
          },
        }),
        include: expect.any(Object),
      })
    })

    it('should create message with whatsapp id', async () => {
      const data = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderPhone: '5511999999999',
        content: 'Hello',
        whatsappMessageId: 'wamid.123456',
      }

      await repository.create(data)

      expect(prisma.chatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          whatsappMessageId: 'wamid.123456',
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('findById', () => {
    it('should find message by id', async () => {
      const result = await repository.findById('msg-1')

      expect(result).toEqual(mockMessage)
      expect(prisma.chatMessage.findUnique).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        include: {
          replyTo: {
            select: {
              id: true,
              content: true,
              messageType: true,
              senderPhone: true,
            },
          },
        },
      })
    })

    it('should return null when not found', async () => {
      prisma.chatMessage.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByWhatsappId', () => {
    it('should find message by whatsapp id', async () => {
      const result = await repository.findByWhatsappId('wamid.123456')

      expect(result).toEqual(mockMessage)
      expect(prisma.chatMessage.findFirst).toHaveBeenCalledWith({
        where: { whatsappMessageId: 'wamid.123456' },
        include: expect.any(Object),
      })
    })
  })

  describe('findByConversation', () => {
    it('should find messages by conversation with pagination', async () => {
      const filters = {
        conversationId: 'conv-1',
        page: 1,
        limit: 50,
      }

      const result = await repository.findByConversation(filters)

      expect(result.data).toHaveLength(1)
      expect(result.meta).toEqual(
        expect.objectContaining({
          total: 1,
          page: 1,
          limit: 50,
        })
      )
      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            conversationId: 'conv-1',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 50,
        })
      )
    })

    it('should filter by message type', async () => {
      const filters = {
        conversationId: 'conv-1',
        messageType: MessageType.image,
        page: 1,
        limit: 50,
      }

      await repository.findByConversation(filters)

      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            messageType: MessageType.image,
          }),
        })
      )
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      const filters = {
        conversationId: 'conv-1',
        startDate,
        endDate,
        page: 1,
        limit: 50,
      }

      await repository.findByConversation(filters)

      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should filter by search term', async () => {
      const filters = {
        conversationId: 'conv-1',
        search: 'hello',
        page: 1,
        limit: 50,
      }

      await repository.findByConversation(filters)

      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            content: { contains: 'hello', mode: 'insensitive' },
          }),
        })
      )
    })

    it('should support cursor pagination', async () => {
      const filters = {
        conversationId: 'conv-1',
        cursor: 'msg-last',
        page: 1,
        limit: 50,
      }

      await repository.findByConversation(filters)

      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { lt: 'msg-last' },
          }),
          skip: 0, // No skip when using cursor
        })
      )
    })

    it('should paginate correctly', async () => {
      const filters = {
        conversationId: 'conv-1',
        page: 2,
        limit: 10,
      }

      await repository.findByConversation(filters)

      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('update', () => {
    it('should update message', async () => {
      const data = { status: MessageStatus.delivered }

      const result = await repository.update('msg-1', data)

      expect(result).toEqual(mockMessage)
      expect(prisma.chatMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data,
      })
    })
  })

  describe('updateStatus', () => {
    it('should update status to delivered', async () => {
      await repository.updateStatus('msg-1', MessageStatus.delivered)

      expect(prisma.chatMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: MessageStatus.delivered,
          deliveredAt: expect.any(Date),
        },
      })
    })

    it('should update status to read', async () => {
      await repository.updateStatus('msg-1', MessageStatus.read)

      expect(prisma.chatMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: MessageStatus.read,
          readAt: expect.any(Date),
        },
      })
    })

    it('should update status to sent without timestamps', async () => {
      await repository.updateStatus('msg-1', MessageStatus.sent)

      expect(prisma.chatMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: MessageStatus.sent,
        },
      })
    })
  })

  describe('softDelete', () => {
    it('should soft delete message', async () => {
      await repository.softDelete('msg-1')

      expect(prisma.chatMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all messages as read', async () => {
      await repository.markAllAsRead('conv-1', 'user-1')

      expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          senderId: { not: 'user-1' },
          status: { not: MessageStatus.read },
          deletedAt: null,
        },
        data: {
          status: MessageStatus.read,
          readAt: expect.any(Date),
        },
      })
    })
  })

  describe('countUnread', () => {
    it('should count unread messages', async () => {
      prisma.chatMessage.count.mockResolvedValue(5)

      const result = await repository.countUnread('conv-1', 'user-1')

      expect(result).toBe(5)
      expect(prisma.chatMessage.count).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          senderId: { not: 'user-1' },
          status: { not: MessageStatus.read },
          deletedAt: null,
        },
      })
    })
  })
})
