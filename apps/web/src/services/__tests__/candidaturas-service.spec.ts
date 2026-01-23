import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CandidaturasService } from '../candidaturas-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('CandidaturasService', () => {
  let service: CandidaturasService

  const mockCandidatura = {
    id: 'candidatura-1',
    medicoId: 'medico-1',
    vagaId: 'vaga-1',
    status: 'pendente',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockCandidatura],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CandidaturasService()
  })

  describe('getAll', () => {
    it('should fetch all candidaturas', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/candidaturas', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch candidaturas with filter params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { vagaId: 'vaga-1', status: 'pendente' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/candidaturas', params)
    })
  })

  describe('getById', () => {
    it('should fetch candidatura by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCandidatura)

      const result = await service.getById('candidatura-1')

      expect(apiClient.get).toHaveBeenCalledWith('/candidaturas/candidatura-1')
      expect(result).toEqual(mockCandidatura)
    })
  })

  describe('create', () => {
    it('should create a new candidatura', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockCandidatura)

      const createData = {
        medicoId: 'medico-1',
        vagaId: 'vaga-1',
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/candidaturas', createData)
      expect(result).toEqual(mockCandidatura)
    })
  })

  describe('aprovar', () => {
    it('should approve candidatura', async () => {
      const approvedCandidatura = { ...mockCandidatura, status: 'aprovada' }
      vi.mocked(apiClient.patch).mockResolvedValue(approvedCandidatura)

      const result = await service.aprovar('candidatura-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/candidaturas/candidatura-1/aprovar')
      expect(result).toEqual(approvedCandidatura)
    })
  })

  describe('rejeitar', () => {
    it('should reject candidatura', async () => {
      const rejectedCandidatura = { ...mockCandidatura, status: 'rejeitada' }
      vi.mocked(apiClient.patch).mockResolvedValue(rejectedCandidatura)

      const result = await service.rejeitar('candidatura-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/candidaturas/candidatura-1/rejeitar')
      expect(result).toEqual(rejectedCandidatura)
    })
  })

  describe('delete', () => {
    it('should delete candidatura', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('candidatura-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/candidaturas/candidatura-1')
    })
  })
})
