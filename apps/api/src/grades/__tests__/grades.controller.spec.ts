import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GradesController } from '../grades.controller'
import { createGradeFixture, createTimeSlotFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('GradesController', () => {
  let controller: GradesController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    addTimeSlots: vi.fn(),
    publish: vi.fn(),
    generateVagas: vi.fn(),
  }

  beforeEach(() => {
    controller = new GradesController(mockService as never)
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
      mockService.create.mockResolvedValue(grade)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(grade)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated grades', async () => {
      const grades = [createGradeFixture(), createGradeFixture()]
      const response = {
        data: grades,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return grade by id', async () => {
      const grade = createGradeFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(grade)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(grade)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update grade', async () => {
      const grade = createGradeFixture({ id: 'test-id', nome: 'Updated' })
      mockService.update.mockResolvedValue(grade)

      const result = await controller.update('test-id', { nome: 'Updated' }, mockSession as never)

      expect(result).toEqual(grade)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { nome: 'Updated' })
    })
  })

  describe('remove', () => {
    it('should remove grade', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })

  describe('addTimeSlots', () => {
    it('should add time slots to grade', async () => {
      const timeSlots = [
        { data: '2025-01-15', horaInicio: '08:00', horaFim: '12:00' },
      ]
      const createdSlots = [createTimeSlotFixture()]
      mockService.addTimeSlots.mockResolvedValue(createdSlots)

      const result = await controller.addTimeSlots('grade-id', { timeSlots }, mockSession as never)

      expect(result).toEqual(createdSlots)
      expect(mockService.addTimeSlots).toHaveBeenCalledWith('grade-id', timeSlots)
    })
  })

  describe('publish', () => {
    it('should publish grade', async () => {
      const grade = createGradeFixture({ status: 'publicada' })
      mockService.publish.mockResolvedValue(grade)

      const result = await controller.publish('grade-id', mockSession as never)

      expect(result).toEqual(grade)
      expect(mockService.publish).toHaveBeenCalledWith('grade-id')
    })
  })

  describe('generateVagas', () => {
    it('should generate vagas from grade', async () => {
      mockService.generateVagas.mockResolvedValue(5)

      const result = await controller.generateVagas('grade-id', {
        especialidadeId: 'especialidade-id',
        valor: 1500,
      }, mockSession as never)

      expect(result).toBe(5)
      expect(mockService.generateVagas).toHaveBeenCalledWith('grade-id', 'especialidade-id', 1500)
    })
  })
})
