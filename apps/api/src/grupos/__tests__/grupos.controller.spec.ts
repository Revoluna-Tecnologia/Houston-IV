import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GruposController } from '../grupos.controller'
import { createGrupoFixture, createGrupoListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('GruposController', () => {
  let controller: GruposController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new GruposController(mockService as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new grupo', async () => {
      const dto = { nome: 'Novo Grupo', descricao: 'Descricao' }
      const grupo = createGrupoFixture(dto)
      mockService.create.mockResolvedValue(grupo)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(grupo)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated grupos', async () => {
      const grupos = createGrupoListFixture(3)
      const response = {
        data: grupos,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return grupo by id', async () => {
      const grupo = createGrupoFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(grupo)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(grupo)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update grupo', async () => {
      const grupo = createGrupoFixture({ id: 'test-id', nome: 'Updated' })
      mockService.update.mockResolvedValue(grupo)

      const result = await controller.update('test-id', { nome: 'Updated' }, mockSession as never)

      expect(result).toEqual(grupo)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { nome: 'Updated' })
    })
  })

  describe('remove', () => {
    it('should remove grupo', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
