import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { SetoresService } from '../setores.service'
import { SetoresRepository } from '../setores.repository'
import { HospitaisService } from '../../hospitais/hospitais.service'
import { HospitaisRepository } from '../../hospitais/hospitais.repository'
import { GruposService } from '../../grupos/grupos.service'
import { GruposRepository } from '../../grupos/grupos.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

describe('SetoresService (Integration)', () => {
  let module: TestingModule
  let service: SetoresService
  let prisma: PrismaService
  let hospitaisService: HospitaisService
  let gruposService: GruposService

  // Test data IDs
  let testGrupoId: string
  let testHospitalId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [
        SetoresService,
        SetoresRepository,
        HospitaisService,
        HospitaisRepository,
        GruposService,
        GruposRepository,
      ],
    }).compile()

    service = module.get<SetoresService>(SetoresService)
    prisma = module.get<PrismaService>(PrismaService)
    hospitaisService = module.get<HospitaisService>(HospitaisService)
    gruposService = module.get<GruposService>(GruposService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up tables in correct order (FK dependencies)
    await prisma.setor.deleteMany()
    await prisma.hospital.deleteMany()
    await prisma.grupo.deleteMany()

    // Create test dependencies
    const grupo = await gruposService.create({ nome: 'Grupo de Teste' })
    testGrupoId = grupo.id

    const hospital = await hospitaisService.create({
      nome: 'Hospital de Teste',
      grupoId: testGrupoId,
    })
    testHospitalId = hospital.id
  })

  describe('create', () => {
    it('should create a new setor', async () => {
      const dto = {
        nome: 'UTI',
        descricao: 'Unidade de Terapia Intensiva',
        hospitalId: testHospitalId,
      }

      const result = await service.create(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.nome).toBe(dto.nome)
      expect(result.descricao).toBe(dto.descricao)
      expect(result.ativo).toBe(true)
      expect(result.hospitalId).toBe(testHospitalId)
    })

    it('should throw ConflictException when setor with same name exists in same hospital', async () => {
      const dto = {
        nome: 'Emergencia',
        hospitalId: testHospitalId,
      }

      await service.create(dto)

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
      await expect(service.create(dto)).rejects.toThrow(
        'Setor com este nome ja existe neste hospital'
      )
    })

    it('should allow same setor name in different hospitals', async () => {
      // Create another hospital
      const outroHospital = await hospitaisService.create({
        nome: 'Outro Hospital',
        grupoId: testGrupoId,
      })

      const dto1 = {
        nome: 'Emergencia',
        hospitalId: testHospitalId,
      }

      const dto2 = {
        nome: 'Emergencia',
        hospitalId: outroHospital.id,
      }

      const setor1 = await service.create(dto1)
      const setor2 = await service.create(dto2)

      expect(setor1.nome).toBe('Emergencia')
      expect(setor2.nome).toBe('Emergencia')
      expect(setor1.hospitalId).not.toBe(setor2.hospitalId)
    })

    it('should create setor with only nome and hospitalId', async () => {
      const dto = {
        nome: 'Radiologia',
        hospitalId: testHospitalId,
      }

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(result.descricao).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty list when no setores exist', async () => {
      const result = await service.findAll({})

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should return paginated list of setores', async () => {
      await service.create({ nome: 'UTI', hospitalId: testHospitalId })
      await service.create({ nome: 'Emergencia', hospitalId: testHospitalId })
      await service.create({ nome: 'Centro Cirurgico', hospitalId: testHospitalId })

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

      await service.create({ nome: 'UTI', hospitalId: testHospitalId })
      await service.create({ nome: 'UTI Outro', hospitalId: outroHospital.id })

      const result = await service.findAll({ hospitalId: testHospitalId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].hospitalId).toBe(testHospitalId)
    })

    it('should filter by ativo status', async () => {
      await service.create({ nome: 'Ativo', hospitalId: testHospitalId })
      const inativo = await service.create({ nome: 'Inativo', hospitalId: testHospitalId })
      await service.update(inativo.id, { ativo: false })

      const result = await service.findAll({ ativo: true })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('Ativo')
    })

    it('should search by nome', async () => {
      await service.create({ nome: 'UTI Adulto', hospitalId: testHospitalId })
      await service.create({ nome: 'Emergencia', hospitalId: testHospitalId })

      const result = await service.findAll({ search: 'UTI' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].nome).toBe('UTI Adulto')
    })
  })

  describe('findOne', () => {
    it('should return a setor by id', async () => {
      const created = await service.create({
        nome: 'Cardiologia',
        hospitalId: testHospitalId,
      })

      const result = await service.findOne(created.id)

      expect(result.id).toBe(created.id)
      expect(result.nome).toBe('Cardiologia')
    })

    it('should throw NotFoundException when setor does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(nonExistentId)).rejects.toThrow('Setor nao encontrado')
    })
  })

  describe('update', () => {
    it('should update a setor', async () => {
      const created = await service.create({
        nome: 'Pediatria',
        hospitalId: testHospitalId,
      })

      const result = await service.update(created.id, {
        descricao: 'Setor de Pediatria',
      })

      expect(result.nome).toBe('Pediatria')
      expect(result.descricao).toBe('Setor de Pediatria')
    })

    it('should throw NotFoundException when updating non-existent setor', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.update(nonExistentId, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ConflictException when updating to existing name in same hospital', async () => {
      await service.create({ nome: 'UTI', hospitalId: testHospitalId })
      const outro = await service.create({ nome: 'Emergencia', hospitalId: testHospitalId })

      await expect(service.update(outro.id, { nome: 'UTI' })).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe('remove', () => {
    it('should delete a setor', async () => {
      const created = await service.create({
        nome: 'Setor a Deletar',
        hospitalId: testHospitalId,
      })

      await service.remove(created.id)

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when deleting non-existent setor', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(service.remove(nonExistentId)).rejects.toThrow(NotFoundException)
    })
  })
})
