import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { VagasService } from '../vagas.service'
import { VagasRepository } from '../vagas.repository'
import { HospitaisService } from '../../hospitais/hospitais.service'
import { HospitaisRepository } from '../../hospitais/hospitais.repository'
import { SetoresService } from '../../setores/setores.service'
import { SetoresRepository } from '../../setores/setores.repository'
import { EspecialidadesService } from '../../especialidades/especialidades.service'
import { EspecialidadesRepository } from '../../especialidades/especialidades.repository'
import { GruposService } from '../../grupos/grupos.service'
import { GruposRepository } from '../../grupos/grupos.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('VagasService (Integration)', () => {
  let module: TestingModule
  let service: VagasService
  let prisma: PrismaService
  let hospitaisService: HospitaisService
  let setoresService: SetoresService
  let especialidadesService: EspecialidadesService
  let gruposService: GruposService

  // Test data IDs
  let testGrupoId: string
  let testHospitalId: string
  let testSetorId: string
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
        VagasService,
        VagasRepository,
        HospitaisService,
        HospitaisRepository,
        SetoresService,
        SetoresRepository,
        EspecialidadesService,
        EspecialidadesRepository,
        GruposService,
        GruposRepository,
      ],
    }).compile()

    service = module.get<VagasService>(VagasService)
    prisma = module.get<PrismaService>(PrismaService)
    hospitaisService = module.get<HospitaisService>(HospitaisService)
    setoresService = module.get<SetoresService>(SetoresService)
    especialidadesService = module.get<EspecialidadesService>(EspecialidadesService)
    gruposService = module.get<GruposService>(GruposService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up tables in correct order (FK dependencies)
    await prisma.vaga.deleteMany()
    await prisma.setor.deleteMany()
    await prisma.hospital.deleteMany()
    await prisma.especialidade.deleteMany()
    await prisma.grupo.deleteMany()

    // Create test dependencies
    const grupo = await gruposService.create({ nome: 'Grupo de Teste' })
    testGrupoId = grupo.id

    const hospital = await hospitaisService.create({
      nome: 'Hospital de Teste',
      grupoId: testGrupoId,
    })
    testHospitalId = hospital.id

    const setor = await setoresService.create({
      nome: 'Setor de Teste',
      hospitalId: testHospitalId,
    })
    testSetorId = setor.id

    const especialidade = await especialidadesService.create({
      nome: 'Especialidade de Teste',
    })
    testEspecialidadeId = especialidade.id
  })

  describe('create', () => {
    it('should create a new vaga', async () => {
      const dto = {
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.horaInicio).toBe('08:00')
      expect(result.horaFim).toBe('12:00')
      expect(result.valor).toBe(1500)
      expect(result.status).toBe('aberta')
      expect(result.hospitalId).toBe(testHospitalId)
      expect(result.setorId).toBe(testSetorId)
      expect(result.especialidadeId).toBe(testEspecialidadeId)
    })

    it('should throw ConflictException when vaga conflicts with existing one', async () => {
      const dto = {
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      }

      await service.create(dto)

      // Try to create another vaga at same time, same hospital/setor
      await expect(service.create(dto)).rejects.toThrow(ConflictException)
      await expect(service.create(dto)).rejects.toThrow(
        'Ja existe uma vaga neste horario para o mesmo hospital e setor'
      )
    })

    it('should allow creating vaga at different times', async () => {
      const dto1 = {
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      }

      const dto2 = {
        data: '2025-01-15',
        horaInicio: '14:00',
        horaFim: '18:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      }

      const vaga1 = await service.create(dto1)
      const vaga2 = await service.create(dto2)

      expect(vaga1.id).not.toBe(vaga2.id)
      expect(vaga1.horaInicio).toBe('08:00')
      expect(vaga2.horaInicio).toBe('14:00')
    })

    it('should create vaga with observacoes', async () => {
      const dto = {
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        observacoes: 'Vaga urgente',
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      }

      const result = await service.create(dto)

      expect(result.observacoes).toBe('Vaga urgente')
    })
  })

  describe('findAll', () => {
    it('should return empty list when no vagas exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of vagas', async () => {
      // Create 3 vagas
      for (let i = 0; i < 3; i++) {
        await service.create({
          data: `2025-01-${15 + i}`,
          horaInicio: '08:00',
          horaFim: '12:00',
          valor: 1500,
          hospitalId: testHospitalId,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        })
      }

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by hospitalId', async () => {
      // Create another hospital
      const outroHospital = await hospitaisService.create({
        nome: 'Outro Hospital',
        grupoId: testGrupoId,
      })
      const outroSetor = await setoresService.create({
        nome: 'Outro Setor',
        hospitalId: outroHospital.id,
      })

      await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: outroHospital.id,
        setorId: outroSetor.id,
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.findAll({ hospitalId: testHospitalId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].hospitalId).toBe(testHospitalId)
    })

    it('should filter by status', async () => {
      const vaga = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        data: '2025-01-16',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      // Update first vaga to anunciada
      await service.updateStatus(vaga.id, 'anunciada')

      const result = await service.findAll({ status: 'anunciada' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('anunciada')
    })
  })

  describe('findOne', () => {
    it('should return a vaga by id', async () => {
      const created = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.horaInicio).toBe('08:00')
    })

    it('should throw NotFoundException when vaga does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Vaga nao encontrada')
    })
  })

  describe('update', () => {
    it('should update a vaga', async () => {
      const created = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.update(created.id, {
        valor: 2000,
        observacoes: 'Valor atualizado',
      })

      expect(result.valor).toBe(2000)
      expect(result.observacoes).toBe('Valor atualizado')
    })

    it('should throw NotFoundException when updating non-existent vaga', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.update(nonExistentId, { valor: 2000 })).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('updateStatus', () => {
    it('should update vaga status from aberta to anunciada', async () => {
      const created = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.updateStatus(created.id, 'anunciada')

      expect(result.status).toBe('anunciada')
    })

    it('should throw BadRequestException for invalid status transition', async () => {
      const created = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      // First close the vaga
      await service.updateStatus(created.id, 'fechada')

      // Try to reopen (invalid transition)
      await expect(service.updateStatus(created.id, 'aberta')).rejects.toThrow(
        BadRequestException
      )
      await expect(service.updateStatus(created.id, 'aberta')).rejects.toThrow(
        'Transicao de status invalida: fechada -> aberta'
      )
    })

    it('should allow transition from aberta to cancelada', async () => {
      const created = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.updateStatus(created.id, 'cancelada')

      expect(result.status).toBe('cancelada')
    })
  })

  describe('remove', () => {
    it('should delete a vaga', async () => {
      const created = await service.create({
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent vaga', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
