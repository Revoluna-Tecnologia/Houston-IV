import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { GruposService } from '../grupos.service'
import { GruposRepository } from '../grupos.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('GruposService (Integration)', () => {
  let module: TestingModule
  let service: GruposService
  let prisma: PrismaService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [GruposService, GruposRepository],
    }).compile()

    service = module.get<GruposService>(GruposService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up grupos table before each test
    await prisma.grupo.deleteMany()
  })

  describe('create', () => {
    it('should create a new grupo', async () => {
      const dto = {
        nome: 'Grupo de Teste',
        descricao: 'Descrição do grupo de teste',
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.nome).toBe(dto.nome)
      expect(result.descricao).toBe(dto.descricao)
      expect(result.ativo).toBe(true)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should throw ConflictException when grupo with same name exists', async () => {
      const dto = { nome: 'Grupo Duplicado' }

      await service.create(dto)

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
      await expect(service.create(dto)).rejects.toThrow('Grupo com este nome ja existe')
    })

    it('should create grupo without description', async () => {
      const dto = { nome: 'Grupo Sem Descrição' }

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(result.descricao).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty list when no grupos exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of grupos', async () => {
      // Create test data
      await service.create({ nome: 'Grupo A' })
      await service.create({ nome: 'Grupo B' })
      await service.create({ nome: 'Grupo C' })

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
      expect(result.meta.hasNextPage).toBe(true)
    })

    it('should filter by ativo status', async () => {
      await service.create({ nome: 'Grupo Ativo' })
      const inativo = await service.create({ nome: 'Grupo Inativo' })
      await service.update(inativo.id, { ativo: false })

      const result = await service.findAll({ ativo: true })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Grupo Ativo')
    })

    it('should search by nome', async () => {
      await service.create({ nome: 'Hospital São Paulo' })
      await service.create({ nome: 'Clínica Central' })

      const result = await service.findAll({ search: 'Hospital' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Hospital São Paulo')
    })
  })

  describe('findOne', () => {
    it('should return a grupo by id', async () => {
      const created = await service.create({ nome: 'Grupo Específico' })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.nome).toBe('Grupo Específico')
    })

    it('should throw NotFoundException when grupo does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Grupo nao encontrado')
    })
  })

  describe('update', () => {
    it('should update a grupo', async () => {
      const created = await service.create({ nome: 'Grupo Original' })

      const result = await service.update(created.id, {
        nome: 'Grupo Atualizado',
        descricao: 'Nova descrição',
      })

      expect(result.nome).toBe('Grupo Atualizado')
      expect(result.descricao).toBe('Nova descrição')
    })

    it('should throw NotFoundException when updating non-existent grupo', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.update(nonExistentId, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ConflictException when updating to existing name', async () => {
      await service.create({ nome: 'Grupo Existente' })
      const outro = await service.create({ nome: 'Outro Grupo' })

      await expect(service.update(outro.id, { nome: 'Grupo Existente' })).rejects.toThrow(
        ConflictException
      )
    })

    it('should allow updating to the same name', async () => {
      const created = await service.create({ nome: 'Mesmo Nome' })

      const result = await service.update(created.id, { nome: 'Mesmo Nome' })

      expect(result.nome).toBe('Mesmo Nome')
    })
  })

  describe('remove', () => {
    it('should delete a grupo', async () => {
      const created = await service.create({ nome: 'Grupo a Deletar' })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent grupo', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
