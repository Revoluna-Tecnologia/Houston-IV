import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { EscalistasService } from '../escalistas.service'
import { EscalistasRepository } from '../escalistas.repository'
import { MedicosService } from '../../medicos/medicos.service'
import { MedicosRepository } from '../../medicos/medicos.repository'
import { EspecialidadesService } from '../../especialidades/especialidades.service'
import { EspecialidadesRepository } from '../../especialidades/especialidades.repository'
import { GruposService } from '../../grupos/grupos.service'
import { GruposRepository } from '../../grupos/grupos.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('EscalistasService (Integration)', () => {
  let module: TestingModule
  let service: EscalistasService
  let prisma: PrismaService
  let medicosService: MedicosService
  let especialidadesService: EspecialidadesService
  let gruposService: GruposService

  // Test data IDs
  let testMedicoId: string
  let testGrupoId: string
  let testEspecialidadeId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [
        EscalistasService,
        EscalistasRepository,
        MedicosService,
        MedicosRepository,
        EspecialidadesService,
        EspecialidadesRepository,
        GruposService,
        GruposRepository,
      ],
    }).compile()

    service = module.get<EscalistasService>(EscalistasService)
    prisma = module.get<PrismaService>(PrismaService)
    medicosService = module.get<MedicosService>(MedicosService)
    especialidadesService = module.get<EspecialidadesService>(EspecialidadesService)
    gruposService = module.get<GruposService>(GruposService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up tables in correct order (FK dependencies)
    await prisma.escalista.deleteMany()
    await prisma.medico.deleteMany()
    await prisma.especialidade.deleteMany()
    await prisma.grupo.deleteMany()

    // Create test dependencies
    const especialidade = await especialidadesService.create({
      nome: 'Cardiologia',
    })
    testEspecialidadeId = especialidade.id

    const grupo = await gruposService.create({ nome: 'Grupo de Teste' })
    testGrupoId = grupo.id

    const medico = await medicosService.create({
      nome: 'Dr. Joao Silva',
      crm: '123456',
      crmUf: 'SP',
      especialidadeId: testEspecialidadeId,
    })
    testMedicoId = medico.id
  })

  describe('create', () => {
    it('should create a new escalista', async () => {
      const dto = {
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.medicoId).toBe(testMedicoId)
      expect(result.grupoId).toBe(testGrupoId)
      expect(result.status).toBe('pendente')
    })

    it('should throw NotFoundException when medico does not exist', async () => {
      const nonExistentMedicoId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.create({
          medicoId: nonExistentMedicoId,
          grupoId: testGrupoId,
        })
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.create({
          medicoId: nonExistentMedicoId,
          grupoId: testGrupoId,
        })
      ).rejects.toThrow('Medico nao encontrado')
    })

    it('should throw NotFoundException when grupo does not exist', async () => {
      const nonExistentGrupoId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.create({
          medicoId: testMedicoId,
          grupoId: nonExistentGrupoId,
        })
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.create({
          medicoId: testMedicoId,
          grupoId: nonExistentGrupoId,
        })
      ).rejects.toThrow('Grupo nao encontrado')
    })

    it('should throw ConflictException when escalista already exists for medico and grupo', async () => {
      await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      await expect(
        service.create({
          medicoId: testMedicoId,
          grupoId: testGrupoId,
        })
      ).rejects.toThrow(ConflictException)
      await expect(
        service.create({
          medicoId: testMedicoId,
          grupoId: testGrupoId,
        })
      ).rejects.toThrow('Escalista ja existe para este medico e grupo')
    })

    it('should allow same medico in different grupos', async () => {
      const outroGrupo = await gruposService.create({ nome: 'Outro Grupo' })

      const escalista1 = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      const escalista2 = await service.create({
        medicoId: testMedicoId,
        grupoId: outroGrupo.id,
      })

      expect(escalista1.medicoId).toBe(testMedicoId)
      expect(escalista2.medicoId).toBe(testMedicoId)
      expect(escalista1.grupoId).not.toBe(escalista2.grupoId)
    })
  })

  describe('findAll', () => {
    it('should return empty list when no escalistas exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of escalistas', async () => {
      // Create multiple escalistas
      for (let i = 1; i <= 3; i++) {
        const medico = await medicosService.create({
          nome: `Dr. Medico ${i}`,
          crm: `${100000 + i}`,
          crmUf: 'SP',
          especialidadeId: testEspecialidadeId,
        })
        await service.create({
          medicoId: medico.id,
          grupoId: testGrupoId,
        })
      }

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by grupoId', async () => {
      const outroGrupo = await gruposService.create({ nome: 'Outro Grupo' })

      await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      const outroMedico = await medicosService.create({
        nome: 'Dra. Maria Santos',
        crm: '654321',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        medicoId: outroMedico.id,
        grupoId: outroGrupo.id,
      })

      const result = await service.findAll({ grupoId: testGrupoId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].grupoId).toBe(testGrupoId)
    })

    it('should filter by status', async () => {
      const escalista = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      // Activate the escalista
      await service.update(escalista.id, { status: 'ativo' })

      const outroMedico = await medicosService.create({
        nome: 'Dra. Maria Santos',
        crm: '654321',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        medicoId: outroMedico.id,
        grupoId: testGrupoId,
      })

      const result = await service.findAll({ status: 'pendente' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('pendente')
    })
  })

  describe('findOne', () => {
    it('should return an escalista by id', async () => {
      const created = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.status).toBe('pendente')
    })

    it('should throw NotFoundException when escalista does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Escalista nao encontrado')
    })
  })

  describe('update', () => {
    it('should update escalista status from pendente to ativo', async () => {
      const created = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      const result = await service.update(created.id, { status: 'ativo' })

      expect(result.status).toBe('ativo')
    })

    it('should update escalista status from ativo to inativo', async () => {
      const created = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })
      await service.update(created.id, { status: 'ativo' })

      const result = await service.update(created.id, { status: 'inativo' })

      expect(result.status).toBe('inativo')
    })

    it('should throw BadRequestException for invalid status transition', async () => {
      const created = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })
      await service.update(created.id, { status: 'ativo' })
      await service.update(created.id, { status: 'inativo' })

      // Trying to transition from inativo to ativo (not allowed)
      await expect(
        service.update(created.id, { status: 'ativo' })
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.update(created.id, { status: 'ativo' })
      ).rejects.toThrow('Transicao de status invalida: inativo -> ativo')
    })

    it('should throw NotFoundException when updating non-existent escalista', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.update(nonExistentId, { status: 'ativo' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete an escalista', async () => {
      const created = await service.create({
        medicoId: testMedicoId,
        grupoId: testGrupoId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent escalista', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
