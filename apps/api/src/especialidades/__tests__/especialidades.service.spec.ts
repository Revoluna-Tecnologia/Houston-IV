import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { EspecialidadesService } from '../especialidades.service'
import { createEspecialidadeFixture, createEspecialidadeListFixture } from '../../__tests__/fixtures'

describe('EspecialidadesService', () => {
  let service: EspecialidadesService

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
    service = new EspecialidadesService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new especialidade', async () => {
      const dto = { nome: 'Cardiologia', sigla: 'CARD', cor: '#FF5733' }
      const especialidade = createEspecialidadeFixture(dto)
      mockRepository.findByNome.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(especialidade)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when nome already exists', async () => {
      const dto = { nome: 'Cardiologia' }
      mockRepository.findByNome.mockResolvedValue(createEspecialidadeFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated especialidades', async () => {
      const especialidades = createEspecialidadeListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: especialidades,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return especialidade by id', async () => {
      const especialidade = createEspecialidadeFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(especialidade)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when especialidade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update especialidade', async () => {
      const especialidade = createEspecialidadeFixture({ id: 'test-id', nome: 'Neurologia' })
      mockRepository.findById.mockResolvedValue(especialidade)
      mockRepository.findByNomeExcludingId.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue(especialidade)

      const result = await service.update('test-id', { nome: 'Neurologia' })

      expect(result.nome).toBe('Neurologia')
    })

    it('should throw NotFoundException when especialidade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findById.mockResolvedValue(createEspecialidadeFixture())
      mockRepository.findByNomeExcludingId.mockResolvedValue(createEspecialidadeFixture())

      await expect(
        service.update('id', { nome: 'Existing' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should remove especialidade', async () => {
      mockRepository.findById.mockResolvedValue(createEspecialidadeFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when especialidade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
