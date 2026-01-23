import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Vaga {
  id: string
  data: string
  horaInicio: string
  horaFim: string
  valor: number
  status: string
  hospitalId: string
  setorId: string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

describe('Vagas Integration', () => {
  let createdVagaId: string
  let testHospitalId: string
  let testSetorId: string

  describe('CRUD Operations', () => {
    it('should list vagas', async () => {
      const response = await apiRequest<PaginatedResponse<Vaga>>('/vagas')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete vaga', async () => {
      // Get hospital and setor for creating vaga
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      if (hospitais.data.length === 0) {
        console.log('No hospitais available, skipping test')
        return
      }
      testHospitalId = hospitais.data[0].id

      const setores = await apiRequest<PaginatedResponse<{ id: string }>>(
        `/setores?hospitalId=${testHospitalId}`
      )
      if (setores.data.length === 0) {
        console.log('No setores available, skipping test')
        return
      }
      testSetorId = setores.data[0].id

      // CREATE
      const created = await apiRequest<Vaga>('/vagas', {
        method: 'POST',
        body: JSON.stringify({
          hospitalId: testHospitalId,
          setorId: testSetorId,
          data: '2024-12-20',
          horaInicio: '08:00',
          horaFim: '14:00',
          valor: 500,
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.status).toBe('aberta')
      createdVagaId = created.id

      // READ
      const fetched = await apiRequest<Vaga>(`/vagas/${createdVagaId}`)
      expect(fetched.id).toBe(createdVagaId)

      // UPDATE
      const updated = await apiRequest<Vaga>(`/vagas/${createdVagaId}`, {
        method: 'PUT',
        body: JSON.stringify({ valor: 600 }),
      })
      expect(updated.valor).toBe(600)

      // DELETE
      await apiRequest(`/vagas/${createdVagaId}`, { method: 'DELETE' })
    })
  })

  describe('Status Transitions', () => {
    it('should transition vaga status', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      const setores = await apiRequest<PaginatedResponse<{ id: string }>>(
        `/setores?hospitalId=${hospitais.data[0]?.id}`
      )

      if (!hospitais.data[0] || !setores.data[0]) {
        console.log('No data available, skipping test')
        return
      }

      const vaga = await apiRequest<Vaga>('/vagas', {
        method: 'POST',
        body: JSON.stringify({
          hospitalId: hospitais.data[0].id,
          setorId: setores.data[0].id,
          data: '2024-12-21',
          horaInicio: '14:00',
          horaFim: '20:00',
          valor: 500,
        }),
      })

      // Transition to anunciada
      const anunciada = await apiRequest<Vaga>(`/vagas/${vaga.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'anunciada' }),
      })
      expect(anunciada.status).toBe('anunciada')

      // Cleanup
      await apiRequest(`/vagas/${vaga.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const response = await apiRequest<PaginatedResponse<Vaga>>('/vagas?status=aberta')

      response.data.forEach((vaga) => {
        expect(vaga.status).toBe('aberta')
      })
    })

    it('should filter by hospitalId', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')

      if (hospitais.data.length > 0) {
        const response = await apiRequest<PaginatedResponse<Vaga>>(
          `/vagas?hospitalId=${hospitais.data[0].id}`
        )

        response.data.forEach((vaga) => {
          expect(vaga.hospitalId).toBe(hospitais.data[0].id)
        })
      }
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Vaga>>('/vagas?page=1&limit=5')

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
