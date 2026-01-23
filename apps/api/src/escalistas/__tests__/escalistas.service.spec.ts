import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { EscalistasService } from '../escalistas.service'
import { createEscalistaFixture, createEscalistaListFixture } from '../../__tests__/fixtures'

describe('EscalistasService', () => {
  let service: EscalistasService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByMedicoAndGrupo: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    medicoExists: vi.fn(),
    grupoExists: vi.fn(),
  }

  beforeEach(() => {
    service = new EscalistasService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new escalista', async () => {
      const dto = { medicoId: 'med-id', grupoId: 'grp-id' }
      const escalista = createEscalistaFixture(dto)
      mockRepository.medicoExists.mockResolvedValue(true)
      mockRepository.grupoExists.mockResolvedValue(true)
      mockRepository.findByMedicoAndGrupo.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(escalista)

      const result = await service.create(dto)

      expect(result.medicoId).toBe(dto.medicoId)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw NotFoundException when medico does not exist', async () => {
      const dto = { medicoId: 'invalid-med', grupoId: 'grp-id' }
      mockRepository.medicoExists.mockResolvedValue(false)

      await expect(service.create(dto)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when grupo does not exist', async () => {
      const dto = { medicoId: 'med-id', grupoId: 'invalid-grp' }
      mockRepository.medicoExists.mockResolvedValue(true)
      mockRepository.grupoExists.mockResolvedValue(false)

      await expect(service.create(dto)).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when escalista already exists', async () => {
      const dto = { medicoId: 'med-id', grupoId: 'grp-id' }
      mockRepository.medicoExists.mockResolvedValue(true)
      mockRepository.grupoExists.mockResolvedValue(true)
      mockRepository.findByMedicoAndGrupo.mockResolvedValue(createEscalistaFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated escalistas', async () => {
      const escalistas = createEscalistaListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: escalistas,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return escalista by id', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(escalista)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when escalista not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update escalista with valid status transition pendente -> ativo', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'pendente' })
      const updated = createEscalistaFixture({ id: 'test-id', status: 'ativo' })
      mockRepository.findById.mockResolvedValue(escalista)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.update('test-id', { status: 'ativo' })

      expect(result.status).toBe('ativo')
    })

    it('should update escalista with valid status transition pendente -> inativo', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'pendente' })
      const updated = createEscalistaFixture({ id: 'test-id', status: 'inativo' })
      mockRepository.findById.mockResolvedValue(escalista)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.update('test-id', { status: 'inativo' })

      expect(result.status).toBe('inativo')
    })

    it('should update escalista with valid status transition ativo -> inativo', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'ativo' })
      const updated = createEscalistaFixture({ id: 'test-id', status: 'inativo' })
      mockRepository.findById.mockResolvedValue(escalista)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.update('test-id', { status: 'inativo' })

      expect(result.status).toBe('inativo')
    })

    it('should allow same status update', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'ativo' })
      mockRepository.findById.mockResolvedValue(escalista)
      mockRepository.update.mockResolvedValue(escalista)

      const result = await service.update('test-id', { status: 'ativo' })

      expect(result.status).toBe('ativo')
    })

    it('should throw NotFoundException when escalista not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', { status: 'ativo' })).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for invalid transition ativo -> pendente', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'ativo' })
      mockRepository.findById.mockResolvedValue(escalista)

      await expect(service.update('test-id', { status: 'pendente' })).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for invalid transition inativo -> ativo', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'inativo' })
      mockRepository.findById.mockResolvedValue(escalista)

      await expect(service.update('test-id', { status: 'ativo' })).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for invalid transition inativo -> pendente', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id', status: 'inativo' })
      mockRepository.findById.mockResolvedValue(escalista)

      await expect(service.update('test-id', { status: 'pendente' })).rejects.toThrow(BadRequestException)
    })
  })

  describe('remove', () => {
    it('should remove escalista', async () => {
      mockRepository.findById.mockResolvedValue(createEscalistaFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when escalista not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
