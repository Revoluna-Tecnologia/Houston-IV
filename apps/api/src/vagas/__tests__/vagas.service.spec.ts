import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { VagasService } from '../vagas.service'
import { createVagaFixture, createVagaListFixture } from '../../__tests__/fixtures'

describe('VagasService', () => {
  let service: VagasService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findConflicting: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    service = new VagasService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new vaga', async () => {
      const dto = {
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: 'hospital-id',
        setorId: 'setor-id',
        especialidadeId: 'especialidade-id',
      }
      const vaga = createVagaFixture({
        data: new Date(dto.data),
        horaInicio: dto.horaInicio,
        horaFim: dto.horaFim,
        valor: dto.valor,
        hospitalId: dto.hospitalId,
        setorId: dto.setorId,
        especialidadeId: dto.especialidadeId,
      })
      mockRepository.findConflicting.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(vaga)

      const result = await service.create(dto)

      expect(result.horaInicio).toBe(dto.horaInicio)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when time conflict exists', async () => {
      const dto = {
        data: '2025-01-15',
        horaInicio: '08:00',
        horaFim: '12:00',
        valor: 1500,
        hospitalId: 'hospital-id',
        setorId: 'setor-id',
        especialidadeId: 'especialidade-id',
      }
      mockRepository.findConflicting.mockResolvedValue(createVagaFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated vagas', async () => {
      const vagas = createVagaListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: vagas,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return vaga by id', async () => {
      const vaga = createVagaFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(vaga)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when vaga not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update vaga', async () => {
      const vaga = createVagaFixture({ id: 'test-id', horaInicio: '10:00' })
      mockRepository.findById.mockResolvedValue(vaga)
      mockRepository.findConflicting.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue(vaga)

      const result = await service.update('test-id', { horaInicio: '10:00' })

      expect(result.horaInicio).toBe('10:00')
    })

    it('should throw NotFoundException when vaga not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when time conflict exists', async () => {
      const vaga = createVagaFixture()
      mockRepository.findById.mockResolvedValue(vaga)
      mockRepository.findConflicting.mockResolvedValue(createVagaFixture())

      await expect(service.update('id', { horaInicio: '09:00' })).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe('updateStatus', () => {
    it('should update status with valid transition', async () => {
      const vaga = createVagaFixture({ status: 'aberta' })
      const updated = createVagaFixture({ status: 'anunciada' })
      mockRepository.findById.mockResolvedValue(vaga)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.updateStatus('id', 'anunciada')

      expect(result.status).toBe('anunciada')
    })

    it('should throw BadRequestException for invalid transition from aberta to aberta', async () => {
      const vaga = createVagaFixture({ status: 'aberta' })
      mockRepository.findById.mockResolvedValue(vaga)

      await expect(service.updateStatus('id', 'aberta')).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for invalid transition from fechada', async () => {
      const vaga = createVagaFixture({ status: 'fechada' })
      mockRepository.findById.mockResolvedValue(vaga)

      await expect(service.updateStatus('id', 'aberta')).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for invalid transition from cancelada', async () => {
      const vaga = createVagaFixture({ status: 'cancelada' })
      mockRepository.findById.mockResolvedValue(vaga)

      await expect(service.updateStatus('id', 'aberta')).rejects.toThrow(BadRequestException)
    })

    it('should allow transition from aberta to fechada', async () => {
      const vaga = createVagaFixture({ status: 'aberta' })
      const updated = createVagaFixture({ status: 'fechada' })
      mockRepository.findById.mockResolvedValue(vaga)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.updateStatus('id', 'fechada')

      expect(result.status).toBe('fechada')
    })

    it('should allow transition from aberta to cancelada', async () => {
      const vaga = createVagaFixture({ status: 'aberta' })
      const updated = createVagaFixture({ status: 'cancelada' })
      mockRepository.findById.mockResolvedValue(vaga)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.updateStatus('id', 'cancelada')

      expect(result.status).toBe('cancelada')
    })

    it('should allow transition from anunciada to fechada', async () => {
      const vaga = createVagaFixture({ status: 'anunciada' })
      const updated = createVagaFixture({ status: 'fechada' })
      mockRepository.findById.mockResolvedValue(vaga)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.updateStatus('id', 'fechada')

      expect(result.status).toBe('fechada')
    })
  })

  describe('remove', () => {
    it('should remove vaga', async () => {
      mockRepository.findById.mockResolvedValue(createVagaFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when vaga not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })
})
