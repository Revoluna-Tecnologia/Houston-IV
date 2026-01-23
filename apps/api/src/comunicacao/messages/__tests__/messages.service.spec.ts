import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { MessageType, MessageStatus } from '@prisma/client'
import { MessagesService } from '../messages.service'
import { MessagesRepository } from '../messages.repository'
import { MessagesGateway } from '../messages.gateway'
import { ConversationsRepository } from '../../conversations/conversations.repository'
import { ParticipantsRepository } from '../../conversations/participants.repository'

describe('MessagesService', () => {
  let service: MessagesService
  let messagesRepository: {
    create: Mock
    findById: Mock
    findByWhatsappId: Mock
    findByConversation: Mock
    update: Mock
    updateStatus: Mock
    softDelete: Mock
    markAllAsRead: Mock
    countUnread: Mock
  }
  let conversationsRepository: {
    findById: Mock
    isParticipant: Mock
    update: Mock
  }
  let participantsRepository: {
    findByConversationAndUser: Mock
    resetUnreadCount: Mock
    incrementUnreadExcept: Mock
  }
  let gateway: {
    emitNewMessage: Mock
    emitMessageStatusUpdate: Mock
    emitMessageDeleted: Mock
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    role: 'admin' as const,
    grupoIds: ['grupo-1'],
    permissions: [],
    iat: 0,
    exp: 0,
  }

  const mockConversation = {
    id: 'conv-1',
    type: 'direct',
    grupoId: 'grupo-1',
    participants: [{ userId: 'user-1', phoneNumber: '5511999999999', leftAt: null }],
  }

  const mockParticipant = {
    id: 'participant-1',
    conversationId: 'conv-1',
    userId: 'user-1',
    phoneNumber: '5511999999999',
    role: 'admin',
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
    whatsappMessageId: null,
    createdAt: new Date(),
    deliveredAt: null,
    readAt: null,
    deletedAt: null,
  }

  beforeEach(() => {
    messagesRepository = {
      create: vi.fn().mockResolvedValue(mockMessage),
      findById: vi.fn().mockResolvedValue(mockMessage),
      findByWhatsappId: vi.fn().mockResolvedValue(mockMessage),
      findByConversation: vi.fn().mockResolvedValue({
        data: [mockMessage],
        meta: { total: 1, page: 1, limit: 50, totalPages: 1, hasNext: false, hasPrev: false },
      }),
      update: vi.fn().mockResolvedValue(mockMessage),
      updateStatus: vi.fn(),
      softDelete: vi.fn(),
      markAllAsRead: vi.fn(),
      countUnread: vi.fn().mockResolvedValue(0),
    }

    conversationsRepository = {
      findById: vi.fn().mockResolvedValue(mockConversation),
      isParticipant: vi.fn().mockResolvedValue(true),
      update: vi.fn(),
    }

    participantsRepository = {
      findByConversationAndUser: vi.fn().mockResolvedValue(mockParticipant),
      resetUnreadCount: vi.fn(),
      incrementUnreadExcept: vi.fn(),
    }

    gateway = {
      emitNewMessage: vi.fn(),
      emitMessageStatusUpdate: vi.fn(),
      emitMessageDeleted: vi.fn(),
    }

    service = new MessagesService(
      messagesRepository as unknown as MessagesRepository,
      conversationsRepository as unknown as ConversationsRepository,
      participantsRepository as unknown as ParticipantsRepository,
      gateway as unknown as MessagesGateway
    )
  })

  describe('send', () => {
    it('should send a text message', async () => {
      const dto = {
        conversationId: 'conv-1',
        content: 'Hello World',
        messageType: MessageType.text,
      }

      const result = await service.send(dto, mockUser)

      expect(result.id).toBe('msg-1')
      expect(messagesRepository.create).toHaveBeenCalled()
      expect(conversationsRepository.update).toHaveBeenCalled()
      expect(participantsRepository.incrementUnreadExcept).toHaveBeenCalled()
      expect(gateway.emitNewMessage).toHaveBeenCalled()
    })

    it('should throw NotFoundException when conversation not found', async () => {
      conversationsRepository.findById.mockResolvedValue(null)

      const dto = {
        conversationId: 'non-existent',
        content: 'Hello',
        messageType: MessageType.text,
      }

      await expect(service.send(dto, mockUser)).rejects.toThrow(NotFoundException)
      await expect(service.send(dto, mockUser)).rejects.toThrow(
        'Conversa não encontrada'
      )
    })

    it('should throw ForbiddenException when not participant', async () => {
      conversationsRepository.isParticipant.mockResolvedValue(false)

      const dto = {
        conversationId: 'conv-1',
        content: 'Hello',
        messageType: MessageType.text,
      }

      await expect(service.send(dto, mockUser)).rejects.toThrow(ForbiddenException)
      await expect(service.send(dto, mockUser)).rejects.toThrow(
        'Usuário não é participante da conversa'
      )
    })

    it('should throw BadRequestException for empty text message', async () => {
      const dto = {
        conversationId: 'conv-1',
        content: '',
        messageType: MessageType.text,
      }

      await expect(service.send(dto, mockUser)).rejects.toThrow(BadRequestException)
      await expect(service.send(dto, mockUser)).rejects.toThrow(
        'Conteúdo é obrigatório para mensagens de texto'
      )
    })

    it('should throw BadRequestException for media without fileUrl', async () => {
      const dto = {
        conversationId: 'conv-1',
        content: 'Image',
        messageType: MessageType.image,
        metadata: {},
      }

      await expect(service.send(dto, mockUser)).rejects.toThrow(BadRequestException)
      await expect(service.send(dto, mockUser)).rejects.toThrow(
        'URL do arquivo é obrigatória'
      )
    })

    it('should throw BadRequestException for shift_offer without vagaId', async () => {
      const dto = {
        conversationId: 'conv-1',
        content: 'Shift offer',
        messageType: MessageType.shift_offer,
        metadata: {},
      }

      await expect(service.send(dto, mockUser)).rejects.toThrow(BadRequestException)
      await expect(service.send(dto, mockUser)).rejects.toThrow(
        'ID da vaga é obrigatório para ofertas de plantão'
      )
    })

    it('should send message with reply', async () => {
      const dto = {
        conversationId: 'conv-1',
        content: 'Reply message',
        messageType: MessageType.text,
        replyToId: 'msg-original',
      }

      await service.send(dto, mockUser)

      expect(messagesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          replyToId: 'msg-original',
        })
      )
    })

    it('should skip WhatsApp when skipWhatsApp is true', async () => {
      const dto = {
        conversationId: 'conv-1',
        content: 'Hello',
        messageType: MessageType.text,
        skipWhatsApp: true,
      }

      await service.send(dto, mockUser)

      expect(messagesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MessageStatus.sent,
        })
      )
    })
  })

  describe('findByConversation', () => {
    it('should return messages from conversation', async () => {
      const query = { page: 1, limit: 50 }

      const result = await service.findByConversation('conv-1', query, mockUser)

      expect(result.data).toHaveLength(1)
      expect(messagesRepository.findByConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          page: 1,
          limit: 50,
        })
      )
    })

    it('should throw ForbiddenException when not participant', async () => {
      conversationsRepository.isParticipant.mockResolvedValue(false)

      const query = { page: 1, limit: 50 }

      await expect(
        service.findByConversation('conv-1', query, mockUser)
      ).rejects.toThrow(ForbiddenException)
    })

    it('should filter by message type', async () => {
      const query = { messageType: MessageType.image, page: 1, limit: 50 }

      await service.findByConversation('conv-1', query, mockUser)

      expect(messagesRepository.findByConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: MessageType.image,
        })
      )
    })

    it('should filter by date range', async () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 50,
      }

      await service.findByConversation('conv-1', query, mockUser)

      expect(messagesRepository.findByConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      )
    })
  })

  describe('findOne', () => {
    it('should return a message by id', async () => {
      const result = await service.findOne('msg-1', mockUser)

      expect(result.id).toBe('msg-1')
    })

    it('should throw NotFoundException when not found', async () => {
      messagesRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(
        NotFoundException
      )
      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(
        'Mensagem não encontrada'
      )
    })

    it('should throw ForbiddenException when not participant', async () => {
      conversationsRepository.isParticipant.mockResolvedValue(false)

      await expect(service.findOne('msg-1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
      await expect(service.findOne('msg-1', mockUser)).rejects.toThrow(
        'Sem acesso a esta mensagem'
      )
    })
  })

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      await service.markAsRead('conv-1', mockUser)

      expect(messagesRepository.markAllAsRead).toHaveBeenCalledWith('conv-1', mockUser.id)
      expect(participantsRepository.resetUnreadCount).toHaveBeenCalledWith(
        'conv-1',
        mockUser.id
      )
    })

    it('should throw ForbiddenException when not participant', async () => {
      conversationsRepository.isParticipant.mockResolvedValue(false)

      await expect(service.markAsRead('conv-1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('delete', () => {
    it('should soft delete a message', async () => {
      await service.delete('msg-1', mockUser)

      expect(messagesRepository.softDelete).toHaveBeenCalledWith('msg-1')
      expect(gateway.emitMessageDeleted).toHaveBeenCalledWith('conv-1', 'msg-1')
    })

    it('should throw NotFoundException when not found', async () => {
      messagesRepository.findById.mockResolvedValue(null)

      await expect(service.delete('non-existent', mockUser)).rejects.toThrow(
        NotFoundException
      )
      await expect(service.delete('non-existent', mockUser)).rejects.toThrow(
        'Mensagem não encontrada'
      )
    })

    it('should throw ForbiddenException when not sender', async () => {
      messagesRepository.findById.mockResolvedValue({
        ...mockMessage,
        senderId: 'other-user',
      })

      await expect(service.delete('msg-1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
      await expect(service.delete('msg-1', mockUser)).rejects.toThrow(
        'Apenas o remetente pode deletar a mensagem'
      )
    })
  })

  describe('updateStatus', () => {
    it('should update message status', async () => {
      await service.updateStatus('wamid.123', MessageStatus.delivered)

      expect(messagesRepository.updateStatus).toHaveBeenCalledWith(
        'msg-1',
        MessageStatus.delivered
      )
      expect(gateway.emitMessageStatusUpdate).toHaveBeenCalledWith(
        'conv-1',
        'msg-1',
        MessageStatus.delivered
      )
    })

    it('should do nothing when message not found', async () => {
      messagesRepository.findByWhatsappId.mockResolvedValue(null)

      await service.updateStatus('wamid.unknown', MessageStatus.delivered)

      expect(messagesRepository.updateStatus).not.toHaveBeenCalled()
      expect(gateway.emitMessageStatusUpdate).not.toHaveBeenCalled()
    })
  })
})
