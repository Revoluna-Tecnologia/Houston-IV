import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SetoresController } from '../setores.controller'
import { createSetorFixture, createSetorListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('SetoresController', () => {
  let controller: SetoresController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new SetoresController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new setor', async () => {
      const dto = { nome: 'UTI', descricao: 'Unidade de Terapia Intensiva', hospitalId: 'hospital-id' }
      const setor = createSetorFixture(dto)
      mockService.create.mockResolvedValue(setor)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(setor)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated setores', async () => {
      const setores = createSetorListFixture(3)
      const response = {
        data: setores,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return setor by id', async () => {
      const setor = createSetorFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(setor)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(setor)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update setor', async () => {
      const setor = createSetorFixture({ id: 'test-id', nome: 'Updated' })
      mockService.update.mockResolvedValue(setor)

      const result = await controller.update('test-id', { nome: 'Updated' }, mockSession as never)

      expect(result).toEqual(setor)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { nome: 'Updated' })
    })
  })

  describe('remove', () => {
    it('should remove setor', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
