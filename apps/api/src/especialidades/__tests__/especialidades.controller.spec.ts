import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EspecialidadesController } from '../especialidades.controller'
import { createEspecialidadeFixture, createEspecialidadeListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('EspecialidadesController', () => {
  let controller: EspecialidadesController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new EspecialidadesController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new especialidade', async () => {
      const dto = { nome: 'Cardiologia', sigla: 'CARD', cor: '#FF5733' }
      const especialidade = createEspecialidadeFixture(dto)
      mockService.create.mockResolvedValue(especialidade)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(especialidade)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated especialidades', async () => {
      const especialidades = createEspecialidadeListFixture(3)
      const response = {
        data: especialidades,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return especialidade by id', async () => {
      const especialidade = createEspecialidadeFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(especialidade)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(especialidade)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update especialidade', async () => {
      const especialidade = createEspecialidadeFixture({ id: 'test-id', nome: 'Neurologia' })
      mockService.update.mockResolvedValue(especialidade)

      const result = await controller.update('test-id', { nome: 'Neurologia' }, mockSession as never)

      expect(result).toEqual(especialidade)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { nome: 'Neurologia' })
    })
  })

  describe('remove', () => {
    it('should remove especialidade', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
