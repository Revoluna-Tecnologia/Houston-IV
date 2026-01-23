import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MedicosRepository } from '../medicos.repository'
import { createMedicoFixture, createMedicoListFixture } from '../../__tests__/fixtures'

describe('MedicosRepository', () => {
  let repository: MedicosRepository

  const mockPrisma = {
    medico: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  }

  beforeEach(() => {
    repository = new MedicosRepository(mockPrisma as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new medico', async () => {
      const dto = { nome: 'Dr. Novo', crm: '123456', crmUf: 'SP', especialidadeId: 'esp-id' }
      const medico = createMedicoFixture(dto)
      mockPrisma.medico.create.mockResolvedValue(medico)

      const result = await repository.create(dto)

      expect(result).toEqual(medico)
      expect(mockPrisma.medico.create).toHaveBeenCalledWith({ data: dto })
    })
  })

  describe('findAll', () => {
    it('should return paginated medicos', async () => {
      const medicos = createMedicoListFixture(5)
      mockPrisma.medico.findMany.mockResolvedValue(medicos)
      mockPrisma.medico.count.mockResolvedValue(5)

      const result = await repository.findAll({ page: 1, limit: 10 })

      expect(result.data).toEqual(medicos)
      expect(result.meta.total).toBe(5)
      expect(result.meta.page).toBe(1)
    })

    it('should apply ativo filter', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([])
      mockPrisma.medico.count.mockResolvedValue(0)

      await repository.findAll({ ativo: true })

      expect(mockPrisma.medico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        })
      )
    })

    it('should apply especialidadeId filter', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([])
      mockPrisma.medico.count.mockResolvedValue(0)

      await repository.findAll({ especialidadeId: 'esp-id' })

      expect(mockPrisma.medico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ especialidadeId: 'esp-id' }),
        })
      )
    })

    it('should apply crmUf filter', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([])
      mockPrisma.medico.count.mockResolvedValue(0)

      await repository.findAll({ crmUf: 'SP' })

      expect(mockPrisma.medico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ crmUf: 'SP' }),
        })
      )
    })

    it('should apply search filter', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([])
      mockPrisma.medico.count.mockResolvedValue(0)

      await repository.findAll({ search: 'Silva' })

      expect(mockPrisma.medico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('should use default pagination values', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([])
      mockPrisma.medico.count.mockResolvedValue(0)

      const result = await repository.findAll({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(10)
    })
  })

  describe('findById', () => {
    it('should return medico by id', async () => {
      const medico = createMedicoFixture({ id: 'test-id' })
      mockPrisma.medico.findUnique.mockResolvedValue(medico)

      const result = await repository.findById('test-id')

      expect(result).toEqual(medico)
      expect(mockPrisma.medico.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue(null)

      const result = await repository.findById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('findByCrmAndUf', () => {
    it('should return medico by crm and uf', async () => {
      const medico = createMedicoFixture({ crm: '123456', crmUf: 'SP' })
      mockPrisma.medico.findFirst.mockResolvedValue(medico)

      const result = await repository.findByCrmAndUf('123456', 'SP')

      expect(result).toEqual(medico)
    })
  })

  describe('findByCrmAndUfExcludingId', () => {
    it('should find by crm and uf excluding specific id', async () => {
      mockPrisma.medico.findFirst.mockResolvedValue(null)

      await repository.findByCrmAndUfExcludingId('123456', 'SP', 'exclude-id')

      expect(mockPrisma.medico.findFirst).toHaveBeenCalledWith({
        where: { crm: '123456', crmUf: 'SP', NOT: { id: 'exclude-id' } },
      })
    })
  })

  describe('findByCpf', () => {
    it('should return medico by cpf', async () => {
      const medico = createMedicoFixture({ cpf: '12345678901' })
      mockPrisma.medico.findUnique.mockResolvedValue(medico)

      const result = await repository.findByCpf('12345678901')

      expect(result).toEqual(medico)
    })
  })

  describe('findByEmail', () => {
    it('should return medico by email', async () => {
      const medico = createMedicoFixture({ email: 'medico@teste.com' })
      mockPrisma.medico.findUnique.mockResolvedValue(medico)

      const result = await repository.findByEmail('medico@teste.com')

      expect(result).toEqual(medico)
    })
  })

  describe('update', () => {
    it('should update medico', async () => {
      const medico = createMedicoFixture({ nome: 'Updated' })
      mockPrisma.medico.update.mockResolvedValue(medico)

      const result = await repository.update('id', { nome: 'Updated' })

      expect(result).toEqual(medico)
      expect(mockPrisma.medico.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { nome: 'Updated' },
      })
    })
  })

  describe('delete', () => {
    it('should delete medico', async () => {
      mockPrisma.medico.delete.mockResolvedValue({})

      await repository.delete('id')

      expect(mockPrisma.medico.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      })
    })
  })
})
