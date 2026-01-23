import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShiftOffersRepository } from '../shift-offers.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ShiftOfferStatus } from '@prisma/client'

describe('ShiftOffersRepository', () => {
  let repository: ShiftOffersRepository
  let prisma: PrismaService

  const mockPrisma = {
    chatShiftOffer: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  }

  beforeEach(() => {
    prisma = mockPrisma as unknown as PrismaService
    repository = new ShiftOffersRepository(prisma)
  })

  describe('create', () => {
    it('should create a shift offer with all fields', async () => {
      const data = {
        vagaId: 'vaga-1',
        senderId: 'user-1',
        recipientMedicoId: 'medico-1',
        recipientPhone: '+5511999999999',
        expiresAt: new Date('2024-01-20'),
      }

      const expected = { id: 'offer-1', ...data, status: ShiftOfferStatus.pending }
      mockPrisma.chatShiftOffer.create.mockResolvedValue(expected)

      const result = await repository.create(data)

      expect(mockPrisma.chatShiftOffer.create).toHaveBeenCalledWith({
        data: {
          vagaId: 'vaga-1',
          messageId: undefined,
          senderId: 'user-1',
          recipientId: undefined,
          recipientMedicoId: 'medico-1',
          recipientPhone: '+5511999999999',
          expiresAt: data.expiresAt,
          status: ShiftOfferStatus.pending,
        },
      })
      expect(result).toEqual(expected)
    })

    it('should create offer with messageId', async () => {
      const data = {
        vagaId: 'vaga-1',
        messageId: 'msg-1',
        senderId: 'user-1',
        recipientPhone: '+5511999999999',
        expiresAt: new Date(),
      }

      mockPrisma.chatShiftOffer.create.mockResolvedValue({ id: 'offer-1', ...data })

      await repository.create(data)

      expect(mockPrisma.chatShiftOffer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          messageId: 'msg-1',
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return offer with relations', async () => {
      const offer = {
        id: 'offer-1',
        vagaId: 'vaga-1',
        vaga: {
          id: 'vaga-1',
          data: new Date(),
          horaInicio: '08:00',
          horaFim: '12:00',
          valor: 500,
          hospital: { nome: 'Hospital Test' },
          setor: { nome: 'UTI' },
          especialidade: { nome: 'Cardiologia' },
        },
        recipientMedico: {
          id: 'medico-1',
          nome: 'Dr. Test',
        },
      }

      mockPrisma.chatShiftOffer.findUnique.mockResolvedValue(offer)

      const result = await repository.findById('offer-1')

      expect(mockPrisma.chatShiftOffer.findUnique).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        include: {
          vaga: {
            select: {
              id: true,
              data: true,
              horaInicio: true,
              horaFim: true,
              valor: true,
              hospital: { select: { nome: true } },
              setor: { select: { nome: true } },
              especialidade: { select: { nome: true } },
            },
          },
          recipientMedico: {
            select: { id: true, nome: true },
          },
        },
      })
      expect(result).toEqual(offer)
    })

    it('should return null when offer not found', async () => {
      mockPrisma.chatShiftOffer.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByMessageId', () => {
    it('should return offer by message id', async () => {
      const offer = { id: 'offer-1', messageId: 'msg-1' }

      mockPrisma.chatShiftOffer.findUnique.mockResolvedValue(offer)

      const result = await repository.findByMessageId('msg-1')

      expect(mockPrisma.chatShiftOffer.findUnique).toHaveBeenCalledWith({
        where: { messageId: 'msg-1' },
      })
      expect(result).toEqual(offer)
    })
  })

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const offers = [{ id: 'offer-1' }, { id: 'offer-2' }]

      mockPrisma.chatShiftOffer.findMany.mockResolvedValue(offers)
      mockPrisma.chatShiftOffer.count.mockResolvedValue(2)

      const result = await repository.findAll('user-1', { page: 1, limit: 10 })

      expect(result.data).toEqual(offers)
      expect(result.total).toBe(2)
    })

    it('should filter by status', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', { status: ShiftOfferStatus.pending })

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ShiftOfferStatus.pending,
          }),
        })
      )
    })

    it('should filter by vagaId', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', { vagaId: 'vaga-1' })

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vagaId: 'vaga-1',
          }),
        })
      )
    })

    it('should filter by recipientMedicoId', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', { recipientMedicoId: 'medico-1' })

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recipientMedicoId: 'medico-1',
          }),
        })
      )
    })

    it('should filter sent by user', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', { sentByMe: true })

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            senderId: 'user-1',
          }),
        })
      )
    })

    it('should filter received by user', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', { receivedByMe: true })

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ recipientId: 'user-1' }, { recipientMedicoId: 'user-1' }],
          }),
        })
      )
    })

    it('should show user offers by default', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', {})

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { senderId: 'user-1' },
              { recipientId: 'user-1' },
              { recipientMedicoId: 'user-1' },
            ],
          }),
        })
      )
    })

    it('should apply pagination correctly', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', { page: 3, limit: 5 })

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should order by createdAt descending', async () => {
      mockPrisma.chatShiftOffer.findMany.mockResolvedValue([])
      mockPrisma.chatShiftOffer.count.mockResolvedValue(0)

      await repository.findAll('user-1', {})

      expect(mockPrisma.chatShiftOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  describe('updateStatus', () => {
    it('should update status with respondedAt', async () => {
      const respondedAt = new Date()
      const updated = { id: 'offer-1', status: ShiftOfferStatus.accepted, respondedAt }

      mockPrisma.chatShiftOffer.update.mockResolvedValue(updated)

      const result = await repository.updateStatus('offer-1', ShiftOfferStatus.accepted, respondedAt)

      expect(mockPrisma.chatShiftOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: {
          status: ShiftOfferStatus.accepted,
          respondedAt,
        },
      })
      expect(result).toEqual(updated)
    })

    it('should use current date if respondedAt not provided', async () => {
      mockPrisma.chatShiftOffer.update.mockResolvedValue({
        id: 'offer-1',
        status: ShiftOfferStatus.rejected,
      })

      await repository.updateStatus('offer-1', ShiftOfferStatus.rejected)

      expect(mockPrisma.chatShiftOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: {
          status: ShiftOfferStatus.rejected,
          respondedAt: expect.any(Date),
        },
      })
    })
  })

  describe('updateMessageId', () => {
    it('should update messageId', async () => {
      const updated = { id: 'offer-1', messageId: 'msg-1' }

      mockPrisma.chatShiftOffer.update.mockResolvedValue(updated)

      const result = await repository.updateMessageId('offer-1', 'msg-1')

      expect(mockPrisma.chatShiftOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { messageId: 'msg-1' },
      })
      expect(result).toEqual(updated)
    })
  })

  describe('expirePendingOffers', () => {
    it('should expire pending offers past expiration date', async () => {
      mockPrisma.chatShiftOffer.updateMany.mockResolvedValue({ count: 5 })

      const result = await repository.expirePendingOffers()

      expect(mockPrisma.chatShiftOffer.updateMany).toHaveBeenCalledWith({
        where: {
          status: ShiftOfferStatus.pending,
          expiresAt: { lt: expect.any(Date) },
        },
        data: {
          status: ShiftOfferStatus.expired,
        },
      })
      expect(result).toBe(5)
    })

    it('should return 0 when no offers to expire', async () => {
      mockPrisma.chatShiftOffer.updateMany.mockResolvedValue({ count: 0 })

      const result = await repository.expirePendingOffers()

      expect(result).toBe(0)
    })
  })

  describe('cancel', () => {
    it('should set status to cancelled', async () => {
      const cancelled = { id: 'offer-1', status: ShiftOfferStatus.cancelled }

      mockPrisma.chatShiftOffer.update.mockResolvedValue(cancelled)

      const result = await repository.cancel('offer-1')

      expect(mockPrisma.chatShiftOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: {
          status: ShiftOfferStatus.cancelled,
        },
      })
      expect(result).toEqual(cancelled)
    })
  })
})
