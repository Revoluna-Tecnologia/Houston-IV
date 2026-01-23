import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { MedicosService } from '../medicos.service'
import { MedicosRepository } from '../medicos.repository'
import { EspecialidadesService } from '../../especialidades/especialidades.service'
import { EspecialidadesRepository } from '../../especialidades/especialidades.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('MedicosService (Integration)', () => {
  let module: TestingModule
  let service: MedicosService
  let prisma: PrismaService
  let especialidadesService: EspecialidadesService

  // Test data IDs
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
        MedicosService,
        MedicosRepository,
        EspecialidadesService,
        EspecialidadesRepository,
      ],
    }).compile()

    service = module.get<MedicosService>(MedicosService)
    prisma = module.get<PrismaService>(PrismaService)
    especialidadesService = module.get<EspecialidadesService>(EspecialidadesService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up tables in correct order (FK dependencies)
    await prisma.medico.deleteMany()
    await prisma.especialidade.deleteMany()

    // Create test dependency
    const especialidade = await especialidadesService.create({
      nome: 'Cardiologia',
    })
    testEspecialidadeId = especialidade.id
  })

  describe('create', () => {
    it('should create a new medico', async () => {
      const dto = {
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        cpf: '12345678901',
        email: 'joao@exemplo.com',
        telefone: '11999999999',
        especialidadeId: testEspecialidadeId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.nome).toBe(dto.nome)
      expect(result.crm).toBe(dto.crm)
      expect(result.crmUf).toBe(dto.crmUf)
      expect(result.cpf).toBe(dto.cpf)
      expect(result.email).toBe(dto.email)
      expect(result.ativo).toBe(true)
      expect(result.especialidadeId).toBe(testEspecialidadeId)
    })

    it('should throw ConflictException when medico with same CRM and UF exists', async () => {
      const dto = {
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      }

      await service.create(dto)

      const dto2 = {
        nome: 'Dra. Maria Santos',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      }

      await expect(service.create(dto2)).rejects.toThrow(ConflictException)
      await expect(service.create(dto2)).rejects.toThrow('Medico com este CRM e UF ja existe')
    })

    it('should allow same CRM in different UFs', async () => {
      const dto1 = {
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      }

      const dto2 = {
        nome: 'Dra. Maria Santos',
        crm: '123456',
        crmUf: 'RJ',
        especialidadeId: testEspecialidadeId,
      }

      const medico1 = await service.create(dto1)
      const medico2 = await service.create(dto2)

      expect(medico1.crm).toBe('123456')
      expect(medico2.crm).toBe('123456')
      expect(medico1.crmUf).toBe('SP')
      expect(medico2.crmUf).toBe('RJ')
    })

    it('should throw ConflictException when medico with same CPF exists', async () => {
      await service.create({
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        cpf: '12345678901',
        especialidadeId: testEspecialidadeId,
      })

      await expect(
        service.create({
          nome: 'Dra. Maria Santos',
          crm: '654321',
          crmUf: 'SP',
          cpf: '12345678901',
          especialidadeId: testEspecialidadeId,
        })
      ).rejects.toThrow('Medico com este CPF ja existe')
    })

    it('should throw ConflictException when medico with same email exists', async () => {
      await service.create({
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        email: 'joao@exemplo.com',
        especialidadeId: testEspecialidadeId,
      })

      await expect(
        service.create({
          nome: 'Dra. Maria Santos',
          crm: '654321',
          crmUf: 'SP',
          email: 'joao@exemplo.com',
          especialidadeId: testEspecialidadeId,
        })
      ).rejects.toThrow('Medico com este email ja existe')
    })

    it('should create medico with only required fields', async () => {
      const dto = {
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      }

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(result.cpf).toBeNull()
      expect(result.email).toBeNull()
      expect(result.telefone).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty list when no medicos exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of medicos', async () => {
      for (let i = 1; i <= 3; i++) {
        await service.create({
          nome: `Dr. Medico ${i}`,
          crm: `${100000 + i}`,
          crmUf: 'SP',
          especialidadeId: testEspecialidadeId,
        })
      }

      const result = await service.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(3)
      expect(result.meta.totalPages).toBe(2)
    })

    it('should filter by especialidadeId', async () => {
      const outraEspecialidade = await especialidadesService.create({
        nome: 'Neurologia',
      })

      await service.create({
        nome: 'Dr. Cardiologista',
        crm: '111111',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        nome: 'Dr. Neurologista',
        crm: '222222',
        crmUf: 'SP',
        especialidadeId: outraEspecialidade.id,
      })

      const result = await service.findAll({ especialidadeId: testEspecialidadeId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].especialidadeId).toBe(testEspecialidadeId)
    })

    it('should filter by ativo status', async () => {
      await service.create({
        nome: 'Dr. Ativo',
        crm: '111111',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      const inativo = await service.create({
        nome: 'Dr. Inativo',
        crm: '222222',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })
      await service.update(inativo.id, { ativo: false })

      const result = await service.findAll({ ativo: true })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Dr. Ativo')
    })

    it('should search by nome', async () => {
      await service.create({
        nome: 'Dr. Joao Silva',
        crm: '111111',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.create({
        nome: 'Dra. Maria Santos',
        crm: '222222',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.findAll({ search: 'Joao' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Dr. Joao Silva')
    })
  })

  describe('findOne', () => {
    it('should return a medico by id', async () => {
      const created = await service.create({
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.nome).toBe('Dr. Joao Silva')
    })

    it('should throw NotFoundException when medico does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Medico nao encontrado')
    })
  })

  describe('update', () => {
    it('should update a medico', async () => {
      const created = await service.create({
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      const result = await service.update(created.id, {
        telefone: '11888888888',
        email: 'joao.novo@exemplo.com',
      })

      expect(result.nome).toBe('Dr. Joao Silva')
      expect(result.telefone).toBe('11888888888')
      expect(result.email).toBe('joao.novo@exemplo.com')
    })

    it('should throw NotFoundException when updating non-existent medico', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.update(nonExistentId, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ConflictException when updating to existing CPF', async () => {
      await service.create({
        nome: 'Dr. Joao Silva',
        crm: '123456',
        crmUf: 'SP',
        cpf: '11111111111',
        especialidadeId: testEspecialidadeId,
      })

      const outro = await service.create({
        nome: 'Dra. Maria Santos',
        crm: '654321',
        crmUf: 'SP',
        cpf: '22222222222',
        especialidadeId: testEspecialidadeId,
      })

      await expect(service.update(outro.id, { cpf: '11111111111' })).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe('remove', () => {
    it('should delete a medico', async () => {
      const created = await service.create({
        nome: 'Dr. Medico a Deletar',
        crm: '123456',
        crmUf: 'SP',
        especialidadeId: testEspecialidadeId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent medico', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
