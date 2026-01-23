import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { GruposService } from '../grupos.service'
import { createGrupoFixture, createGrupoListFixture } from '../../__tests__/fixtures'

describe('GruposService', () => {
  let service: GruposService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByNome: vi.fn(),
    findByNomeExcludingId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    service = new GruposService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new grupo', async () => {
      const dto = { nome: 'Novo Grupo', descricao: 'Descricao' }
      const grupo = createGrupoFixture(dto)
      mockRepository.findByNome.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(grupo)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when nome already exists', async () => {
      const dto = { nome: 'Existing Grupo' }
      mockRepository.findByNome.mockResolvedValue(createGrupoFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated grupos', async () => {
      const grupos = createGrupoListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: grupos,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return grupo by id', async () => {
      const grupo = createGrupoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(grupo)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when grupo not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update grupo', async () => {
      const grupo = createGrupoFixture({ id: 'test-id', nome: 'Updated' })
      mockRepository.findById.mockResolvedValue(grupo)
      mockRepository.findByNomeExcludingId.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue(grupo)

      const result = await service.update('test-id', { nome: 'Updated' })

      expect(result.nome).toBe('Updated')
    })

    it('should throw NotFoundException when grupo not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findById.mockResolvedValue(createGrupoFixture())
      mockRepository.findByNomeExcludingId.mockResolvedValue(createGrupoFixture())

      await expect(
        service.update('id', { nome: 'Existing' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should remove grupo', async () => {
      mockRepository.findById.mockResolvedValue(createGrupoFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when grupo not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
