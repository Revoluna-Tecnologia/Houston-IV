import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GruposRepository } from '../grupos.repository'
import { createGrupoFixture, createGrupoListFixture } from '../../__tests__/fixtures'

describe('GruposRepository', () => {
  let repository: GruposRepository

  const mockPrisma = {
    grupo: {
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
    repository = new GruposRepository(mockPrisma as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new grupo', async () => {
      const dto = { nome: 'Novo Grupo', descricao: 'Descricao' }
      const grupo = createGrupoFixture(dto)
      mockPrisma.grupo.create.mockResolvedValue(grupo)

      const result = await repository.create(dto)

      expect(result).toEqual(grupo)
      expect(mockPrisma.grupo.create).toHaveBeenCalledWith({ data: dto })
    })
  })

  describe('findAll', () => {
    it('should return paginated grupos', async () => {
      const grupos = createGrupoListFixture(5)
      mockPrisma.grupo.findMany.mockResolvedValue(grupos)
      mockPrisma.grupo.count.mockResolvedValue(5)

      const result = await repository.findAll({ page: 1, limit: 10 })

      expect(result.data).toEqual(grupos)
      expect(result.meta.total).toBe(5)
      expect(result.meta.page).toBe(1)
    })

    it('should apply ativo filter', async () => {
      mockPrisma.grupo.findMany.mockResolvedValue([])
      mockPrisma.grupo.count.mockResolvedValue(0)

      await repository.findAll({ ativo: true })

      expect(mockPrisma.grupo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        })
      )
    })

    it('should apply search filter', async () => {
      mockPrisma.grupo.findMany.mockResolvedValue([])
      mockPrisma.grupo.count.mockResolvedValue(0)

      await repository.findAll({ search: 'Hospital' })

      expect(mockPrisma.grupo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it('should use default pagination values', async () => {
      mockPrisma.grupo.findMany.mockResolvedValue([])
      mockPrisma.grupo.count.mockResolvedValue(0)

      const result = await repository.findAll({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(10)
    })
  })

  describe('findById', () => {
    it('should return grupo by id', async () => {
      const grupo = createGrupoFixture({ id: 'test-id' })
      mockPrisma.grupo.findUnique.mockResolvedValue(grupo)

      const result = await repository.findById('test-id')

      expect(result).toEqual(grupo)
      expect(mockPrisma.grupo.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.grupo.findUnique.mockResolvedValue(null)

      const result = await repository.findById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('findByNome', () => {
    it('should return grupo by nome', async () => {
      const grupo = createGrupoFixture({ nome: 'Grupo ABC' })
      mockPrisma.grupo.findFirst.mockResolvedValue(grupo)

      const result = await repository.findByNome('Grupo ABC')

      expect(result).toEqual(grupo)
    })
  })

  describe('findByNomeExcludingId', () => {
    it('should find by nome excluding specific id', async () => {
      mockPrisma.grupo.findFirst.mockResolvedValue(null)

      await repository.findByNomeExcludingId('Grupo ABC', 'exclude-id')

      expect(mockPrisma.grupo.findFirst).toHaveBeenCalledWith({
        where: { nome: 'Grupo ABC', NOT: { id: 'exclude-id' } },
      })
    })
  })

  describe('update', () => {
    it('should update grupo', async () => {
      const grupo = createGrupoFixture({ nome: 'Updated' })
      mockPrisma.grupo.update.mockResolvedValue(grupo)

      const result = await repository.update('id', { nome: 'Updated' })

      expect(result).toEqual(grupo)
      expect(mockPrisma.grupo.update).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { nome: 'Updated' },
      })
    })
  })

  describe('delete', () => {
    it('should delete grupo', async () => {
      mockPrisma.grupo.delete.mockResolvedValue({})

      await repository.delete('id')

      expect(mockPrisma.grupo.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      })
    })
  })
})
