import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { HospitaisService } from '../hospitais.service'
import { HospitaisRepository } from '../hospitais.repository'
import { GruposService } from '../../grupos/grupos.service'
import { GruposRepository } from '../../grupos/grupos.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('HospitaisService (Integration)', () => {
  let module: TestingModule
  let service: HospitaisService
  let gruposService: GruposService
  let prisma: PrismaService
  let testGrupoId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [
        HospitaisService,
        HospitaisRepository,
        GruposService,
        GruposRepository,
      ],
    }).compile()

    service = module.get<HospitaisService>(HospitaisService)
    gruposService = module.get<GruposService>(GruposService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up in correct order (respecting foreign keys)
    await prisma.hospital.deleteMany()
    await prisma.grupo.deleteMany()

    // Create a test grupo for hospital tests
    const grupo = await gruposService.create({ nome: 'Grupo de Teste' })
    testGrupoId = grupo.id
  })

  describe('create', () => {
    it('should create a new hospital', async () => {
      const dto = {
        nome: 'Hospital São Paulo',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Principal, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        telefone: '(11) 3333-4444',
        email: 'contato@hospital.com',
        grupoId: testGrupoId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.nome).toBe(dto.nome)
      expect(result.cnpj).toBe(dto.cnpj)
      expect(result.cidade).toBe(dto.cidade)
      expect(result.grupoId).toBe(testGrupoId)
      expect(result.ativo).toBe(true)
    })

    it('should throw ConflictException when hospital with same CNPJ exists', async () => {
      const dto = {
        nome: 'Hospital A',
        cnpj: '11.111.111/0001-11',
        grupoId: testGrupoId,
      }

      await service.create(dto)

      const dto2 = {
        nome: 'Hospital B',
        cnpj: '11.111.111/0001-11',
        grupoId: testGrupoId,
      }

      await expect(service.create(dto2)).rejects.toThrow(ConflictException)
      await expect(service.create(dto2)).rejects.toThrow('Hospital com este CNPJ ja existe')
    })

    it('should create hospital without CNPJ', async () => {
      const dto = {
        nome: 'Hospital Sem CNPJ',
        grupoId: testGrupoId,
      }

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(result.cnpj).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty list when no hospitais exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of hospitais', async () => {
      await service.create({ nome: 'Hospital A', grupoId: testGrupoId })
      await service.create({ nome: 'Hospital B', grupoId: testGrupoId })
      await service.create({ nome: 'Hospital C', grupoId: testGrupoId })

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by grupoId', async () => {
      const outroGrupo = await gruposService.create({ nome: 'Outro Grupo' })

      await service.create({ nome: 'Hospital Grupo 1', grupoId: testGrupoId })
      await service.create({ nome: 'Hospital Grupo 2', grupoId: outroGrupo.id })

      const result = await service.findAll({ grupoId: testGrupoId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Hospital Grupo 1')
    })

    it('should filter by ativo status', async () => {
      await service.create({ nome: 'Hospital Ativo', grupoId: testGrupoId })
      const inativo = await service.create({ nome: 'Hospital Inativo', grupoId: testGrupoId })
      await service.update(inativo.id, { ativo: false })

      const result = await service.findAll({ ativo: true })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Hospital Ativo')
    })

    it('should search by nome', async () => {
      await service.create({ nome: 'Santa Casa de Misericórdia', grupoId: testGrupoId })
      await service.create({ nome: 'Hospital Regional', grupoId: testGrupoId })

      const result = await service.findAll({ search: 'Santa' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Santa Casa de Misericórdia')
    })
  })

  describe('findOne', () => {
    it('should return a hospital by id', async () => {
      const created = await service.create({
        nome: 'Hospital Específico',
        grupoId: testGrupoId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.nome).toBe('Hospital Específico')
    })

    it('should throw NotFoundException when hospital does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Hospital nao encontrado')
    })
  })

  describe('update', () => {
    it('should update a hospital', async () => {
      const created = await service.create({
        nome: 'Hospital Original',
        grupoId: testGrupoId,
      })

      const result = await service.update(created.id, {
        nome: 'Hospital Atualizado',
        telefone: '(11) 9999-8888',
      })

      expect(result.nome).toBe('Hospital Atualizado')
      expect(result.telefone).toBe('(11) 9999-8888')
    })

    it('should throw NotFoundException when updating non-existent hospital', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.update(nonExistentId, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ConflictException when updating to existing CNPJ', async () => {
      await service.create({
        nome: 'Hospital Existente',
        cnpj: '22.222.222/0001-22',
        grupoId: testGrupoId,
      })
      const outro = await service.create({
        nome: 'Outro Hospital',
        cnpj: '33.333.333/0001-33',
        grupoId: testGrupoId,
      })

      await expect(
        service.update(outro.id, { cnpj: '22.222.222/0001-22' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should delete a hospital', async () => {
      const created = await service.create({
        nome: 'Hospital a Deletar',
        grupoId: testGrupoId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent hospital', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
