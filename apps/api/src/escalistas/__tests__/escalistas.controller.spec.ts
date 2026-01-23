import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EscalistasController } from '../escalistas.controller'
import { createEscalistaFixture, createEscalistaListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('EscalistasController', () => {
  let controller: EscalistasController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new EscalistasController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new escalista', async () => {
      const dto = { medicoId: 'med-id', grupoId: 'grp-id' }
      const escalista = createEscalistaFixture(dto)
      mockService.create.mockResolvedValue(escalista)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(escalista)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated escalistas', async () => {
      const escalistas = createEscalistaListFixture(3)
      const response = {
        data: escalistas,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })

    it('should pass filters to service', async () => {
      const query = { status: 'ativo' as const, medicoId: 'med-id', grupoId: 'grp-id' }
      mockService.findAll.mockResolvedValue({ data: [], meta: {} })

      await controller.findAll(query)

      expect(mockService.findAll).toHaveBeenCalledWith(query)
    })
  })

  describe('findOne', () => {
    it('should return escalista by id', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(escalista)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(escalista)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update escalista status', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'ativo' })
      mockService.update.mockResolvedValue(escalista)

      const result = await controller.update('test-id', { status: 'ativo' }, mockSession as never)

      expect(result).toEqual(escalista)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { status: 'ativo' })
    })
  })

  describe('remove', () => {
    it('should remove escalista', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
