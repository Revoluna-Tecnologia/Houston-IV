import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { CheckinCheckoutService } from '../checkin-checkout.service'
import { CheckinCheckoutRepository } from '../checkin-checkout.repository'
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

describe('CheckinCheckoutService (Integration)', () => {
  let module: TestingModule
  let service: CheckinCheckoutService
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
        CheckinCheckoutService,
        CheckinCheckoutRepository,
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

    service = module.get<CheckinCheckoutService>(CheckinCheckoutService)
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
    await prisma.checkinCheckout.deleteMany()
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
    it('should create a new checkin-checkout record', async () => {
      const dto = {
        vagaId: testVagaId,
        medicoId: testMedicoId,
        observacoes: 'Plantao noturno',
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.vagaId).toBe(testVagaId)
      expect(result.medicoId).toBe(testMedicoId)
      expect(result.observacoes).toBe('Plantao noturno')
      expect(result.checkinAt).toBeNull()
      expect(result.checkoutAt).toBeNull()
    })

    it('should throw ConflictException when record already exists for vaga and medico', async () => {
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
      ).rejects.toThrow('Registro de checkin/checkout ja existe para esta vaga e medico')
    })

    it('should allow same medico in different vagas', async () => {
      const outraVaga = await vagasService.create({
        data: '2025-01-16',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })

      const record1 = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const record2 = await service.create({
        vagaId: outraVaga.id,
        medicoId: testMedicoId,
      })

      expect(record1.vagaId).not.toBe(record2.vagaId)
      expect(record1.medicoId).toBe(record2.medicoId)
    })
  })

  describe('findAll', () => {
    it('should return empty list when no records exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of records', async () => {
      for (let i = 1; i <= 3; i++) {
        const vaga = await vagasService.create({
          data: `2025-01-${15 + i}`,
          horaInicio: '08:00',
          horaFim: '12:00',
          valor: 1500,
          hospitalId: testHospitalId,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        })
        await service.create({
          vagaId: vaga.id,
          medicoId: testMedicoId,
        })
      }

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by medicoId', async () => {
      const outroMedico = await medicosService.create({
        nome: 'Dra. Maria Santos',
        crm: '654321',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

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
        vagaId: outraVaga.id,
        medicoId: outroMedico.id,
      })

      const result = await service.findAll({ medicoId: testMedicoId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].medicoId).toBe(testMedicoId)
    })
  })

  describe('findOne', () => {
    it('should return a record by id', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.vagaId).toBe(testVagaId)
    })

    it('should throw NotFoundException when record does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        'Registro de checkin/checkout nao encontrado'
      )
    })
  })

  describe('checkin', () => {
    it('should register checkin', async () => {
      const record = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const result = await service.checkin(record.id)

      expect(result.checkinAt).toBeDefined()
      expect(result.checkinAt).toBeInstanceOf(Date)
      expect(result.checkoutAt).toBeNull()
    })

    it('should throw NotFoundException when record does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.checkin(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when checkin already registered', async () => {
      const record = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })
      await service.checkin(record.id)

      await expect(service.checkin(record.id)).rejects.toThrow(BadRequestException)
      await expect(service.checkin(record.id)).rejects.toThrow('Checkin ja foi registrado')
    })
  })

  describe('checkout', () => {
    it('should register checkout after checkin', async () => {
      const record = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })
      await service.checkin(record.id)

      const result = await service.checkout(record.id)

      expect(result.checkinAt).toBeDefined()
      expect(result.checkoutAt).toBeDefined()
      expect(result.checkoutAt).toBeInstanceOf(Date)
    })

    it('should throw NotFoundException when record does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.checkout(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when checkin not registered', async () => {
      const record = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      await expect(service.checkout(record.id)).rejects.toThrow(BadRequestException)
      await expect(service.checkout(record.id)).rejects.toThrow(
        'Checkin deve ser registrado antes do checkout'
      )
    })

    it('should throw BadRequestException when checkout already registered', async () => {
      const record = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })
      await service.checkin(record.id)
      await service.checkout(record.id)

      await expect(service.checkout(record.id)).rejects.toThrow(BadRequestException)
      await expect(service.checkout(record.id)).rejects.toThrow('Checkout ja foi registrado')
    })
  })

  describe('update', () => {
    it('should update a record', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      const result = await service.update(created.id, {
        observacoes: 'Observacoes atualizadas',
      })

      expect(result.observacoes).toBe('Observacoes atualizadas')
    })

    it('should throw NotFoundException when updating non-existent record', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.update(nonExistentId, { observacoes: 'Teste' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete a record', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent record', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })

  describe('complete flow', () => {
    it('should complete full checkin-checkout flow', async () => {
      // Create record
      const record = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        observacoes: 'Plantao de emergencia',
      })
      expect(record.checkinAt).toBeNull()
      expect(record.checkoutAt).toBeNull()

      // Checkin
      const afterCheckin = await service.checkin(record.id)
      expect(afterCheckin.checkinAt).toBeDefined()
      expect(afterCheckin.checkoutAt).toBeNull()

      // Checkout
      const afterCheckout = await service.checkout(record.id)
      expect(afterCheckout.checkinAt).toBeDefined()
      expect(afterCheckout.checkoutAt).toBeDefined()
      expect(afterCheckout.checkoutAt!.getTime()).toBeGreaterThanOrEqual(
        afterCheckout.checkinAt!.getTime()
      )
    })
  })
})
