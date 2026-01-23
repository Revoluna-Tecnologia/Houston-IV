import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { EspecialidadesService } from '../especialidades.service'
import { EspecialidadesRepository } from '../especialidades.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('EspecialidadesService (Integration)', () => {
  let module: TestingModule
  let service: EspecialidadesService
  let prisma: PrismaService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [EspecialidadesService, EspecialidadesRepository],
    }).compile()

    service = module.get<EspecialidadesService>(EspecialidadesService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up especialidades table before each test
    await prisma.especialidade.deleteMany()
  })

  describe('create', () => {
    it('should create a new especialidade', async () => {
      const dto = {
        nome: 'Cardiologia',
        sigla: 'CARD',
        cor: '#FF0000',
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.nome).toBe(dto.nome)
      expect(result.sigla).toBe(dto.sigla)
      expect(result.cor).toBe(dto.cor)
      expect(result.ativo).toBe(true)
    })

    it('should throw ConflictException when especialidade with same name exists', async () => {
      const dto = { nome: 'Ortopedia' }

      await service.create(dto)

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
      await expect(service.create(dto)).rejects.toThrow('Especialidade com este nome ja existe')
    })

    it('should create especialidade with only nome', async () => {
      const dto = { nome: 'Neurologia' }

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(result.sigla).toBeNull()
      expect(result.cor).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty list when no especialidades exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of especialidades', async () => {
      await service.create({ nome: 'Pediatria' })
      await service.create({ nome: 'Geriatria' })
      await service.create({ nome: 'Psiquiatria' })

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by ativo status', async () => {
      await service.create({ nome: 'Ativa' })
      const inativa = await service.create({ nome: 'Inativa' })
      await service.update(inativa.id, { ativo: false })

      const result = await service.findAll({ ativo: true })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Ativa')
    })

    it('should search by nome', async () => {
      await service.create({ nome: 'Cardiologia Pediátrica' })
      await service.create({ nome: 'Neurologia' })

      const result = await service.findAll({ search: 'Cardio' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Cardiologia Pediátrica')
    })
  })

  describe('findOne', () => {
    it('should return an especialidade by id', async () => {
      const created = await service.create({ nome: 'Dermatologia' })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.nome).toBe('Dermatologia')
    })

    it('should throw NotFoundException when especialidade does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Especialidade nao encontrada')
    })
  })

  describe('update', () => {
    it('should update an especialidade', async () => {
      const created = await service.create({ nome: 'Oftalmologia' })

      const result = await service.update(created.id, {
        sigla: 'OFT',
        cor: '#00FF00',
      })

      expect(result.nome).toBe('Oftalmologia')
      expect(result.sigla).toBe('OFT')
      expect(result.cor).toBe('#00FF00')
    })

    it('should throw NotFoundException when updating non-existent especialidade', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.update(nonExistentId, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ConflictException when updating to existing name', async () => {
      await service.create({ nome: 'Urologia' })
      const outra = await service.create({ nome: 'Proctologia' })

      await expect(service.update(outra.id, { nome: 'Urologia' })).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe('remove', () => {
    it('should delete an especialidade', async () => {
      const created = await service.create({ nome: 'Especialidade a Deletar' })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent especialidade', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
