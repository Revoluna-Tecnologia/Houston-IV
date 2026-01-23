import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { CheckinCheckoutService } from '../checkin-checkout.service'
import {
  createCheckinCheckoutFixture,
  createCheckinCheckoutListFixture,
  createCheckinCheckoutWithCheckinFixture,
  createCheckinCheckoutWithCheckoutFixture,
} from '../../__tests__/fixtures'

describe('CheckinCheckoutService', () => {
  let service: CheckinCheckoutService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByVagaAndMedico: vi.fn(),
    update: vi.fn(),
    updateCheckin: vi.fn(),
    updateCheckout: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    service = new CheckinCheckoutService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new record', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id', observacoes: 'Obs' }
      const record = createCheckinCheckoutFixture(dto)
      mockRepository.findByVagaAndMedico.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(record)

      const result = await service.create(dto)

      expect(result.vagaId).toBe(dto.vagaId)
      expect(result.medicoId).toBe(dto.medicoId)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when record already exists', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id' }
      mockRepository.findByVagaAndMedico.mockResolvedValue(createCheckinCheckoutFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated records', async () => {
      const records = createCheckinCheckoutListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: records,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return record by id', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(record)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update record', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id', observacoes: 'Updated' })
      mockRepository.findById.mockResolvedValue(record)
      mockRepository.update.mockResolvedValue(record)

      const result = await service.update('test-id', { observacoes: 'Updated' })

      expect(result.observacoes).toBe('Updated')
    })

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove record', async () => {
      mockRepository.findById.mockResolvedValue(createCheckinCheckoutFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('checkin', () => {
    it('should register checkin', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id' })
      const updated = { ...record, checkinAt: new Date() }
      mockRepository.findById.mockResolvedValue(record)
      mockRepository.updateCheckin.mockResolvedValue(updated)

      const result = await service.checkin('test-id')

      expect(result.checkinAt).not.toBeNull()
      expect(mockRepository.updateCheckin).toHaveBeenCalledWith('test-id', expect.any(Date))
    })

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.checkin('invalid-id')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when checkin already registered', async () => {
      const record = createCheckinCheckoutWithCheckinFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(record)

      await expect(service.checkin('test-id')).rejects.toThrow(BadRequestException)
    })
  })

  describe('checkout', () => {
    it('should register checkout', async () => {
      const record = createCheckinCheckoutWithCheckinFixture({ id: 'test-id' })
      const updated = { ...record, checkoutAt: new Date() }
      mockRepository.findById.mockResolvedValue(record)
      mockRepository.updateCheckout.mockResolvedValue(updated)

      const result = await service.checkout('test-id')

      expect(result.checkoutAt).not.toBeNull()
      expect(mockRepository.updateCheckout).toHaveBeenCalledWith('test-id', expect.any(Date))
    })

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.checkout('invalid-id')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when checkin not registered', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(record)

      await expect(service.checkout('test-id')).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when checkout already registered', async () => {
      const record = createCheckinCheckoutWithCheckoutFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(record)

      await expect(service.checkout('test-id')).rejects.toThrow(BadRequestException)
    })
  })
})
