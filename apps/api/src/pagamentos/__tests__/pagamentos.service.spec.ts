import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'

vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>()
  return {
    ...actual,
    PagamentoStatus: { pendente: 'pendente', autorizado: 'autorizado', pago: 'pago', cancelado: 'cancelado' },
  }
})

import { PagamentosService } from '../pagamentos.service'
import {
  createPagamentoFixture,
  createPagamentoListFixture,
  createAutorizadoPagamentoFixture,
  createPagoPagamentoFixture,
  createCanceladoPagamentoFixture,
} from '../../__tests__/fixtures'

describe('PagamentosService', () => {
  let service: PagamentosService

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByVagaAndMedico: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    sumByMedico: vi.fn(),
    sumByPeriod: vi.fn(),
  }

  beforeEach(() => {
    service = new PagamentosService(mockRepository as never)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new pagamento', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id', valor: 1500 }
      const pagamento = createPagamentoFixture({ vagaId: dto.vagaId, medicoId: dto.medicoId })
      mockRepository.findByVagaAndMedico.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(pagamento)

      const result = await service.create(dto)

      expect(result.vagaId).toBe(dto.vagaId)
      expect(result.medicoId).toBe(dto.medicoId)
      expect(mockRepository.create).toHaveBeenCalledWith(dto)
    })

    it('should throw ConflictException when pagamento already exists', async () => {
      const dto = { vagaId: 'vaga-id', medicoId: 'medico-id', valor: 1500 }
      mockRepository.findByVagaAndMedico.mockResolvedValue(createPagamentoFixture())

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('findAll', () => {
    it('should return paginated pagamentos', async () => {
      const pagamentos = createPagamentoListFixture(3)
      mockRepository.findAll.mockResolvedValue({
        data: pagamentos,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return pagamento by id', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)

      const result = await service.findOne('test-id')

      expect(result.id).toBe('test-id')
    })

    it('should throw NotFoundException when pagamento not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update pagamento', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue({ ...pagamento, observacoes: 'Updated' })

      const result = await service.update('test-id', { observacoes: 'Updated' })

      expect(result.observacoes).toBe('Updated')
    })

    it('should throw NotFoundException when pagamento not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException)
    })

    it('should validate status transition on update', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id', status: 'pendente' })
      mockRepository.findById.mockResolvedValue(pagamento)

      await expect(
        service.update('test-id', { status: 'pago' })
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('remove', () => {
    it('should remove pagamento', async () => {
      mockRepository.findById.mockResolvedValue(createPagamentoFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('id')

      expect(mockRepository.delete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException when pagamento not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('autorizar', () => {
    it('should autorizar a pendente pagamento', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id', status: 'pendente' })
      const autorizadoPagamento = createAutorizadoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(autorizadoPagamento)

      const result = await service.autorizar('test-id')

      expect(result.status).toBe('autorizado')
      expect(mockRepository.update).toHaveBeenCalledWith('test-id', expect.objectContaining({
        status: 'autorizado',
        dataAutorizacao: expect.any(Date),
      }))
    })

    it('should throw NotFoundException when pagamento not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.autorizar('invalid-id')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for invalid transition', async () => {
      const pagamento = createPagoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)

      await expect(service.autorizar('test-id')).rejects.toThrow(BadRequestException)
    })
  })

  describe('pagar', () => {
    it('should pagar an autorizado pagamento', async () => {
      const pagamento = createAutorizadoPagamentoFixture({ id: 'test-id' })
      const pagoPagamento = createPagoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(pagoPagamento)

      const result = await service.pagar('test-id')

      expect(result.status).toBe('pago')
      expect(mockRepository.update).toHaveBeenCalledWith('test-id', expect.objectContaining({
        status: 'pago',
        dataPagamento: expect.any(Date),
      }))
    })

    it('should throw NotFoundException when pagamento not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.pagar('invalid-id')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for invalid transition from pendente', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id', status: 'pendente' })
      mockRepository.findById.mockResolvedValue(pagamento)

      await expect(service.pagar('test-id')).rejects.toThrow(BadRequestException)
    })
  })

  describe('bulkAutorizar', () => {
    it('should autorizar multiple pagamentos', async () => {
      const pagamentos = [
        createPagamentoFixture({ id: 'id1', status: 'pendente' }),
        createPagamentoFixture({ id: 'id2', status: 'pendente' }),
      ]
      mockRepository.findById
        .mockResolvedValueOnce(pagamentos[0])
        .mockResolvedValueOnce(pagamentos[1])
      mockRepository.update
        .mockResolvedValueOnce(createAutorizadoPagamentoFixture({ id: 'id1' }))
        .mockResolvedValueOnce(createAutorizadoPagamentoFixture({ id: 'id2' }))

      const result = await service.bulkAutorizar(['id1', 'id2'])

      expect(result.success).toBe(2)
      expect(result.failed).toHaveLength(0)
    })

    it('should return failed ids for invalid pagamentos', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(createPagamentoFixture({ id: 'id1', status: 'pendente' }))
        .mockResolvedValueOnce(null)
      mockRepository.update.mockResolvedValueOnce(createAutorizadoPagamentoFixture({ id: 'id1' }))

      const result = await service.bulkAutorizar(['id1', 'id2'])

      expect(result.success).toBe(1)
      expect(result.failed).toEqual(['id2'])
    })
  })

  describe('bulkPagar', () => {
    it('should pagar multiple pagamentos', async () => {
      const pagamentos = [
        createAutorizadoPagamentoFixture({ id: 'id1' }),
        createAutorizadoPagamentoFixture({ id: 'id2' }),
      ]
      mockRepository.findById
        .mockResolvedValueOnce(pagamentos[0])
        .mockResolvedValueOnce(pagamentos[1])
      mockRepository.update
        .mockResolvedValueOnce(createPagoPagamentoFixture({ id: 'id1' }))
        .mockResolvedValueOnce(createPagoPagamentoFixture({ id: 'id2' }))

      const result = await service.bulkPagar(['id1', 'id2'])

      expect(result.success).toBe(2)
      expect(result.failed).toHaveLength(0)
    })

    it('should return failed ids for pagamentos with invalid status', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(createAutorizadoPagamentoFixture({ id: 'id1' }))
        .mockResolvedValueOnce(createPagamentoFixture({ id: 'id2', status: 'pendente' }))
      mockRepository.update.mockResolvedValueOnce(createPagoPagamentoFixture({ id: 'id1' }))

      const result = await service.bulkPagar(['id1', 'id2'])

      expect(result.success).toBe(1)
      expect(result.failed).toEqual(['id2'])
    })
  })

  describe('state machine transitions', () => {
    it('should allow pendente -> autorizado', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id', status: 'pendente' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(createAutorizadoPagamentoFixture({ id: 'test-id' }))

      await expect(service.autorizar('test-id')).resolves.toBeDefined()
    })

    it('should allow autorizado -> pago', async () => {
      const pagamento = createAutorizadoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(createPagoPagamentoFixture({ id: 'test-id' }))

      await expect(service.pagar('test-id')).resolves.toBeDefined()
    })

    it('should allow pendente -> cancelado', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id', status: 'pendente' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(createCanceladoPagamentoFixture({ id: 'test-id' }))

      await expect(service.update('test-id', { status: 'cancelado' })).resolves.toBeDefined()
    })

    it('should allow autorizado -> cancelado', async () => {
      const pagamento = createAutorizadoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(createCanceladoPagamentoFixture({ id: 'test-id' }))

      await expect(service.update('test-id', { status: 'cancelado' })).resolves.toBeDefined()
    })

    it('should allow pago -> cancelado', async () => {
      const pagamento = createPagoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)
      mockRepository.update.mockResolvedValue(createCanceladoPagamentoFixture({ id: 'test-id' }))

      await expect(service.update('test-id', { status: 'cancelado' })).resolves.toBeDefined()
    })

    it('should not allow cancelado -> any other status', async () => {
      const pagamento = createCanceladoPagamentoFixture({ id: 'test-id' })
      mockRepository.findById.mockResolvedValue(pagamento)

      await expect(service.update('test-id', { status: 'pendente' })).rejects.toThrow(BadRequestException)
      await expect(service.update('test-id', { status: 'autorizado' })).rejects.toThrow(BadRequestException)
      await expect(service.update('test-id', { status: 'pago' })).rejects.toThrow(BadRequestException)
    })

    it('should not allow pendente -> pago directly', async () => {
      const pagamento = createPagamentoFixture({ id: 'test-id', status: 'pendente' })
      mockRepository.findById.mockResolvedValue(pagamento)

      await expect(service.update('test-id', { status: 'pago' })).rejects.toThrow(BadRequestException)
    })
  })

  describe('sumByMedico', () => {
    it('should return sum of valores by medicoId', async () => {
      mockRepository.sumByMedico.mockResolvedValue(4500)

      const result = await service.sumByMedico('medico-id')

      expect(result).toBe(4500)
      expect(mockRepository.sumByMedico).toHaveBeenCalledWith('medico-id')
    })
  })

  describe('sumByPeriod', () => {
    it('should return sum of valores by period', async () => {
      const dataInicio = new Date('2024-01-01')
      const dataFim = new Date('2024-12-31')
      mockRepository.sumByPeriod.mockResolvedValue(10000)

      const result = await service.sumByPeriod(dataInicio, dataFim)

      expect(result).toBe(10000)
      expect(mockRepository.sumByPeriod).toHaveBeenCalledWith(dataInicio, dataFim)
    })
  })
})
