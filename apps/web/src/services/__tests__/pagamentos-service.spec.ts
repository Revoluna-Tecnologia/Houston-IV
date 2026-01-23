import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PagamentosService } from '../pagamentos-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('PagamentosService', () => {
  let service: PagamentosService

  const mockPagamento = {
    id: 'pagamento-1',
    escalistaId: 'escalista-1',
    vagaId: 'vaga-1',
    valor: 500.0,
    status: 'pendente',
    dataPagamento: null,
    comprovante: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockPagamento],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  const mockBulkResult = {
    success: 3,
    failed: 0,
    errors: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PagamentosService()
  })

  describe('getAll', () => {
    it('should fetch all pagamentos', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/pagamentos', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch pagamentos with filter params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { escalistaId: 'escalista-1', status: 'pendente' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/pagamentos', params)
    })

    it('should handle date range filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/pagamentos', params)
    })
  })

  describe('getById', () => {
    it('should fetch pagamento by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPagamento)

      const result = await service.getById('pagamento-1')

      expect(apiClient.get).toHaveBeenCalledWith('/pagamentos/pagamento-1')
      expect(result).toEqual(mockPagamento)
    })
  })

  describe('create', () => {
    it('should create a new pagamento', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPagamento)

      const createData = {
        escalistaId: 'escalista-1',
        vagaId: 'vaga-1',
        valor: 500.0,
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/pagamentos', createData)
      expect(result).toEqual(mockPagamento)
    })
  })

  describe('update', () => {
    it('should update a pagamento', async () => {
      const updatedPagamento = { ...mockPagamento, valor: 600.0 }
      vi.mocked(apiClient.put).mockResolvedValue(updatedPagamento)

      const updateData = { valor: 600.0 }
      const result = await service.update('pagamento-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/pagamentos/pagamento-1', updateData)
      expect(result).toEqual(updatedPagamento)
    })
  })

  describe('delete', () => {
    it('should delete a pagamento', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('pagamento-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/pagamentos/pagamento-1')
    })
  })

  describe('autorizar', () => {
    it('should authorize a pagamento', async () => {
      const authorizedPagamento = { ...mockPagamento, status: 'autorizado' }
      vi.mocked(apiClient.patch).mockResolvedValue(authorizedPagamento)

      const result = await service.autorizar('pagamento-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/pagamentos/pagamento-1/autorizar')
      expect(result).toEqual(authorizedPagamento)
      expect(result.status).toBe('autorizado')
    })
  })

  describe('pagar', () => {
    it('should mark pagamento as paid', async () => {
      const paidPagamento = {
        ...mockPagamento,
        status: 'pago',
        dataPagamento: new Date().toISOString(),
      }
      vi.mocked(apiClient.patch).mockResolvedValue(paidPagamento)

      const result = await service.pagar('pagamento-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/pagamentos/pagamento-1/pagar')
      expect(result).toEqual(paidPagamento)
      expect(result.status).toBe('pago')
    })
  })

  describe('bulkAutorizar', () => {
    it('should authorize multiple pagamentos', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue(mockBulkResult)

      const ids = ['pagamento-1', 'pagamento-2', 'pagamento-3']
      const result = await service.bulkAutorizar(ids)

      expect(apiClient.patch).toHaveBeenCalledWith('/pagamentos/bulk/autorizar', { ids })
      expect(result).toEqual(mockBulkResult)
      expect(result.success).toBe(3)
    })

    it('should handle partial failures', async () => {
      const partialResult = {
        success: 2,
        failed: 1,
        errors: [{ id: 'pagamento-3', message: 'Pagamento já autorizado' }],
      }
      vi.mocked(apiClient.patch).mockResolvedValue(partialResult)

      const ids = ['pagamento-1', 'pagamento-2', 'pagamento-3']
      const result = await service.bulkAutorizar(ids)

      expect(result.success).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('should handle empty ids array', async () => {
      const emptyResult = { success: 0, failed: 0, errors: [] }
      vi.mocked(apiClient.patch).mockResolvedValue(emptyResult)

      const result = await service.bulkAutorizar([])

      expect(apiClient.patch).toHaveBeenCalledWith('/pagamentos/bulk/autorizar', { ids: [] })
      expect(result.success).toBe(0)
    })
  })

  describe('bulkPagar', () => {
    it('should pay multiple pagamentos', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue(mockBulkResult)

      const ids = ['pagamento-1', 'pagamento-2', 'pagamento-3']
      const result = await service.bulkPagar(ids)

      expect(apiClient.patch).toHaveBeenCalledWith('/pagamentos/bulk/pagar', { ids })
      expect(result).toEqual(mockBulkResult)
    })

    it('should handle all failures', async () => {
      const failResult = {
        success: 0,
        failed: 2,
        errors: [
          { id: 'pagamento-1', message: 'Pagamento não autorizado' },
          { id: 'pagamento-2', message: 'Pagamento não autorizado' },
        ],
      }
      vi.mocked(apiClient.patch).mockResolvedValue(failResult)

      const ids = ['pagamento-1', 'pagamento-2']
      const result = await service.bulkPagar(ids)

      expect(result.success).toBe(0)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
    })
  })
})
