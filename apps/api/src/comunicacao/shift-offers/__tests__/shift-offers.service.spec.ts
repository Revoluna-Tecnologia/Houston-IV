import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShiftOffersService } from '../shift-offers.service'
import { ShiftOffersRepository, ShiftOfferWithRelations } from '../shift-offers.repository'
import { MessagesService } from '../../messages/messages.service'
import { ShiftOfferStatus, MessageType } from '@prisma/client'
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { AuthenticatedUser } from '../../../auth/types/auth.types'
import { Decimal } from '@prisma/client/runtime/library'

describe('ShiftOffersService', () => {
  let service: ShiftOffersService
  let repository: ShiftOffersRepository
  let messagesService: MessagesService

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'admin',
    permissions: [],
    grupoId: 'grupo-1',
    hospitalIds: ['hospital-1'],
    setorIds: ['setor-1'],
  }

  const createMockOffer = (overrides = {}): ShiftOfferWithRelations => ({
    id: 'offer-1',
    vagaId: 'vaga-1',
    messageId: 'msg-1',
    senderId: 'user-1',
    recipientId: 'user-2',
    recipientMedicoId: 'medico-1',
    recipientPhone: '+5511999999999',
    status: ShiftOfferStatus.pending,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    respondedAt: null,
    vaga: {
      id: 'vaga-1',
      data: new Date('2024-01-15'),
      horaInicio: '08:00',
      horaFim: '12:00',
      valor: new Decimal(500),
      hospital: { nome: 'Hospital Test' },
      setor: { nome: 'UTI' },
      especialidade: { nome: 'Cardiologia' },
    },
    recipientMedico: {
      id: 'medico-1',
      nome: 'Dr. Test',
    },
    ...overrides,
  })

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByMessageId: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
      updateMessageId: vi.fn(),
      expirePendingOffers: vi.fn(),
      cancel: vi.fn(),
    } as unknown as ShiftOffersRepository

    messagesService = {
      send: vi.fn(),
    } as unknown as MessagesService

    service = new ShiftOffersService(repository, messagesService)
  })

  describe('create', () => {
    it('should create a shift offer with medico recipient', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientMedicoId: 'medico-1',
      }

      const createdOffer = { id: 'offer-1', vagaId: 'vaga-1' }
      const fullOffer = createMockOffer()
      const message = { id: 'msg-1' }

      vi.mocked(repository.create).mockResolvedValue(createdOffer as any)
      vi.mocked(repository.findById).mockResolvedValue(fullOffer)
      vi.mocked(messagesService.send).mockResolvedValue(message as any)
      vi.mocked(repository.updateMessageId).mockResolvedValue({} as any)

      const result = await service.create(dto, mockUser)

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vagaId: 'vaga-1',
          senderId: 'user-1',
          recipientMedicoId: 'medico-1',
          recipientPhone: '',
        })
      )
      expect(messagesService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          messageType: MessageType.shift_offer,
        }),
        mockUser
      )
      expect(repository.updateMessageId).toHaveBeenCalledWith('offer-1', 'msg-1')
      expect(result.id).toBe('offer-1')
    })

    it('should create a shift offer with phone recipient', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientPhone: '+5511888888888',
      }

      const createdOffer = { id: 'offer-1' }
      const fullOffer = createMockOffer({ recipientPhone: '+5511888888888' })
      const message = { id: 'msg-1' }

      vi.mocked(repository.create).mockResolvedValue(createdOffer as any)
      vi.mocked(repository.findById).mockResolvedValue(fullOffer)
      vi.mocked(messagesService.send).mockResolvedValue(message as any)
      vi.mocked(repository.updateMessageId).mockResolvedValue({} as any)

      await service.create(dto, mockUser)

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientPhone: '+5511888888888',
        })
      )
    })

    it('should throw BadRequestException if no recipient specified', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
      }

      await expect(service.create(dto, mockUser)).rejects.toThrow(BadRequestException)
    })

    it('should use custom expiration date if provided', async () => {
      const customExpiry = '2024-01-20T00:00:00.000Z'
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientMedicoId: 'medico-1',
        expiresAt: customExpiry,
      }

      const createdOffer = { id: 'offer-1' }
      const fullOffer = createMockOffer()
      const message = { id: 'msg-1' }

      vi.mocked(repository.create).mockResolvedValue(createdOffer as any)
      vi.mocked(repository.findById).mockResolvedValue(fullOffer)
      vi.mocked(messagesService.send).mockResolvedValue(message as any)
      vi.mocked(repository.updateMessageId).mockResolvedValue({} as any)

      await service.create(dto, mockUser)

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: new Date(customExpiry),
        })
      )
    })

    it('should include custom message in offer message', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientMedicoId: 'medico-1',
        customMessage: 'Urgente! Preciso de cobertura.',
      }

      const createdOffer = { id: 'offer-1' }
      const fullOffer = createMockOffer()
      const message = { id: 'msg-1' }

      vi.mocked(repository.create).mockResolvedValue(createdOffer as any)
      vi.mocked(repository.findById).mockResolvedValue(fullOffer)
      vi.mocked(messagesService.send).mockResolvedValue(message as any)
      vi.mocked(repository.updateMessageId).mockResolvedValue({} as any)

      await service.create(dto, mockUser)

      expect(messagesService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Urgente! Preciso de cobertura.'),
        }),
        mockUser
      )
    })
  })

  describe('findAll', () => {
    it('should return paginated list of offers', async () => {
      const query = { page: 1, limit: 10 }
      const offers = [createMockOffer()]

      vi.mocked(repository.findAll).mockResolvedValue({
        data: offers,
        total: 1,
      })

      const result = await service.findAll(query, mockUser)

      expect(repository.findAll).toHaveBeenCalledWith(mockUser.id, query)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should transform offers to response DTOs', async () => {
      const query = {}
      const offer = createMockOffer()

      vi.mocked(repository.findAll).mockResolvedValue({
        data: [offer],
        total: 1,
      })

      const result = await service.findAll(query, mockUser)

      expect(result.data[0]).toHaveProperty('id', 'offer-1')
      expect(result.data[0]).toHaveProperty('vaga')
      expect(result.data[0]).toHaveProperty('isExpired')
      expect(result.data[0]).toHaveProperty('canRespond')
    })
  })

  describe('findOne', () => {
    it('should return offer when user is sender', async () => {
      const offer = createMockOffer({ senderId: mockUser.id })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      const result = await service.findOne('offer-1', mockUser)

      expect(result.id).toBe('offer-1')
    })

    it('should return offer when user is recipient', async () => {
      const offer = createMockOffer({ recipientId: mockUser.id, senderId: 'other-user' })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      const result = await service.findOne('offer-1', mockUser)

      expect(result.id).toBe('offer-1')
    })

    it('should return offer when user is recipientMedico', async () => {
      const offer = createMockOffer({
        recipientMedicoId: mockUser.id,
        senderId: 'other-user',
        recipientId: null,
      })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      const result = await service.findOne('offer-1', mockUser)

      expect(result.id).toBe('offer-1')
    })

    it('should throw NotFoundException when offer not found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null)

      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException when user has no access', async () => {
      const offer = createMockOffer({
        senderId: 'other-user',
        recipientId: 'another-user',
        recipientMedicoId: 'some-medico',
      })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      await expect(service.findOne('offer-1', mockUser)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('respond', () => {
    it('should accept offer when user is recipient', async () => {
      const offer = createMockOffer({ recipientId: mockUser.id, senderId: 'other-user' })
      const updatedOffer = { ...offer, status: ShiftOfferStatus.accepted }

      vi.mocked(repository.findById)
        .mockResolvedValueOnce(offer)
        .mockResolvedValueOnce(updatedOffer as any)
      vi.mocked(repository.updateStatus).mockResolvedValue({} as any)

      const result = await service.respond('offer-1', { action: 'accept' }, mockUser)

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'offer-1',
        ShiftOfferStatus.accepted,
        expect.any(Date)
      )
      expect(result.status).toBe(ShiftOfferStatus.accepted)
    })

    it('should reject offer when user is recipientMedico', async () => {
      const offer = createMockOffer({
        recipientMedicoId: mockUser.id,
        senderId: 'other-user',
        recipientId: null,
      })
      const updatedOffer = { ...offer, status: ShiftOfferStatus.rejected }

      vi.mocked(repository.findById)
        .mockResolvedValueOnce(offer)
        .mockResolvedValueOnce(updatedOffer as any)
      vi.mocked(repository.updateStatus).mockResolvedValue({} as any)

      const result = await service.respond('offer-1', { action: 'reject' }, mockUser)

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'offer-1',
        ShiftOfferStatus.rejected,
        expect.any(Date)
      )
      expect(result.status).toBe(ShiftOfferStatus.rejected)
    })

    it('should throw ForbiddenException when user is not recipient', async () => {
      const offer = createMockOffer({
        senderId: 'sender',
        recipientId: 'other-user',
        recipientMedicoId: 'some-medico',
      })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      await expect(service.respond('offer-1', { action: 'accept' }, mockUser)).rejects.toThrow(
        ForbiddenException
      )
    })

    it('should throw BadRequestException when offer not pending', async () => {
      const offer = createMockOffer({
        recipientId: mockUser.id,
        status: ShiftOfferStatus.accepted,
      })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      await expect(service.respond('offer-1', { action: 'accept' }, mockUser)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should throw BadRequestException when offer expired', async () => {
      const offer = createMockOffer({
        recipientId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000),
      })

      vi.mocked(repository.findById).mockResolvedValue(offer)
      vi.mocked(repository.updateStatus).mockResolvedValue({} as any)

      await expect(service.respond('offer-1', { action: 'accept' }, mockUser)).rejects.toThrow(
        BadRequestException
      )

      expect(repository.updateStatus).toHaveBeenCalledWith('offer-1', ShiftOfferStatus.expired)
    })
  })

  describe('cancel', () => {
    it('should cancel offer when user is sender', async () => {
      const offer = createMockOffer({ senderId: mockUser.id })

      vi.mocked(repository.findById).mockResolvedValue(offer)
      vi.mocked(repository.cancel).mockResolvedValue({} as any)

      await service.cancel('offer-1', mockUser)

      expect(repository.cancel).toHaveBeenCalledWith('offer-1')
    })

    it('should throw ForbiddenException when user is not sender', async () => {
      const offer = createMockOffer({ senderId: 'other-user' })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      await expect(service.cancel('offer-1', mockUser)).rejects.toThrow(ForbiddenException)
    })

    it('should throw BadRequestException when offer not pending', async () => {
      const offer = createMockOffer({
        senderId: mockUser.id,
        status: ShiftOfferStatus.accepted,
      })

      vi.mocked(repository.findById).mockResolvedValue(offer)

      await expect(service.cancel('offer-1', mockUser)).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when offer not found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null)

      await expect(service.cancel('non-existent', mockUser)).rejects.toThrow(NotFoundException)
    })
  })

  describe('expirePending', () => {
    it('should expire pending offers', async () => {
      vi.mocked(repository.expirePendingOffers).mockResolvedValue(5)

      const count = await service.expirePending()

      expect(repository.expirePendingOffers).toHaveBeenCalled()
      expect(count).toBe(5)
    })

    it('should return 0 when no offers to expire', async () => {
      vi.mocked(repository.expirePendingOffers).mockResolvedValue(0)

      const count = await service.expirePending()

      expect(count).toBe(0)
    })
  })
})
