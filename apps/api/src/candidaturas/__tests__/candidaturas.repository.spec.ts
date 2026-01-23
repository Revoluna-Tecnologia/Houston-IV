import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CandidaturasRepository } from '../candidaturas.repository'
import { createCandidaturaFixture, createCandidaturaListFixture } from '../../__tests__/fixtures'

describe('CandidaturasRepository', () => {
  let repository: CandidaturasRepository

  const mockPrisma = {
    candidatura: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  }

  beforeEach(() => {
    repository = new CandidaturasRepository(mockPrisma as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new candidatura', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id' }
      const candidatura = createCandidaturaFixture(dto)
      mockPrisma.candidatura.create.mockResolvedValue(candidatura)

      const result = await repository.create(dto)

      expect(result).toEqual(candidatura)
      expect(mockPrisma.candidatura.create).toHaveBeenCalledWith({ data: dto })
    })
  })

  describe('findAll', () => {
    it('should return paginated candidaturas', async () => {
      const candidaturas = createCandidaturaListFixture(5)
      mockPrisma.candidatura.findMany.mockResolvedValue(candidaturas)
      mockPrisma.candidatura.count.mockResolvedValue(5)

      const result = await repository.findAll({ page: 1, limit: 10 })

      expect(result.data).toEqual(candidaturas)
      expect(result.meta.total).toBe(5)
      expect(result.meta.page).toBe(1)
    })

    it('should apply status filter', async () => {
      mockPrisma.candidatura.findMany.mockResolvedValue([])
      mockPrisma.candidatura.count.mockResolvedValue(0)

      await repository.findAll({ status: 'pendente' })

      expect(mockPrisma.candidatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pendente' }),
        })
      )
    })

    it('should apply vagaId filter', async () => {
      mockPrisma.candidatura.findMany.mockResolvedValue([])
      mockPrisma.candidatura.count.mockResolvedValue(0)

      await repository.findAll({ vagaId: 'vaga-123' })

      expect(mockPrisma.candidatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vagaId: 'vaga-123' }),
        })
      )
    })

    it('should apply medicoId filter', async () => {
      mockPrisma.candidatura.findMany.mockResolvedValue([])
      mockPrisma.candidatura.count.mockResolvedValue(0)

      await repository.findAll({ medicoId: 'medico-123' })

      expect(mockPrisma.candidatura.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicoId: 'medico-123' }),
        })
      )
    })

    it('should use default pagination values', async () => {
      mockPrisma.candidatura.findMany.mockResolvedValue([])
      mockPrisma.candidatura.count.mockResolvedValue(0)

      const result = await repository.findAll({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(10)
    })
  })

  describe('findById', () => {
    it('should return candidatura by id', async () => {
      const candidatura = createCandidaturaFixture({ id: 'test-id' })
      mockPrisma.candidatura.findUnique.mockResolvedValue(candidatura)

      const result = await repository.findById('test-id')

      expect(result).toEqual(candidatura)
      expect(mockPrisma.candidatura.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.candidatura.findUnique.mockResolvedValue(null)

      const result = await repository.findById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('findByVagaAndMedico', () => {
    it('should find by vagaId and medicoId', async () => {
      const candidatura = createCandidaturaFixture({ vagaId: 'v1', medicoId: 'm1' })
      mockPrisma.candidatura.findUnique.mockResolvedValue(candidatura)

      const result = await repository.findByVagaAndMedico('v1', 'm1')

      expect(result).toEqual(candidatura)
      expect(mockPrisma.candidatura.findUnique).toHaveBeenCalledWith({
        where: { vagaId_medicoId: { vagaId: 'v1', medicoId: 'm1' } },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.candidatura.findUnique.mockResolvedValue(null)

      const result = await repository.findByVagaAndMedico('v1', 'm1')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update candidatura', async () => {
      const candidatura = createCandidaturaFixture({ status: 'aprovada' })
      mockPrisma.candidatura.update.mockResolvedValue(candidatura)

      const result = await repository.update('id', { status: 'aprovada' })

      expect(result).toEqual(candidatura)
      expect(mockPrisma.candidatura.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { status: 'aprovada' },
      })
    })
  })

  describe('delete', () => {
    it('should delete candidatura', async () => {
      mockPrisma.candidatura.delete.mockResolvedValue({})

      await repository.delete('id')

      expect(mockPrisma.candidatura.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      })
    })
  })
})
