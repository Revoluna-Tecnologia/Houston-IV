import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { GradesService } from '../grades.service'
import { createGradeFixture, createTimeSlotFixture } from '../../__tests__/fixtures'

describe('GradesService', () => {
  let service: GradesService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByHospitalAndSetor: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addTimeSlots: vi.fn(),
    getTimeSlots: vi.fn(),
  }

  const mockVagasRepository = {
    create: vi.fn(),
  }

  beforeEach(() => {
    service = new GradesService(mockRepository as never, mockVagasRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new grade', async () => {
      const dto = {
        nome: 'Grade Janeiro',
        descricao: 'Descricao',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
        hospitalId: 'hospital-id',
        setorId: 'setor-id',
      }
      const grade = createGradeFixture(dto)
      mockRepository.create.mockResolvedValue(grade)

      const result = await service.create(dto)

      expect(result.nome).toBe(dto.nome)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw BadRequestException when dataInicio is after dataFim', async () => {
      const dto = {
        nome: 'Grade',
        dataInicio: '2025-01-31',
        dataFim: '2025-01-01',
        hospitalId: 'hospital-id',
        setorId: 'setor-id',
      }

      await expect(service.create(dto)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when dataInicio equals dataFim', async () => {
      const dto = {
        nome: 'Grade',
        dataInicio: '2025-01-15',
        dataFim: '2025-01-15',
        hospitalId: 'hospital-id',
        setorId: 'setor-id',
      }

      await expect(service.create(dto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAll', () => {
    it('should return paginated grades', async () => {
      const grades = [createGradeFixture(), createGradeFixture()]
      mockRepository.findAll.mockResolvedValue({
        data: grades,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(2)
    })
  })

  describe('findOne', () => {
    it('should return grade by id', async () => {
      const grade = createGradeFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(grade)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when grade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update grade', async () => {
      const grade = createGradeFixture({ id: 'test-id', nome: 'Updated' })
      mockRepository.findById.mockResolvedValue(grade)
      mockRepository.update.mockResolvedValue(grade)

      const result = await service.update('test-id', { nome: 'Updated' })

      expect(result.nome).toBe('Updated')
    })

    it('should throw NotFoundException when grade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should validate date range when updating dates', async () => {
      const grade = createGradeFixture({
        dataInicio: new Date('2025-01-01'),
        dataFim: new Date('2025-01-31'),
      })
      mockRepository.findById.mockResolvedValue(grade)

      await expect(
        service.update('id', { dataInicio: '2025-02-01', dataFim: '2025-01-15' })
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('remove', () => {
    it('should remove grade', async () => {
      mockRepository.findById.mockResolvedValue(createGradeFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when grade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('addTimeSlots', () => {
    it('should add time slots to grade', async () => {
      const grade = createGradeFixture()
      const timeSlots = [
        { data: '2025-01-15', horaInicio: '08:00', horaFim: '12:00' },
      ]
      const createdSlots = [createTimeSlotFixture()]
      mockRepository.findById.mockResolvedValue(grade)
      mockRepository.addTimeSlots.mockResolvedValue(createdSlots)

      const result = await service.addTimeSlots('grade-id', timeSlots)

      expect(result).toHaveLength(1)
      expect(mockRepository.addTimeSlots).toHaveBeenCalledWith('grade-id', timeSlots)
    })

    it('should throw NotFoundException when grade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        service.addTimeSlots('invalid-id', [])
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('publish', () => {
    it('should publish grade', async () => {
      const grade = createGradeFixture({ status: 'rascunho' })
      const publishedGrade = { ...grade, status: 'publicada' }
      mockRepository.findById.mockResolvedValue(grade)
      mockRepository.update.mockResolvedValue(publishedGrade)

      const result = await service.publish('grade-id')

      expect(result.status).toBe('publicada')
      expect(mockRepository.update).toHaveBeenCalledWith('grade-id', { status: 'publicada' })
    })

    it('should throw NotFoundException when grade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.publish('invalid-id')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when grade is not in rascunho status', async () => {
      const grade = createGradeFixture({ status: 'publicada' })
      mockRepository.findById.mockResolvedValue(grade)

      await expect(service.publish('grade-id')).rejects.toThrow(BadRequestException)
    })
  })

  describe('generateVagas', () => {
    it('should generate vagas from time slots', async () => {
      const grade = createGradeFixture({
        status: 'publicada',
        hospitalId: 'hospital-id',
        setorId: 'setor-id',
      })
      const timeSlots = [
        createTimeSlotFixture({ data: new Date('2025-01-15'), horaInicio: '08:00', horaFim: '12:00' }),
        createTimeSlotFixture({ data: new Date('2025-01-16'), horaInicio: '14:00', horaFim: '18:00' }),
      ]
      mockRepository.findById.mockResolvedValue(grade)
      mockRepository.getTimeSlots.mockResolvedValue(timeSlots)
      mockVagasRepository.create.mockResolvedValue({})

      const count = await service.generateVagas('grade-id', 'especialidade-id', 1500)

      expect(count).toBe(2)
      expect(mockVagasRepository.create).toHaveBeenCalledTimes(2)
    })

    it('should throw NotFoundException when grade not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        service.generateVagas('invalid-id', 'especialidade-id', 1500)
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when grade is not published', async () => {
      const grade = createGradeFixture({ status: 'rascunho' })
      mockRepository.findById.mockResolvedValue(grade)

      await expect(
        service.generateVagas('grade-id', 'especialidade-id', 1500)
      ).rejects.toThrow(BadRequestException)
    })
  })
})
