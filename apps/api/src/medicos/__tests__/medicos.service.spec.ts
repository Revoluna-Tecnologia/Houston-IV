import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { MedicosService } from '../medicos.service'
import { createMedicoFixture, createMedicoListFixture } from '../../__tests__/fixtures'

describe('MedicosService', () => {
  let service: MedicosService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCrmAndUf: vi.fn(),
    findByCrmAndUfExcludingId: vi.fn(),
    findByCpf: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    service = new MedicosService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new medico', async () => {
      const dto = { nome: 'Dr. Novo', crm: '123456', crmUf: 'SP', especialidadeId: 'esp-id' }
      const medico = createMedicoFixture(dto)
      mockRepository.findByCrmAndUf.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(medico)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when crm+uf already exists', async () => {
      const dto = { nome: 'Dr. Novo', crm: '123456', crmUf: 'SP', especialidadeId: 'esp-id' }
      mockRepository.findByCrmAndUf.mockResolvedValue(createMedicoFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })

    it('should throw ConflictException when cpf already exists', async () => {
      const dto = { nome: 'Dr. Novo', crm: '123456', crmUf: 'SP', especialidadeId: 'esp-id', cpf: '12345678901' }
      mockRepository.findByCrmAndUf.mockResolvedValue(null)
      mockRepository.findByCpf.mockResolvedValue(createMedicoFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })

    it('should throw ConflictException when email already exists', async () => {
      const dto = { nome: 'Dr. Novo', crm: '123456', crmUf: 'SP', especialidadeId: 'esp-id', email: 'test@test.com' }
      mockRepository.findByCrmAndUf.mockResolvedValue(null)
      mockRepository.findByEmail.mockResolvedValue(createMedicoFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated medicos', async () => {
      const medicos = createMedicoListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: medicos,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return medico by id', async () => {
      const medico = createMedicoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(medico)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when medico not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update medico', async () => {
      const medico = createMedicoFixture({ id: 'test-id', nome: 'Updated' })
      mockRepository.findById.mockResolvedValue(medico)
      mockRepository.update.mockResolvedValue(medico)

      const result = await service.update('test-id', { nome: 'Updated' })

      expect(result.nome).toBe('Updated')
    })

    it('should throw NotFoundException when medico not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when crm+uf already exists on update', async () => {
      const existing = createMedicoFixture({ id: 'test-id' })
      const another = createMedicoFixture({ id: 'another-id' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.findByCrmAndUfExcludingId.mockResolvedValue(another)

      await expect(
        service.update('test-id', { crm: '999999', crmUf: 'RJ' })
      ).rejects.toThrow(ConflictException)
    })

    it('should throw ConflictException when cpf already exists on update', async () => {
      const existing = createMedicoFixture({ id: 'test-id' })
      const another = createMedicoFixture({ id: 'another-id', cpf: '11111111111' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.findByCpf.mockResolvedValue(another)

      await expect(
        service.update('test-id', { cpf: '11111111111' })
      ).rejects.toThrow(ConflictException)
    })

    it('should throw ConflictException when email already exists on update', async () => {
      const existing = createMedicoFixture({ id: 'test-id' })
      const another = createMedicoFixture({ id: 'another-id', email: 'other@test.com' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.findByEmail.mockResolvedValue(another)

      await expect(
        service.update('test-id', { email: 'other@test.com' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should remove medico', async () => {
      mockRepository.findById.mockResolvedValue(createMedicoFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when medico not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
