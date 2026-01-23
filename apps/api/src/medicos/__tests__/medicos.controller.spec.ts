import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MedicosController } from '../medicos.controller'
import { createMedicoFixture, createMedicoListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('MedicosController', () => {
  let controller: MedicosController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new MedicosController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new medico', async () => {
      const dto = { nome: 'Dr. Novo', crm: '123456', crmUf: 'SP', especialidadeId: 'esp-id' }
      const medico = createMedicoFixture(dto)
      mockService.create.mockResolvedValue(medico)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(medico)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated medicos', async () => {
      const medicos = createMedicoListFixture(3)
      const response = {
        data: medicos,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return medico by id', async () => {
      const medico = createMedicoFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(medico)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(medico)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update medico', async () => {
      const medico = createMedicoFixture({ id: 'test-id', nome: 'Updated' })
      mockService.update.mockResolvedValue(medico)

      const result = await controller.update('test-id', { nome: 'Updated' }, mockSession as never)

      expect(result).toEqual(medico)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { nome: 'Updated' })
    })
  })

  describe('remove', () => {
    it('should remove medico', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
