import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PagamentosService } from '../pagamentos.service'
import { PagamentosRepository } from '../pagamentos.repository'
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

describe('PagamentosService (Integration)', () => {
  let module: TestingModule
  let service: PagamentosService
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
        PagamentosService,
        PagamentosRepository,
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

    service = module.get<PagamentosService>(PagamentosService)
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
    await prisma.pagamento.deleteMany()
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
    it('should create a new pagamento', async () => {
      const dto = {
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
        observacoes: 'Pagamento referente ao plantao de 15/01',
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.vagaId).toBe(testVagaId)
      expect(result.medicoId).toBe(testMedicoId)
      expect(result.valor).toBe(1500)
      expect(result.status).toBe('pendente')
      expect(result.dataAutorizacao).toBeNull()
      expect(result.dataPagamento).toBeNull()
    })

    it('should throw ConflictException when pagamento already exists for vaga and medico', async () => {
      await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      await expect(
        service.create({
          vagaId: testVagaId,
          medicoId: testMedicoId,
          valor: 1500,
        })
      ).rejects.toThrow(ConflictException)
      await expect(
        service.create({
          vagaId: testVagaId,
          medicoId: testMedicoId,
          valor: 1500,
        })
      ).rejects.toThrow('Pagamento para esta vaga e medico ja existe')
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

      const pagamento1 = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      const pagamento2 = await service.create({
        vagaId: outraVaga.id,
        medicoId: testMedicoId,
        valor: 1800,
      })

      expect(pagamento1.vagaId).not.toBe(pagamento2.vagaId)
      expect(pagamento1.medicoId).toBe(pagamento2.medicoId)
    })
  })

  describe('findAll', () => {
    it('should return empty list when no pagamentos exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of pagamentos', async () => {
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
          valor: 1500 + i * 100,
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
        valor: 1500,
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
        valor: 1800,
      })

      const result = await service.findAll({ medicoId: testMedicoId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].medicoId).toBe(testMedicoId)
    })

    it('should filter by status', async () => {
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })
      await service.autorizar(pagamento.id)

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
        medicoId: testMedicoId,
        valor: 1800,
      })

      const result = await service.findAll({ status: 'autorizado' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('autorizado')
    })
  })

  describe('findOne', () => {
    it('should return a pagamento by id', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.valor).toBe(1500)
    })

    it('should throw NotFoundException when pagamento does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Pagamento nao encontrado')
    })
  })

  describe('autorizar', () => {
    it('should authorize a pending pagamento', async () => {
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      const result = await service.autorizar(pagamento.id)

      expect(result.status).toBe('autorizado')
      expect(result.dataAutorizacao).toBeDefined()
      expect(result.dataAutorizacao).toBeInstanceOf(Date)
    })

    it('should throw NotFoundException when pagamento does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.autorizar(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for invalid status transition', async () => {
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })
      await service.autorizar(pagamento.id)
      await service.pagar(pagamento.id)

      await expect(service.autorizar(pagamento.id)).rejects.toThrow(BadRequestException)
      await expect(service.autorizar(pagamento.id)).rejects.toThrow(
        'Transicao de status invalida: pago -> autorizado'
      )
    })
  })

  describe('pagar', () => {
    it('should pay an authorized pagamento', async () => {
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })
      await service.autorizar(pagamento.id)

      const result = await service.pagar(pagamento.id)

      expect(result.status).toBe('pago')
      expect(result.dataPagamento).toBeDefined()
      expect(result.dataPagamento).toBeInstanceOf(Date)
    })

    it('should throw NotFoundException when pagamento does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.pagar(nonExistentId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when pagamento is pending', async () => {
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      await expect(service.pagar(pagamento.id)).rejects.toThrow(BadRequestException)
      await expect(service.pagar(pagamento.id)).rejects.toThrow(
        'Transicao de status invalida: pendente -> pago'
      )
    })
  })

  describe('bulkAutorizar', () => {
    it('should authorize multiple pagamentos', async () => {
      const ids: string[] = []
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
        const pagamento = await service.create({
          vagaId: vaga.id,
          medicoId: testMedicoId,
          valor: 1500,
        })
        ids.push(pagamento.id)
      }

      const result = await service.bulkAutorizar(ids)

      expect(result.success).toBe(3)
      expect(result.failed).toEqual([])
    })

    it('should handle partial failures', async () => {
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })
      await service.autorizar(pagamento.id)
      await service.pagar(pagamento.id)

      const outraVaga = await vagasService.create({
        data: '2025-01-16',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      })
      const outroPagamento = await service.create({
        vagaId: outraVaga.id,
        medicoId: testMedicoId,
        valor: 1800,
      })

      const result = await service.bulkAutorizar([pagamento.id, outroPagamento.id])

      expect(result.success).toBe(1)
      expect(result.failed).toContain(pagamento.id)
    })
  })

  describe('bulkPagar', () => {
    it('should pay multiple authorized pagamentos', async () => {
      const ids: string[] = []
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
        const pagamento = await service.create({
          vagaId: vaga.id,
          medicoId: testMedicoId,
          valor: 1500,
        })
        await service.autorizar(pagamento.id)
        ids.push(pagamento.id)
      }

      const result = await service.bulkPagar(ids)

      expect(result.success).toBe(3)
      expect(result.failed).toEqual([])
    })
  })

  describe('sumByMedico', () => {
    it('should sum all pagamentos for a medico', async () => {
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
          valor: 1000 * i,
        })
      }

      const sum = await service.sumByMedico(testMedicoId)

      expect(sum).toBe(6000) // 1000 + 2000 + 3000
    })

    it('should return 0 when medico has no pagamentos', async () => {
      const sum = await service.sumByMedico(testMedicoId)

      expect(sum).toBe(0)
    })
  })

  describe('sumByPeriod', () => {
    it('should sum pagamentos within a period', async () => {
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
          valor: 1000 * i,
        })
      }

      const dataInicio = new Date('2025-01-01')
      const dataFim = new Date('2025-01-31')

      const sum = await service.sumByPeriod(dataInicio, dataFim)

      expect(sum).toBe(6000)
    })
  })

  describe('update', () => {
    it('should update a pagamento', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      const result = await service.update(created.id, {
        observacoes: 'Observacoes atualizadas',
      })

      expect(result.observacoes).toBe('Observacoes atualizadas')
    })

    it('should throw NotFoundException when updating non-existent pagamento', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(
        service.update(nonExistentId, { observacoes: 'Teste' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete a pagamento', async () => {
      const created = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent pagamento', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })

  describe('complete payment flow', () => {
    it('should complete full payment flow: pendente -> autorizado -> pago', async () => {
      // Create pagamento
      const pagamento = await service.create({
        vagaId: testVagaId,
        medicoId: testMedicoId,
        valor: 1500,
        observacoes: 'Plantao de emergencia',
      })
      expect(pagamento.status).toBe('pendente')
      expect(pagamento.dataAutorizacao).toBeNull()
      expect(pagamento.dataPagamento).toBeNull()

      // Authorize
      const autorizado = await service.autorizar(pagamento.id)
      expect(autorizado.status).toBe('autorizado')
      expect(autorizado.dataAutorizacao).toBeDefined()
      expect(autorizado.dataPagamento).toBeNull()

      // Pay
      const pago = await service.pagar(pagamento.id)
      expect(pago.status).toBe('pago')
      expect(pago.dataAutorizacao).toBeDefined()
      expect(pago.dataPagamento).toBeDefined()
      expect(pago.dataPagamento!.getTime()).toBeGreaterThanOrEqual(
        pago.dataAutorizacao!.getTime()
      )
    })
  })
})
