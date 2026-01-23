import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Hospital {
  id: string
  nome: string
  cidade: string
  estado: string
  grupoId: string
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

describe('Hospitais Integration', () => {
  let createdHospitalId: string

  describe('CRUD Operations', () => {
    it('should list hospitais', async () => {
      const response = await apiRequest<PaginatedResponse<Hospital>>('/hospitais')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
    })

    it('should create a hospital', async () => {
      // First, get a grupo to associate
      const grupos = await apiRequest<PaginatedResponse<{ id: string }>>('/grupos')

      if (grupos.data.length === 0) {
        console.log('No grupos available, skipping test')
        return
      }

      const hospital = await apiRequest<Hospital>('/hospitais', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Hospital Integracao Teste',
          cidade: 'Sao Paulo',
          estado: 'SP',
          grupoId: grupos.data[0].id,
        }),
      })

      expect(hospital.id).toBeDefined()
      expect(hospital.nome).toBe('Hospital Integracao Teste')
      expect(hospital.cidade).toBe('Sao Paulo')
      expect(hospital.estado).toBe('SP')

      createdHospitalId = hospital.id
    })

    it('should get hospital by id', async () => {
      if (!createdHospitalId) {
        console.log('No hospital created, skipping test')
        return
      }

      const hospital = await apiRequest<Hospital>(`/hospitais/${createdHospitalId}`)

      expect(hospital.id).toBe(createdHospitalId)
      expect(hospital.nome).toBe('Hospital Integracao Teste')
    })

    it('should update hospital', async () => {
      if (!createdHospitalId) {
        console.log('No hospital created, skipping test')
        return
      }

      const hospital = await apiRequest<Hospital>(`/hospitais/${createdHospitalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: 'Hospital Integracao Atualizado',
        }),
      })

      expect(hospital.nome).toBe('Hospital Integracao Atualizado')
    })

    it('should delete hospital', async () => {
      if (!createdHospitalId) {
        console.log('No hospital created, skipping test')
        return
      }

      await apiRequest(`/hospitais/${createdHospitalId}`, {
        method: 'DELETE',
      })

      // Verify deletion
      try {
        await apiRequest(`/hospitais/${createdHospitalId}`)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Pagination', () => {
    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Hospital>>('/hospitais?page=1&limit=5')

      expect(response.pagination.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Filtering', () => {
    it('should filter by search term', async () => {
      const response = await apiRequest<PaginatedResponse<Hospital>>('/hospitais?search=hospital')

      expect(response.data).toBeDefined()
      // All results should contain 'hospital' in nome
      response.data.forEach((hospital) => {
        expect(hospital.nome.toLowerCase()).toContain('hospital')
      })
    })
  })
})
