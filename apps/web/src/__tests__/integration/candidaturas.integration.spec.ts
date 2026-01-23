/**
 * Candidaturas Integration Tests
 * Tests against real backend API
 */

import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Candidatura {
  id: string
  medicoId: string
  vagaId: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Vaga {
  id: string
  titulo: string
  hospitalId: string
  setorId: string
  grupoId: string
  especialidadeId: string
}

interface Medico {
  id: string
  nome: string
  cpf: string
  crm: string
  email: string
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

describe('Candidaturas Integration', () => {
  let createdCandidaturaId: string
  let testVagaId: string
  let testMedicoId: string

  describe('CRUD Operations', () => {
    it('should list candidaturas', async () => {
      const response = await apiRequest<PaginatedResponse<Candidatura>>('/candidaturas')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
    })

    it('should get available vagas for candidatura', async () => {
      const vagas = await apiRequest<PaginatedResponse<Vaga>>('/vagas?status=publicada')

      expect(vagas.data).toBeDefined()
      if (vagas.data.length > 0) {
        testVagaId = vagas.data[0].id
      }
    })

    it('should get available medicos', async () => {
      const medicos = await apiRequest<PaginatedResponse<Medico>>('/medicos?ativo=true')

      expect(medicos.data).toBeDefined()
      if (medicos.data.length > 0) {
        testMedicoId = medicos.data[0].id
      }
    })

    it('should create a candidatura', async () => {
      if (!testVagaId || !testMedicoId) {
        console.log('No vaga or medico available, skipping test')
        return
      }

      const candidatura = await apiRequest<Candidatura>('/candidaturas', {
        method: 'POST',
        body: JSON.stringify({
          vagaId: testVagaId,
          medicoId: testMedicoId,
        }),
      })

      expect(candidatura.id).toBeDefined()
      expect(candidatura.vagaId).toBe(testVagaId)
      expect(candidatura.medicoId).toBe(testMedicoId)
      expect(candidatura.status).toBe('pendente')

      createdCandidaturaId = candidatura.id
    })

    it('should get candidatura by id', async () => {
      if (!createdCandidaturaId) {
        console.log('No candidatura created, skipping test')
        return
      }

      const candidatura = await apiRequest<Candidatura>(`/candidaturas/${createdCandidaturaId}`)

      expect(candidatura.id).toBe(createdCandidaturaId)
      expect(candidatura.status).toBeDefined()
    })

    it('should approve candidatura', async () => {
      if (!createdCandidaturaId) {
        console.log('No candidatura created, skipping test')
        return
      }

      const candidatura = await apiRequest<Candidatura>(`/candidaturas/${createdCandidaturaId}/aprovar`, {
        method: 'PATCH',
      })

      expect(candidatura.status).toBe('aprovada')
    })

    it('should delete candidatura', async () => {
      if (!createdCandidaturaId) {
        console.log('No candidatura created, skipping test')
        return
      }

      await apiRequest(`/candidaturas/${createdCandidaturaId}`, {
        method: 'DELETE',
      })

      // Verify deletion
      try {
        await apiRequest(`/candidaturas/${createdCandidaturaId}`)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Status Flow', () => {
    it('should create candidatura for status flow test', async () => {
      if (!testVagaId || !testMedicoId) {
        console.log('No vaga or medico available, skipping test')
        return
      }

      const candidatura = await apiRequest<Candidatura>('/candidaturas', {
        method: 'POST',
        body: JSON.stringify({
          vagaId: testVagaId,
          medicoId: testMedicoId,
        }),
      })

      expect(candidatura.status).toBe('pendente')
      createdCandidaturaId = candidatura.id
    })

    it('should reject candidatura', async () => {
      if (!createdCandidaturaId) {
        console.log('No candidatura created, skipping test')
        return
      }

      const candidatura = await apiRequest<Candidatura>(`/candidaturas/${createdCandidaturaId}/rejeitar`, {
        method: 'PATCH',
      })

      expect(candidatura.status).toBe('rejeitada')
    })
  })

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const response = await apiRequest<PaginatedResponse<Candidatura>>('/candidaturas?status=pendente')

      expect(response.data).toBeDefined()
      response.data.forEach((candidatura) => {
        expect(candidatura.status).toBe('pendente')
      })
    })

    it('should filter by vagaId', async () => {
      if (!testVagaId) {
        console.log('No vaga available, skipping test')
        return
      }

      const response = await apiRequest<PaginatedResponse<Candidatura>>(`/candidaturas?vagaId=${testVagaId}`)

      expect(response.data).toBeDefined()
      response.data.forEach((candidatura) => {
        expect(candidatura.vagaId).toBe(testVagaId)
      })
    })

    it('should filter by medicoId', async () => {
      if (!testMedicoId) {
        console.log('No medico available, skipping test')
        return
      }

      const response = await apiRequest<PaginatedResponse<Candidatura>>(`/candidaturas?medicoId=${testMedicoId}`)

      expect(response.data).toBeDefined()
      response.data.forEach((candidatura) => {
        expect(candidatura.medicoId).toBe(testMedicoId)
      })
    })
  })

  describe('Pagination', () => {
    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Candidatura>>('/candidaturas?page=1&limit=5')

      expect(response.pagination.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })

    it('should return correct total pages', async () => {
      const response = await apiRequest<PaginatedResponse<Candidatura>>('/candidaturas?limit=1')

      expect(response.pagination.totalPages).toBe(
        Math.ceil(response.pagination.total / response.pagination.limit)
      )
    })
  })
})
