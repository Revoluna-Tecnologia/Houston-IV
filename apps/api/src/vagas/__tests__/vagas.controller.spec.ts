import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VagasController } from '../vagas.controller'
import { createVagaFixture, createVagaListFixture } from '../../__tests__/fixtures'
import { mockSession } from '../../__tests__/mocks'

describe('VagasController', () => {
  let controller: VagasController

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  }

  beforeEach(() => {
    controller = new VagasController(mockService as never)
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
      mockService.create.mockResolvedValue(vaga)

      const result = await controller.create(dto, mockSession as never)

      expect(result).toEqual(vaga)
      expect(mockService.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return paginated vagas', async () => {
      const vagas = createVagaListFixture(3)
      const response = {
        data: vagas,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      }
      mockService.findAll.mockResolvedValue(response)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(response)
    })
  })

  describe('findOne', () => {
    it('should return vaga by id', async () => {
      const vaga = createVagaFixture({ id: 'test-id' })
      mockService.findOne.mockResolvedValue(vaga)

      const result = await controller.findOne('test-id')

      expect(result).toEqual(vaga)
      expect(mockService.findOne).toHaveBeenCalledWith('test-id')
    })
  })

  describe('update', () => {
    it('should update vaga', async () => {
      const vaga = createVagaFixture({ id: 'test-id', horaInicio: '10:00' })
      mockService.update.mockResolvedValue(vaga)

      const result = await controller.update('test-id', { horaInicio: '10:00' }, mockSession as never)

      expect(result).toEqual(vaga)
      expect(mockService.update).toHaveBeenCalledWith('test-id', { horaInicio: '10:00' })
    })
  })

  describe('updateStatus', () => {
    it('should update vaga status', async () => {
      const vaga = createVagaFixture({ id: 'test-id', status: 'anunciada' })
      mockService.updateStatus.mockResolvedValue(vaga)

      const result = await controller.updateStatus('test-id', { status: 'anunciada' } as never, mockSession as never)

      expect(result).toEqual(vaga)
      expect(mockService.updateStatus).toHaveBeenCalledWith('test-id', 'anunciada')
    })
  })

  describe('remove', () => {
    it('should remove vaga', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove('test-id', mockSession as never)

      expect(mockService.remove).toHaveBeenCalledWith('test-id')
    })
  })
})
