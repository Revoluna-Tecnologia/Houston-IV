import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { HospitaisService } from '../hospitais.service'
import { createHospitalFixture, createHospitalListFixture } from '../../__tests__/fixtures'

describe('HospitaisService', () => {
  let service: HospitaisService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCnpj: vi.fn(),
    findByCnpjExcludingId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    service = new HospitaisService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new hospital', async () => {
      const dto = { nome: 'Novo Hospital', grupoId: 'grupo-id' }
      const hospital = createHospitalFixture(dto)
      mockRepository.findByCnpj.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(hospital)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should create hospital without cnpj', async () => {
      const dto = { nome: 'Novo Hospital', grupoId: 'grupo-id' }
      const hospital = createHospitalFixture({ ...dto, cnpj: null })
      mockRepository.create.mockResolvedValue(hospital)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.findByCnpj).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when cnpj already exists', async () => {
      const dto = { nome: 'Novo Hospital', grupoId: 'grupo-id', cnpj: '12345678000199' }
      mockRepository.findByCnpj.mockResolvedValue(createHospitalFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated hospitais', async () => {
      const hospitais = createHospitalListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: hospitais,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return hospital by id', async () => {
      const hospital = createHospitalFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(hospital)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when hospital not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update hospital', async () => {
      const hospital = createHospitalFixture({ id: 'test-id', nome: 'Updated' })
      mockRepository.findById.mockResolvedValue(hospital)
      mockRepository.findByCnpjExcludingId.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue(hospital)

      const result = await service.update('test-id', { nome: 'Updated' })

      expect(result.nome).toBe('Updated')
    })

    it('should throw NotFoundException when hospital not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when cnpj already exists', async () => {
      mockRepository.findById.mockResolvedValue(createHospitalFixture())
      mockRepository.findByCnpjExcludingId.mockResolvedValue(createHospitalFixture())

      await expect(
        service.update('id', { cnpj: '12345678000199' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should remove hospital', async () => {
      mockRepository.findById.mockResolvedValue(createHospitalFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when hospital not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
