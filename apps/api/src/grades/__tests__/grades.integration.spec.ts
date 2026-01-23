import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { GradesService } from '../grades.service'
import { GradesRepository } from '../grades.repository'
import { VagasService } from '../../vagas/vagas.service'
import { VagasRepository } from '../../vagas/vagas.repository'
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

describe('GradesService (Integration)', () => {
  let module: TestingModule
  let service: GradesService
  let prisma: PrismaService
  let hospitaisService: HospitaisService
  let setoresService: SetoresService
  let especialidadesService: EspecialidadesService
  let gruposService: GruposService
  let vagasService: VagasService

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
        GradesService,
        GradesRepository,
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

    service = module.get<GradesService>(GradesService)
    prisma = module.get<PrismaService>(PrismaService)
    hospitaisService = module.get<HospitaisService>(HospitaisService)
    setoresService = module.get<SetoresService>(SetoresService)
    especialidadesService = module.get<EspecialidadesService>(EspecialidadesService)
    gruposService = module.get<GruposService>(GruposService)
    vagasService = module.get<VagasService>(VagasService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up tables in correct order (FK dependencies)
    await prisma.vaga.deleteMany()
    await prisma.timeSlot.deleteMany()
    await prisma.grade.deleteMany()
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
      nome: 'Cardiologia',
    })
    testEspecialidadeId = especialidade.id
  })

  describe('create', () => {
    it('should create a new grade', async () => {
      const dto = {
        nome: 'Grade Janeiro 2025',
        descricao: 'Grade de plantoes de janeiro',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.nome).toBe(dto.nome)
      expect(result.descricao).toBe(dto.descricao)
      expect(result.status).toBe('rascunho')
      expect(result.hospitalId).toBe(testHospitalId)
      expect(result.setorId).toBe(testSetorId)
    })

    it('should throw BadRequestException when dataInicio is after dataFim', async () => {
      const dto = {
        nome: 'Grade Invalida',
        dataInicio: '2025-01-31',
        dataFim: '2025-01-01',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      }

      await expect(service.create(dto)).rejects.toThrow(BadRequestException)
      await expect(service.create(dto)).rejects.toThrow(
        'dataInicio deve ser anterior a dataFim'
      )
    })

    it('should create grade with only required fields', async () => {
      const dto = {
        nome: 'Grade Minima',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      }

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(result.descricao).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty list when no grades exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of grades', async () => {
      for (let i = 1; i <= 3; i++) {
        await service.create({
          nome: `Grade ${i}`,
          dataInicio: `2025-0${i}-01`,
          dataFim: `2025-0${i}-28`,
          hospitalId: testHospitalId,
          setorId: testSetorId,
        })
      }

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by hospitalId', async () => {
      const outroHospital = await hospitaisService.create({
        nome: 'Outro Hospital',
        grupoId: testGrupoId,
      })

      const outroSetor = await setoresService.create({
        nome: 'Outro Setor',
        hospitalId: outroHospital.id,
      })

      await service.create({
        nome: 'Grade Hospital 1',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      await service.create({
        nome: 'Grade Hospital 2',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: outroHospital.id,
        setorId: outroSetor.id,
      })

      const result = await service.findAll({ hospitalId: testHospitalId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].hospitalId).toBe(testHospitalId)
    })

    it('should filter by status', async () => {
      const grade = await service.create({
        nome: 'Grade Publicada',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })
      await service.publish(grade.id)

      await service.create({
        nome: 'Grade Rascunho',
        dataInicio: '2025-02-01',
        dataFim: '2025-02-28',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      const result = await service.findAll({ status: 'publicada' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('publicada')
    })
  })

  describe('findOne', () => {
    it('should return a grade by id', async () => {
      const created = await service.create({
        nome: 'Grade de Teste',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.nome).toBe('Grade de Teste')
    })

    it('should throw NotFoundException when grade does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Grade nao encontrada')
    })
  })

  describe('update', () => {
    it('should update a grade', async () => {
      const created = await service.create({
        nome: 'Grade Original',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      const result = await service.update(created.id, {
        nome: 'Grade Atualizada',
        descricao: 'Descricao adicionada',
      })

      expect(result.nome).toBe('Grade Atualizada')
      expect(result.descricao).toBe('Descricao adicionada')
    })

    it('should throw NotFoundException when updating non-existent grade', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.update(nonExistentId, { nome: 'Novo Nome' })
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when updating with invalid date range', async () => {
      const created = await service.create({
        nome: 'Grade Original',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      await expect(
        service.update(created.id, {
          dataInicio: '2025-01-31',
          dataFim: '2025-01-01',
        })
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('publish', () => {
    it('should publish a grade in rascunho status', async () => {
      const created = await service.create({
        nome: 'Grade para Publicar',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      const result = await service.publish(created.id)

      expect(result.status).toBe('publicada')
    })

    it('should throw NotFoundException when grade does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.publish(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when grade is already published', async () => {
      const created = await service.create({
        nome: 'Grade Publicada',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })
      await service.publish(created.id)

      await expect(service.publish(created.id)).rejects.toThrow(BadRequestException)
      await expect(service.publish(created.id)).rejects.toThrow(
        'Apenas grades em rascunho podem ser publicadas'
      )
    })
  })

  describe('addTimeSlots', () => {
    it('should add time slots to a grade', async () => {
      const grade = await service.create({
        nome: 'Grade com Slots',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      const timeSlots = [
        { data: '2025-01-15', horaInicio: '08:00', horaFim: '12:00' },
        { data: '2025-01-15', horaInicio: '14:00', horaFim: '18:00' },
      ]

      const result = await service.addTimeSlots(grade.id, timeSlots)

      expect(result).toHaveLength(2)
      expect(result[0].horaInicio).toBe('08:00')
      expect(result[1].horaInicio).toBe('14:00')
    })

    it('should throw NotFoundException when grade does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.addTimeSlots(nonExistentId, [
          { data: '2025-01-15', horaInicio: '08:00', horaFim: '12:00' },
        ])
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('generateVagas', () => {
    it('should generate vagas from published grade with time slots', async () => {
      const grade = await service.create({
        nome: 'Grade para Gerar Vagas',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      await service.addTimeSlots(grade.id, [
        { data: '2025-01-15', horaInicio: '08:00', horaFim: '12:00' },
        { data: '2025-01-16', horaInicio: '08:00', horaFim: '12:00' },
      ])

      await service.publish(grade.id)

      const count = await service.generateVagas(grade.id, testEspecialidadeId, 1500)

      expect(count).toBe(2)

      // Verify vagas were created
      const vagas = await vagasService.findAll({ hospitalId: testHospitalId })
      expect(vagas.data).toHaveLength(2)
      expect(vagas.data[0].valor).toBe(1500)
    })

    it('should throw NotFoundException when grade does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.generateVagas(nonExistentId, testEspecialidadeId, 1500)
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when grade is not published', async () => {
      const grade = await service.create({
        nome: 'Grade Rascunho',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      await expect(
        service.generateVagas(grade.id, testEspecialidadeId, 1500)
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.generateVagas(grade.id, testEspecialidadeId, 1500)
      ).rejects.toThrow('Apenas grades publicadas podem gerar vagas')
    })
  })

  describe('remove', () => {
    it('should delete a grade', async () => {
      const created = await service.create({
        nome: 'Grade a Deletar',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: testHospitalId,
        setorId: testSetorId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent grade', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
