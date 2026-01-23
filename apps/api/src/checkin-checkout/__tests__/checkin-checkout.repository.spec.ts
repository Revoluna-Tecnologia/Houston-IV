import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckinCheckoutRepository } from '../checkin-checkout.repository'
import { createCheckinCheckoutFixture, createCheckinCheckoutListFixture } from '../../__tests__/fixtures'

describe('CheckinCheckoutRepository', () => {
  let repository: CheckinCheckoutRepository

  const mockPrisma = {
    checkinCheckout: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  }

  beforeEach(() => {
    repository = new CheckinCheckoutRepository(mockPrisma as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new checkin/checkout record', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id', observacoes: 'Obs' }
      const record = createCheckinCheckoutFixture(dto)
      mockPrisma.checkinCheckout.create.mockResolvedValue(record)

      const result = await repository.create(dto)

      expect(result).toEqual(record)
      expect(mockPrisma.checkinCheckout.create).toHaveBeenCalledWith({ data: dto })
    })
  })

  describe('findAll', () => {
    it('should return paginated records', async () => {
      const records = createCheckinCheckoutListFixture(5)
      mockPrisma.checkinCheckout.findMany.mockResolvedValue(records)
      mockPrisma.checkinCheckout.count.mockResolvedValue(5)

      const result = await repository.findAll({ page: 1, limit: 10 })

      expect(result.data).toEqual(records)
      expect(result.meta.total).toBe(5)
      expect(result.meta.page).toBe(1)
    })

    it('should apply vagaId filter', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ vagaId: 'vaga-id' })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vagaId: 'vaga-id' }),
        })
      )
    })

    it('should apply medicoId filter', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ medicoId: 'medico-id' })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicoId: 'medico-id' }),
        })
      )
    })

    it('should apply hasCheckin filter when true', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ hasCheckin: true })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ checkinAt: { not: null } }),
        })
      )
    })

    it('should apply hasCheckin filter when false', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ hasCheckin: false })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ checkinAt: null }),
        })
      )
    })

    it('should apply hasCheckout filter when true', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ hasCheckout: true })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ checkoutAt: { not: null } }),
        })
      )
    })

    it('should apply hasCheckout filter when false', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ hasCheckout: false })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ checkoutAt: null }),
        })
      )
    })

    it('should apply date range filter', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      await repository.findAll({ dataInicio: '2024-01-01', dataFim: '2024-12-31' })

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it('should use default pagination values', async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([])
      mockPrisma.checkinCheckout.count.mockResolvedValue(0)

      const result = await repository.findAll({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(10)
    })
  })

  describe('findById', () => {
    it('should return record by id', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id' })
      mockPrisma.checkinCheckout.findUnique.mockResolvedValue(record)

      const result = await repository.findById('test-id')

      expect(result).toEqual(record)
      expect(mockPrisma.checkinCheckout.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.checkinCheckout.findUnique.mockResolvedValue(null)

      const result = await repository.findById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('findByVagaAndMedico', () => {
    it('should return record by vagaId and medicoId', async () => {
      const record = createCheckinCheckoutFixture()
      mockPrisma.checkinCheckout.findUnique.mockResolvedValue(record)

      const result = await repository.findByVagaAndMedico('vaga-id', 'medico-id')

      expect(result).toEqual(record)
      expect(mockPrisma.checkinCheckout.findUnique).toHaveBeenCalledWith({
        where: { vagaId_medicoId: { vagaId: 'vaga-id', medicoId: 'medico-id' } },
      })
    })
  })

  describe('update', () => {
    it('should update record', async () => {
      const record = createCheckinCheckoutFixture({ observacoes: 'Updated' })
      mockPrisma.checkinCheckout.update.mockResolvedValue(record)

      const result = await repository.update('id', { observacoes: 'Updated' })

      expect(result).toEqual(record)
      expect(mockPrisma.checkinCheckout.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { observacoes: 'Updated' },
      })
    })
  })

  describe('updateCheckin', () => {
    it('should update checkinAt', async () => {
      const checkinAt = new Date()
      const record = createCheckinCheckoutFixture({ checkinAt })
      mockPrisma.checkinCheckout.update.mockResolvedValue(record)

      const result = await repository.updateCheckin('id', checkinAt)

      expect(result).toEqual(record)
      expect(mockPrisma.checkinCheckout.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { checkinAt },
      })
    })
  })

  describe('updateCheckout', () => {
    it('should update checkoutAt', async () => {
      const checkoutAt = new Date()
      const record = createCheckinCheckoutFixture({ checkoutAt })
      mockPrisma.checkinCheckout.update.mockResolvedValue(record)

      const result = await repository.updateCheckout('id', checkoutAt)

      expect(result).toEqual(record)
      expect(mockPrisma.checkinCheckout.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { checkoutAt },
      })
    })
  })

  describe('delete', () => {
    it('should delete record', async () => {
      mockPrisma.checkinCheckout.delete.mockResolvedValue({})

      await repository.delete('id')

      expect(mockPrisma.checkinCheckout.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      })
    })
  })
})
