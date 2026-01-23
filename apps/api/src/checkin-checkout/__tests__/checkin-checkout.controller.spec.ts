import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckinCheckoutController } from '../checkin-checkout.controller'
import {
  createCheckinCheckoutFixture,
  createCheckinCheckoutListFixture,
  createCheckinCheckoutWithCheckinFixture,
  createCheckinCheckoutWithCheckoutFixture,
} from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('CheckinCheckoutController', () => {
  let controller: CheckinCheckoutController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    checkin: vi.fn(),
    checkout: vi.fn(),
  }

  beforeEach(() => {
    controller = new CheckinCheckoutController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new record', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id', observacoes: 'Obs' }
      const record = createCheckinCheckoutFixture(dto)
      mockService.create.mockResolvedValue(record)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(record)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated records', async () => {
      const records = createCheckinCheckoutListFixture(3)
      const response = {
        data: records,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return record by id', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(record)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(record)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update record', async () => {
      const record = createCheckinCheckoutFixture({ id: 'test-id', observacoes: 'Updated' })
      mockService.update.mockResolvedValue(record)

      const result = await controller.update('test-id', { observacoes: 'Updated' }, mockSession as never)

      expect(result).toEqual(record)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { observacoes: 'Updated' })
    })
  })

  describe('remove', () => {
    it('should remove record', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })

  describe('checkin', () => {
    it('should register checkin', async () => {
      const record = createCheckinCheckoutWithCheckinFixture({ id: 'test-id' })
      mockService.checkin.mockResolvedValue(record)

      const result = await controller.checkin('test-id', mockSession as never)

      expect(result).toEqual(record)
      expect(mockService.checkin).toHaveBeenCalledWith('test-id')
    })
  })

  describe('checkout', () => {
    it('should register checkout', async () => {
      const record = createCheckinCheckoutWithCheckoutFixture({ id: 'test-id' })
      mockService.checkout.mockResolvedValue(record)

      const result = await controller.checkout('test-id', mockSession as never)

      expect(result).toEqual(record)
      expect(mockService.checkout).toHaveBeenCalledWith('test-id')
    })
  })
})
