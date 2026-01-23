import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HospitaisController } from '../hospitais.controller'
import { createHospitalFixture, createHospitalListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('HospitaisController', () => {
  let controller: HospitaisController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new HospitaisController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new hospital', async () => {
      const dto = { nome: 'Novo Hospital', grupoId: 'grupo-id' }
      const hospital = createHospitalFixture(dto)
      mockService.create.mockResolvedValue(hospital)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(hospital)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated hospitais', async () => {
      const hospitais = createHospitalListFixture(3)
      const response = {
        data: hospitais,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return hospital by id', async () => {
      const hospital = createHospitalFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(hospital)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(hospital)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update hospital', async () => {
      const hospital = createHospitalFixture({ id: 'test-id', nome: 'Updated' })
      mockService.update.mockResolvedValue(hospital)

      const result = await controller.update('test-id', { nome: 'Updated' }, mockSession as never)

      expect(result).toEqual(hospital)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { nome: 'Updated' })
    })
  })

  describe('remove', () => {
    it('should remove hospital', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
