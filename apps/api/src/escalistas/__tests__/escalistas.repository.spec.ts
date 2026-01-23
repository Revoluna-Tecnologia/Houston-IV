import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EscalistasRepository } from '../escalistas.repository'
import { createEscalistaFixture, createEscalistaListFixture } from '../../__tests__/fixtures'

describe('EscalistasRepository', () => {
  let repository: EscalistasRepository

  const mockPrisma = {
    escalista: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    medico: { count: vi.fn() },
    grupo: { count: vi.fn() },
  }

  beforeEach(() => {
    repository = new EscalistasRepository(mockPrisma as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new escalista', async () => {
      const dto = { medicoId: 'med-id', grupoId: 'grp-id' }
      const escalista = createEscalistaFixture(dto)
      mockPrisma.escalista.create.mockResolvedValue(escalista)

      const result = await repository.create(dto)

      expect(result).toEqual(escalista)
      expect(mockPrisma.escalista.create).toHaveBeenCalledWith({ data: dto })
    })
  })

  describe('findAll', () => {
    it('should return paginated escalistas', async () => {
      const escalistas = createEscalistaListFixture(5)
      mockPrisma.escalista.findMany.mockResolvedValue(escalistas)
      mockPrisma.escalista.count.mockResolvedValue(5)

      const result = await repository.findAll({ page: 1, limit: 10 })

      expect(result.data).toEqual(escalistas)
      expect(result.meta.total).toBe(5)
      expect(result.meta.page).toBe(1)
    })

    it('should apply status filter', async () => {
      mockPrisma.escalista.findMany.mockResolvedValue([])
      mockPrisma.escalista.count.mockResolvedValue(0)

      await repository.findAll({ status: 'ativo' })

      expect(mockPrisma.escalista.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ativo' }),
        })
      )
    })

    it('should apply medicoId filter', async () => {
      mockPrisma.escalista.findMany.mockResolvedValue([])
      mockPrisma.escalista.count.mockResolvedValue(0)

      await repository.findAll({ medicoId: 'med-id' })

      expect(mockPrisma.escalista.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicoId: 'med-id' }),
        })
      )
    })

    it('should apply grupoId filter', async () => {
      mockPrisma.escalista.findMany.mockResolvedValue([])
      mockPrisma.escalista.count.mockResolvedValue(0)

      await repository.findAll({ grupoId: 'grp-id' })

      expect(mockPrisma.escalista.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ grupoId: 'grp-id' }),
        })
      )
    })

    it('should use default pagination values', async () => {
      mockPrisma.escalista.findMany.mockResolvedValue([])
      mockPrisma.escalista.count.mockResolvedValue(0)

      const result = await repository.findAll({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(10)
    })
  })

  describe('findById', () => {
    it('should return escalista by id', async () => {
      const escalista = createEscalistaFixture({ id: 'test-id' })
      mockPrisma.escalista.findUnique.mockResolvedValue(escalista)

      const result = await repository.findById('test-id')

      expect(result).toEqual(escalista)
      expect(mockPrisma.escalista.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.escalista.findUnique.mockResolvedValue(null)

      const result = await repository.findById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('findByMedicoAndGrupo', () => {
    it('should return escalista by medico and grupo', async () => {
      const escalista = createEscalistaFixture({ medicoId: 'med-id', grupoId: 'grp-id' })
      mockPrisma.escalista.findUnique.mockResolvedValue(escalista)

      const result = await repository.findByMedicoAndGrupo('med-id', 'grp-id')

      expect(result).toEqual(escalista)
      expect(mockPrisma.escalista.findUnique).toHaveBeenCalledWith({
        where: { medicoId_grupoId: { medicoId: 'med-id', grupoId: 'grp-id' } },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.escalista.findUnique.mockResolvedValue(null)

      const result = await repository.findByMedicoAndGrupo('med-id', 'grp-id')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update escalista', async () => {
      const escalista = createEscalistaFixture({ status: 'ativo' })
      mockPrisma.escalista.update.mockResolvedValue(escalista)

      const result = await repository.update('id', { status: 'ativo' })

      expect(result).toEqual(escalista)
      expect(mockPrisma.escalista.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { status: 'ativo' },
      })
    })
  })

  describe('delete', () => {
    it('should delete escalista', async () => {
      mockPrisma.escalista.delete.mockResolvedValue({})

      await repository.delete('id')

      expect(mockPrisma.escalista.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      })
    })
  })

  describe('medicoExists', () => {
    it('should return true when medico exists', async () => {
      mockPrisma.medico.count.mockResolvedValue(1)

      const result = await repository.medicoExists('med-id')

      expect(result).toBe(true)
    })

    it('should return false when medico does not exist', async () => {
      mockPrisma.medico.count.mockResolvedValue(0)

      const result = await repository.medicoExists('invalid-id')

      expect(result).toBe(false)
    })
  })

  describe('grupoExists', () => {
    it('should return true when grupo exists', async () => {
      mockPrisma.grupo.count.mockResolvedValue(1)

      const result = await repository.grupoExists('grp-id')

      expect(result).toBe(true)
    })

    it('should return false when grupo does not exist', async () => {
      mockPrisma.grupo.count.mockResolvedValue(0)

      const result = await repository.grupoExists('invalid-id')

      expect(result).toBe(false)
    })
  })
})
