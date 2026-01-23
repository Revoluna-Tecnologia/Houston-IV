import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HospitaisService } from '../hospitais-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('HospitaisService', () => {
  let service: HospitaisService

  const mockHospital = {
    id: 'hospital-1',
    nome: 'Hospital Teste',
    cidade: 'Sao Paulo',
    estado: 'SP',
    grupoId: 'grupo-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockHospital],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new HospitaisService()
  })

  describe('getAll', () => {
    it('should fetch all hospitais', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/hospitais', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch hospitais with pagination params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { page: 2, limit: 20 }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/hospitais', params)
    })

    it('should fetch hospitais with filter params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { search: 'hospital', grupoId: 'grupo-1' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/hospitais', params)
    })
  })

  describe('getById', () => {
    it('should fetch hospital by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockHospital)

      const result = await service.getById('hospital-1')

      expect(apiClient.get).toHaveBeenCalledWith('/hospitais/hospital-1')
      expect(result).toEqual(mockHospital)
    })
  })

  describe('create', () => {
    it('should create a new hospital', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockHospital)

      const createData = {
        nome: 'Hospital Novo',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        grupoId: 'grupo-1',
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/hospitais', createData)
      expect(result).toEqual(mockHospital)
    })
  })

  describe('update', () => {
    it('should update hospital', async () => {
      const updatedHospital = { ...mockHospital, nome: 'Hospital Atualizado' }
      vi.mocked(apiClient.put).mockResolvedValue(updatedHospital)

      const updateData = { nome: 'Hospital Atualizado' }
      const result = await service.update('hospital-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/hospitais/hospital-1', updateData)
      expect(result).toEqual(updatedHospital)
    })
  })

  describe('delete', () => {
    it('should delete hospital', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('hospital-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/hospitais/hospital-1')
    })
  })
})
