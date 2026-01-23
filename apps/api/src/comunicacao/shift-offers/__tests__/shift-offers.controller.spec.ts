import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShiftOffersController } from '../shift-offers.controller'
import { ShiftOffersService } from '../shift-offers.service'
import { ShiftOfferStatus } from '@prisma/client'
import { AuthenticatedUser } from '../../../auth/types/auth.types'

describe('ShiftOffersController', () => {
  let controller: ShiftOffersController
  let service: ShiftOffersService

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

  const mockShiftOffer = {
    id: 'offer-1',
    vagaId: 'vaga-1',
    vaga: {
      id: 'vaga-1',
      data: new Date('2024-01-15'),
      horaInicio: '08:00',
      horaFim: '12:00',
      valor: 500,
      hospitalNome: 'Hospital Test',
      setorNome: 'UTI',
      especialidadeNome: 'Cardiologia',
    },
    messageId: 'msg-1',
    senderId: 'user-1',
    recipientId: 'user-2',
    recipientMedicoId: 'medico-1',
    recipientMedicoName: 'Dr. Test',
    recipientPhone: '+5511999999999',
    status: ShiftOfferStatus.pending,
    expiresAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-15'),
    respondedAt: undefined,
    isExpired: false,
    canRespond: true,
  }

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      respond: vi.fn(),
      cancel: vi.fn(),
    } as unknown as ShiftOffersService

    controller = new ShiftOffersController(service)
  })

  describe('create', () => {
    it('should create a shift offer', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientMedicoId: 'medico-1',
        customMessage: 'Oferta especial',
      }

      vi.mocked(service.create).mockResolvedValue(mockShiftOffer)

      const result = await controller.create(dto, mockUser)

      expect(service.create).toHaveBeenCalledWith(dto, mockUser)
      expect(result).toEqual(mockShiftOffer)
    })

    it('should create offer with phone instead of medico', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientPhone: '+5511888888888',
      }

      vi.mocked(service.create).mockResolvedValue(mockShiftOffer)

      await controller.create(dto, mockUser)

      expect(service.create).toHaveBeenCalledWith(dto, mockUser)
    })

    it('should create offer with custom expiration', async () => {
      const dto = {
        vagaId: 'vaga-1',
        conversationId: 'conv-1',
        recipientMedicoId: 'medico-1',
        expiresAt: '2024-01-20T00:00:00.000Z',
      }

      vi.mocked(service.create).mockResolvedValue(mockShiftOffer)

      await controller.create(dto, mockUser)

      expect(service.create).toHaveBeenCalledWith(dto, mockUser)
    })
  })

  describe('findAll', () => {
    it('should return paginated list of shift offers', async () => {
      const query = { page: 1, limit: 10 }
      const expected = {
        data: [mockShiftOffer],
        total: 1,
      }

      vi.mocked(service.findAll).mockResolvedValue(expected)

      const result = await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
      expect(result).toEqual(expected)
    })

    it('should filter by status', async () => {
      const query = { status: ShiftOfferStatus.pending }

      vi.mocked(service.findAll).mockResolvedValue({ data: [mockShiftOffer], total: 1 })

      await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })

    it('should filter by vagaId', async () => {
      const query = { vagaId: 'vaga-1' }

      vi.mocked(service.findAll).mockResolvedValue({ data: [mockShiftOffer], total: 1 })

      await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })

    it('should filter sent by me', async () => {
      const query = { sentByMe: true }

      vi.mocked(service.findAll).mockResolvedValue({ data: [mockShiftOffer], total: 1 })

      await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })

    it('should filter received by me', async () => {
      const query = { receivedByMe: true }

      vi.mocked(service.findAll).mockResolvedValue({ data: [mockShiftOffer], total: 1 })

      await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })
  })

  describe('findOne', () => {
    it('should return a shift offer by id', async () => {
      vi.mocked(service.findOne).mockResolvedValue(mockShiftOffer)

      const result = await controller.findOne('offer-1', mockUser)

      expect(service.findOne).toHaveBeenCalledWith('offer-1', mockUser)
      expect(result).toEqual(mockShiftOffer)
    })
  })

  describe('respond', () => {
    it('should accept a shift offer', async () => {
      const dto = { action: 'accept' as const }
      const acceptedOffer = {
        ...mockShiftOffer,
        status: ShiftOfferStatus.accepted,
        respondedAt: new Date(),
        canRespond: false,
      }

      vi.mocked(service.respond).mockResolvedValue(acceptedOffer)

      const result = await controller.respond('offer-1', dto, mockUser)

      expect(service.respond).toHaveBeenCalledWith('offer-1', dto, mockUser)
      expect(result.status).toBe(ShiftOfferStatus.accepted)
    })

    it('should reject a shift offer', async () => {
      const dto = { action: 'reject' as const, reason: 'Conflito de horário' }
      const rejectedOffer = {
        ...mockShiftOffer,
        status: ShiftOfferStatus.rejected,
        respondedAt: new Date(),
        canRespond: false,
      }

      vi.mocked(service.respond).mockResolvedValue(rejectedOffer)

      const result = await controller.respond('offer-1', dto, mockUser)

      expect(service.respond).toHaveBeenCalledWith('offer-1', dto, mockUser)
      expect(result.status).toBe(ShiftOfferStatus.rejected)
    })
  })

  describe('cancel', () => {
    it('should cancel a shift offer', async () => {
      vi.mocked(service.cancel).mockResolvedValue(undefined)

      await controller.cancel('offer-1', mockUser)

      expect(service.cancel).toHaveBeenCalledWith('offer-1', mockUser)
    })
  })
})
