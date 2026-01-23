import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EscalistasService } from '../escalistas-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('EscalistasService', () => {
  let service: EscalistasService

  const mockEscalista = {
    id: 'escalista-1',
    medicoId: 'medico-1',
    grupoId: 'grupo-1',
    status: 'pendente',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockEscalista],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new EscalistasService()
  })

  describe('getAll', () => {
    it('should fetch all escalistas', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/escalistas', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch escalistas with filter params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { grupoId: 'grupo-1', status: 'ativo' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/escalistas', params)
    })
  })

  describe('getById', () => {
    it('should fetch escalista by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEscalista)

      const result = await service.getById('escalista-1')

      expect(apiClient.get).toHaveBeenCalledWith('/escalistas/escalista-1')
      expect(result).toEqual(mockEscalista)
    })
  })

  describe('create', () => {
    it('should create a new escalista', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockEscalista)

      const createData = {
        medicoId: 'medico-1',
        grupoId: 'grupo-1',
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/escalistas', createData)
      expect(result).toEqual(mockEscalista)
    })
  })

  describe('update', () => {
    it('should update escalista', async () => {
      const updatedEscalista = { ...mockEscalista, status: 'ativo' }
      vi.mocked(apiClient.put).mockResolvedValue(updatedEscalista)

      const updateData = { status: 'ativo' as const }
      const result = await service.update('escalista-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/escalistas/escalista-1', updateData)
      expect(result).toEqual(updatedEscalista)
    })
  })

  describe('delete', () => {
    it('should delete escalista', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('escalista-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/escalistas/escalista-1')
    })
  })

  describe('ativar', () => {
    it('should activate escalista', async () => {
      const activeEscalista = { ...mockEscalista, status: 'ativo' }
      vi.mocked(apiClient.post).mockResolvedValue(activeEscalista)

      const result = await service.ativar('escalista-1')

      expect(apiClient.post).toHaveBeenCalledWith('/escalistas/escalista-1/ativar')
      expect(result).toEqual(activeEscalista)
    })
  })

  describe('inativar', () => {
    it('should deactivate escalista', async () => {
      const inactiveEscalista = { ...mockEscalista, status: 'inativo' }
      vi.mocked(apiClient.post).mockResolvedValue(inactiveEscalista)

      const result = await service.inativar('escalista-1')

      expect(apiClient.post).toHaveBeenCalledWith('/escalistas/escalista-1/inativar')
      expect(result).toEqual(inactiveEscalista)
    })
  })

  describe('bulkAtivar', () => {
    it('should bulk activate escalistas', async () => {
      const bulkResult = { success: 3, failed: 0 }
      vi.mocked(apiClient.post).mockResolvedValue(bulkResult)

      const ids = ['escalista-1', 'escalista-2', 'escalista-3']
      const result = await service.bulkAtivar(ids)

      expect(apiClient.post).toHaveBeenCalledWith('/escalistas/bulk/ativar', { ids })
      expect(result).toEqual(bulkResult)
    })
  })

  describe('bulkInativar', () => {
    it('should bulk deactivate escalistas', async () => {
      const bulkResult = { success: 2, failed: 1 }
      vi.mocked(apiClient.post).mockResolvedValue(bulkResult)

      const ids = ['escalista-1', 'escalista-2', 'escalista-3']
      const result = await service.bulkInativar(ids)

      expect(apiClient.post).toHaveBeenCalledWith('/escalistas/bulk/inativar', { ids })
      expect(result).toEqual(bulkResult)
    })
  })
})
