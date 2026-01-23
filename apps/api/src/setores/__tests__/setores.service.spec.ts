import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { SetoresService } from '../setores.service'
import { createSetorFixture, createSetorListFixture } from '../../__tests__/fixtures'

describe('SetoresService', () => {
  let service: SetoresService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByNomeAndHospital: vi.fn(),
    findByNomeAndHospitalExcludingId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    service = new SetoresService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new setor', async () => {
      const dto = { nome: 'UTI', descricao: 'Unidade de Terapia Intensiva', hospitalId: 'hospital-id' }
      const setor = createSetorFixture(dto)
      mockRepository.findByNomeAndHospital.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(setor)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when nome already exists in same hospital', async () => {
      const dto = { nome: 'UTI', hospitalId: 'hospital-id' }
      mockRepository.findByNomeAndHospital.mockResolvedValue(createSetorFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated setores', async () => {
      const setores = createSetorListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: setores,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return setor by id', async () => {
      const setor = createSetorFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(setor)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when setor not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update setor', async () => {
      const setor = createSetorFixture({ id: 'test-id', nome: 'Updated' })
      mockRepository.findById.mockResolvedValue(setor)
      mockRepository.findByNomeAndHospitalExcludingId.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue(setor)

      const result = await service.update('test-id', { nome: 'Updated' })

      expect(result.nome).toBe('Updated')
    })

    it('should throw NotFoundException when setor not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when nome already exists in same hospital', async () => {
      mockRepository.findById.mockResolvedValue(createSetorFixture())
      mockRepository.findByNomeAndHospitalExcludingId.mockResolvedValue(createSetorFixture())

      await expect(
        service.update('id', { nome: 'Existing' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should remove setor', async () => {
      mockRepository.findById.mockResolvedValue(createSetorFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when setor not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
