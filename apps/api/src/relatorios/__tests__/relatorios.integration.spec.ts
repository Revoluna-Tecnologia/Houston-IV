import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { RelatoriosService } from '../relatorios.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('RelatoriosService (Integration)', () => {
  let module: TestingModule
  let service: RelatoriosService
  let prisma: PrismaService

  let testGrupoId: string
  let testHospitalId: string
  let testSetorId: string
  let testMedicoId: string
  let testMedico2Id: string
  let testGradeId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [RelatoriosService],
    }).compile()

    service = module.get<RelatoriosService>(RelatoriosService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up in correct order (respecting foreign keys)
    await prisma.checkinCheckout.deleteMany()
    await prisma.pagamento.deleteMany()
    await prisma.gradeTimeSlot.deleteMany()
    await prisma.grade.deleteMany()
    await prisma.vaga.deleteMany()
    await prisma.medico.deleteMany()
    await prisma.setor.deleteMany()
    await prisma.hospital.deleteMany()
    await prisma.grupo.deleteMany()

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: 'Grupo Teste Relatorios' },
    })
    testGrupoId = grupo.id

    // Create test hospital
    const hospital = await prisma.hospital.create({
      data: {
        nome: 'Hospital Teste',
        grupoId: testGrupoId,
        ativo: true,
      },
    })
    testHospitalId = hospital.id

    // Create test setor
    const setor = await prisma.setor.create({
      data: {
        nome: 'UTI',
        hospitalId: testHospitalId,
        ativo: true,
      },
    })
    testSetorId = setor.id

    // Create test medicos
    const medico = await prisma.medico.create({
      data: {
        nome: 'Dr. João Silva',
        crm: '123456-SP',
        telefone: '5511999998888',
        ativo: true,
      },
    })
    testMedicoId = medico.id

    const medico2 = await prisma.medico.create({
      data: {
        nome: 'Dra. Maria Santos',
        crm: '654321-SP',
        telefone: '5511888887777',
        ativo: true,
      },
    })
    testMedico2Id = medico2.id

    // Create test grade
    const grade = await prisma.grade.create({
      data: {
        nome: 'Grade Janeiro 2024',
        hospitalId: testHospitalId,
        setorId: testSetorId,
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-01-31'),
        status: 'publicada',
      },
    })
    testGradeId = grade.id
  })

  describe('getFolhaPagamento', () => {
    it('should return empty array when no payments exist', async () => {
      const result = await service.getFolhaPagamento({})

      expect(result).toEqual([])
    })

    it('should return folha pagamento grouped by medico', async () => {
      // Create vagas
      const vaga1 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'confirmada',
        },
      })

      const vaga2 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-16'),
          horaInicio: '14:00',
          horaFim: '20:00',
          valor: 600,
          status: 'confirmada',
        },
      })

      // Create pagamentos for same medico
      await prisma.pagamento.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga1.id,
          valor: 500,
          status: 'pago',
        },
      })

      await prisma.pagamento.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga2.id,
          valor: 600,
          status: 'pendente',
        },
      })

      const result = await service.getFolhaPagamento({})

      expect(result).toHaveLength(1)
      expect(result[0].medicoId).toBe(testMedicoId)
      expect(result[0].medicoNome).toBe('Dr. João Silva')
      expect(result[0].totalVagas).toBe(2)
      expect(result[0].valorTotal).toBe(1100)
      expect(result[0].pagamentos).toHaveLength(2)
    })

    it('should return multiple medicos when they have payments', async () => {
      const vaga1 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'confirmada',
        },
      })

      const vaga2 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-16'),
          horaInicio: '14:00',
          horaFim: '20:00',
          valor: 600,
          status: 'confirmada',
        },
      })

      await prisma.pagamento.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga1.id,
          valor: 500,
          status: 'pago',
        },
      })

      await prisma.pagamento.create({
        data: {
          medicoId: testMedico2Id,
          vagaId: vaga2.id,
          valor: 600,
          status: 'pago',
        },
      })

      const result = await service.getFolhaPagamento({})

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.medicoNome).sort()).toEqual(['Dr. João Silva', 'Dra. Maria Santos'])
    })

    it('should filter by hospitalId', async () => {
      // Create another hospital
      const hospital2 = await prisma.hospital.create({
        data: {
          nome: 'Hospital 2',
          grupoId: testGrupoId,
          ativo: true,
        },
      })

      const setor2 = await prisma.setor.create({
        data: {
          nome: 'Emergência',
          hospitalId: hospital2.id,
          ativo: true,
        },
      })

      const vaga1 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'confirmada',
        },
      })

      const vaga2 = await prisma.vaga.create({
        data: {
          hospitalId: hospital2.id,
          setorId: setor2.id,
          data: new Date('2024-01-16'),
          horaInicio: '14:00',
          horaFim: '20:00',
          valor: 600,
          status: 'confirmada',
        },
      })

      await prisma.pagamento.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga1.id,
          valor: 500,
          status: 'pago',
        },
      })

      await prisma.pagamento.create({
        data: {
          medicoId: testMedico2Id,
          vagaId: vaga2.id,
          valor: 600,
          status: 'pago',
        },
      })

      const result = await service.getFolhaPagamento({ hospitalId: testHospitalId })

      expect(result).toHaveLength(1)
      expect(result[0].medicoNome).toBe('Dr. João Silva')
    })
  })

  describe('getGrades', () => {
    it('should return empty array when no grades exist', async () => {
      await prisma.grade.deleteMany()

      const result = await service.getGrades({})

      expect(result).toEqual([])
    })

    it('should return grades with slot statistics', async () => {
      // Create time slots for the grade
      await prisma.gradeTimeSlot.createMany({
        data: [
          {
            gradeId: testGradeId,
            data: new Date('2024-01-15'),
            horaInicio: '08:00',
            horaFim: '14:00',
            medicoId: testMedicoId, // Filled
          },
          {
            gradeId: testGradeId,
            data: new Date('2024-01-15'),
            horaInicio: '14:00',
            horaFim: '20:00',
            medicoId: null, // Empty
          },
          {
            gradeId: testGradeId,
            data: new Date('2024-01-16'),
            horaInicio: '08:00',
            horaFim: '14:00',
            medicoId: testMedico2Id, // Filled
          },
        ],
      })

      const result = await service.getGrades({})

      expect(result).toHaveLength(1)
      expect(result[0].gradeId).toBe(testGradeId)
      expect(result[0].gradeNome).toBe('Grade Janeiro 2024')
      expect(result[0].hospital).toBe('Hospital Teste')
      expect(result[0].setor).toBe('UTI')
      expect(result[0].totalSlots).toBe(3)
      expect(result[0].slotsPreenchidos).toBe(2)
      expect(result[0].slotsVazios).toBe(1)
    })

    it('should filter grades by hospitalId', async () => {
      // Create another hospital with grade
      const hospital2 = await prisma.hospital.create({
        data: {
          nome: 'Hospital 2',
          grupoId: testGrupoId,
          ativo: true,
        },
      })

      const setor2 = await prisma.setor.create({
        data: {
          nome: 'Emergência',
          hospitalId: hospital2.id,
          ativo: true,
        },
      })

      await prisma.grade.create({
        data: {
          nome: 'Grade Hospital 2',
          hospitalId: hospital2.id,
          setorId: setor2.id,
          dataInicio: new Date('2024-02-01'),
          dataFim: new Date('2024-02-28'),
          status: 'publicada',
        },
      })

      const result = await service.getGrades({ hospitalId: testHospitalId })

      expect(result).toHaveLength(1)
      expect(result[0].hospital).toBe('Hospital Teste')
    })

    it('should filter grades by setorId', async () => {
      // Create another setor with grade
      const setor2 = await prisma.setor.create({
        data: {
          nome: 'Emergência',
          hospitalId: testHospitalId,
          ativo: true,
        },
      })

      await prisma.grade.create({
        data: {
          nome: 'Grade Emergência',
          hospitalId: testHospitalId,
          setorId: setor2.id,
          dataInicio: new Date('2024-02-01'),
          dataFim: new Date('2024-02-28'),
          status: 'publicada',
        },
      })

      const result = await service.getGrades({ setorId: testSetorId })

      expect(result).toHaveLength(1)
      expect(result[0].setor).toBe('UTI')
    })
  })

  describe('getProdutividade', () => {
    it('should return empty array when no checkins exist', async () => {
      const result = await service.getProdutividade({})

      expect(result).toEqual([])
    })

    it('should return produtividade with presence stats', async () => {
      const vaga1 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'confirmada',
        },
      })

      const vaga2 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-16'),
          horaInicio: '14:00',
          horaFim: '20:00',
          valor: 600,
          status: 'confirmada',
        },
      })

      // Create checkins - one present, one not
      await prisma.checkinCheckout.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga1.id,
          checkinAt: new Date('2024-01-15T08:00:00'),
        },
      })

      await prisma.checkinCheckout.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga2.id,
          checkinAt: null, // Absent
        },
      })

      const result = await service.getProdutividade({})

      expect(result).toHaveLength(1)
      expect(result[0].medicoId).toBe(testMedicoId)
      expect(result[0].medicoNome).toBe('Dr. João Silva')
      expect(result[0].vagasRealizadas).toBe(1)
      expect(result[0].taxaPresenca).toBe(50) // 1/2 = 50%
    })

    it('should calculate 100% presence rate', async () => {
      const vaga = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'confirmada',
        },
      })

      await prisma.checkinCheckout.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga.id,
          checkinAt: new Date('2024-01-15T08:00:00'),
        },
      })

      const result = await service.getProdutividade({})

      expect(result[0].taxaPresenca).toBe(100)
    })

    it('should group produtividade by medico', async () => {
      const vaga1 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'confirmada',
        },
      })

      const vaga2 = await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-16'),
          horaInicio: '14:00',
          horaFim: '20:00',
          valor: 600,
          status: 'confirmada',
        },
      })

      await prisma.checkinCheckout.create({
        data: {
          medicoId: testMedicoId,
          vagaId: vaga1.id,
          checkinAt: new Date('2024-01-15T08:00:00'),
        },
      })

      await prisma.checkinCheckout.create({
        data: {
          medicoId: testMedico2Id,
          vagaId: vaga2.id,
          checkinAt: new Date('2024-01-16T14:00:00'),
        },
      })

      const result = await service.getProdutividade({})

      expect(result).toHaveLength(2)
    })
  })

  describe('getFiltrosDisponiveis', () => {
    it('should return available filters', async () => {
      const result = await service.getFiltrosDisponiveis()

      expect(result.hospitais).toBeDefined()
      expect(result.setores).toBeDefined()
      expect(result.medicos).toBeDefined()
      expect(result.meses).toBeDefined()
    })

    it('should return active hospitais', async () => {
      // Create an inactive hospital
      await prisma.hospital.create({
        data: {
          nome: 'Hospital Inativo',
          grupoId: testGrupoId,
          ativo: false,
        },
      })

      const result = await service.getFiltrosDisponiveis()

      expect(result.hospitais).toHaveLength(1)
      expect(result.hospitais[0].nome).toBe('Hospital Teste')
    })

    it('should return active setores', async () => {
      // Create an inactive setor
      await prisma.setor.create({
        data: {
          nome: 'Setor Inativo',
          hospitalId: testHospitalId,
          ativo: false,
        },
      })

      const result = await service.getFiltrosDisponiveis()

      expect(result.setores).toHaveLength(1)
      expect(result.setores[0].nome).toBe('UTI')
    })

    it('should return active medicos', async () => {
      // Create an inactive medico
      await prisma.medico.create({
        data: {
          nome: 'Dr. Inativo',
          crm: '000000-XX',
          telefone: '5511000000000',
          ativo: false,
        },
      })

      const result = await service.getFiltrosDisponiveis()

      expect(result.medicos).toHaveLength(2) // Only active ones
    })

    it('should return meses from existing vagas', async () => {
      await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-01-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'aberta',
        },
      })

      await prisma.vaga.create({
        data: {
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: new Date('2024-02-15'),
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
          status: 'aberta',
        },
      })

      const result = await service.getFiltrosDisponiveis()

      expect(result.meses).toHaveLength(2)
    })

    it('should return sorted hospitais by name', async () => {
      await prisma.hospital.create({
        data: {
          nome: 'AAAA Hospital',
          grupoId: testGrupoId,
          ativo: true,
        },
      })

      await prisma.hospital.create({
        data: {
          nome: 'ZZZZ Hospital',
          grupoId: testGrupoId,
          ativo: true,
        },
      })

      const result = await service.getFiltrosDisponiveis()

      expect(result.hospitais[0].nome).toBe('AAAA Hospital')
      expect(result.hospitais[result.hospitais.length - 1].nome).toBe('ZZZZ Hospital')
    })
  })
})
