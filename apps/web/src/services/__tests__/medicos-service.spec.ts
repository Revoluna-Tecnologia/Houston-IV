import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MedicosService } from '../medicos-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('MedicosService', () => {
  let service: MedicosService

  const mockMedico = {
    id: 'medico-1',
    nome: 'Dr. Teste',
    crm: '123456',
    ufCrm: 'SP',
    telefone: '11999999999',
    email: 'dr.teste@email.com',
    grupoId: 'grupo-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockMedico],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MedicosService()
  })

  describe('getAll', () => {
    it('should fetch all medicos', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/medicos', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch medicos with search params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { search: 'Dr.', especialidadeId: 'esp-1' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/medicos', params)
    })
  })

  describe('getById', () => {
    it('should fetch medico by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockMedico)

      const result = await service.getById('medico-1')

      expect(apiClient.get).toHaveBeenCalledWith('/medicos/medico-1')
      expect(result).toEqual(mockMedico)
    })
  })

  describe('create', () => {
    it('should create a new medico', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockMedico)

      const createData = {
        nome: 'Dr. Novo',
        crm: '654321',
        ufCrm: 'RJ',
        telefone: '21999999999',
        grupoId: 'grupo-1',
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/medicos', createData)
      expect(result).toEqual(mockMedico)
    })
  })

  describe('update', () => {
    it('should update medico', async () => {
      const updatedMedico = { ...mockMedico, telefone: '11888888888' }
      vi.mocked(apiClient.put).mockResolvedValue(updatedMedico)

      const updateData = { telefone: '11888888888' }
      const result = await service.update('medico-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/medicos/medico-1', updateData)
      expect(result).toEqual(updatedMedico)
    })
  })

  describe('delete', () => {
    it('should delete medico', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('medico-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/medicos/medico-1')
    })
  })
})
