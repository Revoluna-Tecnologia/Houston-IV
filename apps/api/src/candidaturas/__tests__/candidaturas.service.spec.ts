import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { CandidaturasService } from '../candidaturas.service'
import {
  createCandidaturaFixture,
  createCandidaturaListFixture,
  createVagaFixture,
  createClosedVagaFixture,
  createApprovedCandidaturaFixture,
  createRejectedCandidaturaFixture,
} from '../../__tests__/fixtures'

describe('CandidaturasService', () => {
  let service: CandidaturasService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByVagaAndMedico: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  const mockPrisma = {
    vaga: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    candidatura: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  }

  beforeEach(() => {
    service = new CandidaturasService(mockRepository as never, mockPrisma as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new candidatura', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id' }
      const vaga = createVagaFixture({ id: 'vaga-id', status: 'aberta' })
      const candidatura = createCandidaturaFixture(dto)

      mockPrisma.vaga.findUnique.mockResolvedValue(vaga)
      mockRepository.findByVagaAndMedico.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(candidatura)

      const result = await service.create(dto)

      expect(result.vagaId).toBe(dto.vagaId)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should create candidatura when vaga is anunciada', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id' }
      const vaga = createVagaFixture({ id: 'vaga-id', status: 'anunciada' })
      const candidatura = createCandidaturaFixture(dto)

      mockPrisma.vaga.findUnique.mockResolvedValue(vaga)
      mockRepository.findByVagaAndMedico.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(candidatura)

      const result = await service.create(dto)

      expect(result.vagaId).toBe(dto.vagaId)
    })

    it('should throw NotFoundException when vaga not found', async () => {
      mockPrisma.vaga.findUnique.mockResolvedValue(null)

      await expect(service.create({ vagaId: 'x', medicoId: 'y' })).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when vaga is closed', async () => {
      const vaga = createClosedVagaFixture()
      mockPrisma.vaga.findUnique.mockResolvedValue(vaga)

      await expect(service.create({ vagaId: vaga.id, medicoId: 'y' })).rejects.toThrow(BadRequestException)
    })

    it('should throw ConflictException when candidatura already exists', async () => {
      const vaga = createVagaFixture({ status: 'aberta' })
      const existing = createCandidaturaFixture()

      mockPrisma.vaga.findUnique.mockResolvedValue(vaga)
      mockRepository.findByVagaAndMedico.mockResolvedValue(existing)

      await expect(service.create({ vagaId: vaga.id, medicoId: 'y' })).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated candidaturas', async () => {
      const candidaturas = createCandidaturaListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: candidaturas,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return candidatura by id', async () => {
      const candidatura = createCandidaturaFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(candidatura)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException)
    })
  })

  describe('approve', () => {
    it('should approve candidatura and close vaga', async () => {
      const candidatura = createCandidaturaFixture({ status: 'pendente' })
      const approved = createApprovedCandidaturaFixture({ id: candidatura.id })

      mockRepository.findById.mockResolvedValue(candidatura)
      mockPrisma.$transaction.mockResolvedValue([approved, {}])

      const result = await service.approve(candidatura.id)

      expect(result.status).toBe('aprovada')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.approve('invalid')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when already approved', async () => {
      const approved = createApprovedCandidaturaFixture()
      mockRepository.findById.mockResolvedValue(approved)

      await expect(service.approve(approved.id)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when already rejected', async () => {
      const rejected = createRejectedCandidaturaFixture()
      mockRepository.findById.mockResolvedValue(rejected)

      await expect(service.approve(rejected.id)).rejects.toThrow(BadRequestException)
    })
  })

  describe('reject', () => {
    it('should reject candidatura', async () => {
      const candidatura = createCandidaturaFixture({ status: 'pendente' })
      const rejected = createRejectedCandidaturaFixture({ id: candidatura.id })

      mockRepository.findById.mockResolvedValue(candidatura)
      mockRepository.update.mockResolvedValue(rejected)

      const result = await service.reject(candidatura.id)

      expect(result.status).toBe('rejeitada')
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.reject('invalid')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when already approved', async () => {
      const approved = createApprovedCandidaturaFixture()
      mockRepository.findById.mockResolvedValue(approved)

      await expect(service.reject(approved.id)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when already rejected', async () => {
      const rejected = createRejectedCandidaturaFixture()
      mockRepository.findById.mockResolvedValue(rejected)

      await expect(service.reject(rejected.id)).rejects.toThrow(BadRequestException)
    })
  })

  describe('remove', () => {
    it('should remove candidatura', async () => {
      mockRepository.findById.mockResolvedValue(createCandidaturaFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException)
    })
  })
})
