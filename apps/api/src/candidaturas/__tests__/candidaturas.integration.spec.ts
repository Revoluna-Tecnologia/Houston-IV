import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { CandidaturasService } from '../candidaturas.service'
import { CandidaturasRepository } from '../candidaturas.repository'
import { VagasService } from '../../vagas/vagas.service'
import { VagasRepository } from '../../vagas/vagas.repository'
import { MedicosService } from '../../medicos/medicos.service'
import { MedicosRepository } from '../../medicos/medicos.repository'
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

describe('CandidaturasService (Integration)', () => {
  let module: TestingModule
  let service: CandidaturasService
  let prisma: PrismaService
  let vagasService: VagasService
  let medicosService: MedicosService
  let hospitaisService: HospitaisService
  let setoresService: SetoresService
  let especialidadesService: EspecialidadesService
  let gruposService: GruposService

  // Test data IDs
  let testGrupoId: string
  let testHospitalId: string
  let testSetorId: string
  let testEspecialidadeId: string
  let testMedicoId: string
  let testVagaId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [
        CandidaturasService,
        CandidaturasRepository,
        VagasService,
        VagasRepository,
        MedicosService,
        MedicosRepository,
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

    service = module.get<CandidaturasService>(CandidaturasService)
    prisma = module.get<PrismaService>(PrismaService)
    vagasService = module.get<VagasService>(VagasService)
    medicosService = module.get<MedicosService>(MedicosService)
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
    await prisma.candidatura.deleteMany()
    await prisma.vaga.deleteMany()
    await prisma.medico.deleteMany()
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

    const medico = await medicosService.create({
      nome: 'Dr. Joao Silva',
      crm: '123456',
      crmUf: 'SP',
      especialidadeId: testEspecialidadeId,
    })
    testMedicoId = medico.id

    const vaga = await vagasService.create({
      data: '2025-01-15',
      horaInicio: '08:00',
      horaFim: '12:00',
      valor: 1500,
      hospitalId: testHospitalId,
      setorId: testSetorId,
      especialidadeId: testEspecialidadeId,
    })
    testVagaId = vaga.id
  })

  describe('create', () => {
    it('should create a new candidatura', async () => {
      const dto = {
        vagaId: testVagaId,
        medicoId: testMedicoId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.vagaId).toBe(testVagaId)
      expect(result.medicoId).toBe(testMedicoId)
      expect(result.status).toBe('pendente')
    })

    it('should throw NotFoundException when vaga does not exist', async () => {
      const nonExistentVagaId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.create({
          vagaId: nonExistentVagaId,
          medicoId: testMedicoId,
        })
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.create({
          vagaId: nonExistentVagaId,
          medicoId: testMedicoId,
        })
      ).rejects.toThrow('Vaga nao encontrada')
    })

    it('should throw BadRequestException when vaga is not open', async () => {
      // Close the vaga
      await vagasService.updateStatus(testVagaId, 'fechada')

      await expect(
        service.create({
          vagaId: testVagaId,
          medicoId: testMedicoId,
        })
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.create({
          vagaId: testVagaId,
          medicoId: testMedicoId,
        })
      ).rejects.toThrow('Candidatura so pode ser feita em vagas abertas ou anunciadas')
    })

    it('should allow candidatura on anunciada vaga', async () => {
      // Set vaga to anunciada
      await vagasService.updateStatus(testVagaId, 'anunciada')

      const result = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      expect(result.status).toBe('pendente')
    })

    it('should throw ConflictException when candidatura already exists', async () => {
      await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      await expect(
        service.create({
          vagaId: testVagaId,
          medicoId: testMedicoId,
        })
      ).rejects.toThrow(ConflictException)
      await expect(
        service.create({
          vagaId: testVagaId,
          medicoId: testMedicoId,
        })
      ).rejects.toThrow('Candidatura ja existe para esta vaga e medico')
    })
  })

  describe('findAll', () => {
    it('should return empty list when no candidaturas exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of candidaturas', async () => {
      // Create multiple medicos and candidaturas
      for (let i = 1; i <= 3; i++) {
        const medico = await medicosService.create({
          nome: `Dr. Medico ${i}`,
          crm: `${100000 + i}`,
          crmUf: 'SP',
          especialidadeId: testEspecialidadeId,
        })
        await service.create({
          vagaId: testVagaId,
          medicoId: medico.id,
        })
      }

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by vagaId', async () => {
      // Create another vaga
      const outraVaga = await vagasService.create({
        data: '2025-01-16',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const outroMedico = await medicosService.create({
        nome: 'Dra. Maria Santos',
        crm: '654321',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        vagaId: outraVaga.id,
        medicoId: outroMedico.id,
      })

      const result = await service.findAll({ vagaId: testVagaId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].vagaId).toBe(testVagaId)
    })

    it('should filter by status', async () => {
      const candidatura = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      // Create another vaga and candidatura, then approve it
      const outraVaga = await vagasService.create({
        data: '2025-01-16',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      const outroMedico = await medicosService.create({
        nome: 'Dra. Maria Santos',
        crm: '654321',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      const outraCandidatura = await service.create({
        vagaId: outraVaga.id,
        medicoId: outroMedico.id,
      })

      await service.approve(outraCandidatura.id)

      const result = await service.findAll({ status: 'pendente' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(candidatura.id)
    })
  })

  describe('findOne', () => {
    it('should return a candidatura by id', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.status).toBe('pendente')
    })

    it('should throw NotFoundException when candidatura does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        'Candidatura nao encontrada'
      )
    })
  })

  describe('approve', () => {
    it('should approve a candidatura and close the vaga', async () => {
      const candidatura = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const result = await service.approve(candidatura.id)

      expect(result.status).toBe('aprovada')

      // Check that vaga was closed
      const vaga = await vagasService.findOne(testVagaId)
      expect(vaga.status).toBe('fechada')
    })

    it('should throw NotFoundException when candidatura does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.approve(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when candidatura is not pending', async () => {
      const candidatura = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      // Approve first
      await service.approve(candidatura.id)

      // Try to approve again
      await expect(service.approve(candidatura.id)).rejects.toThrow(BadRequestException)
      await expect(service.approve(candidatura.id)).rejects.toThrow(
        'Apenas candidaturas pendentes podem ser aprovadas'
      )
    })
  })

  describe('reject', () => {
    it('should reject a candidatura', async () => {
      const candidatura = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const result = await service.reject(candidatura.id)

      expect(result.status).toBe('rejeitada')

      // Check that vaga is still open
      const vaga = await vagasService.findOne(testVagaId)
      expect(vaga.status).toBe('aberta')
    })

    it('should throw NotFoundException when candidatura does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.reject(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when candidatura is not pending', async () => {
      const candidatura = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      // Reject first
      await service.reject(candidatura.id)

      // Try to reject again
      await expect(service.reject(candidatura.id)).rejects.toThrow(BadRequestException)
      await expect(service.reject(candidatura.id)).rejects.toThrow(
        'Apenas candidaturas pendentes podem ser rejeitadas'
      )
    })
  })

  describe('remove', () => {
    it('should delete a candidatura', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent candidatura', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
