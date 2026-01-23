import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Setor {
  id: string
  nome: string
  descricao?: string
  hospitalId: string
  ativo: boolean
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

describe('Setores Integration', () => {
  let createdSetorId: string
  let testHospitalId: string

  describe('CRUD Operations', () => {
    it('should list setores', async () => {
      const response = await apiRequest<PaginatedResponse<Setor>>('/setores')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete setor', async () => {
      // Get hospital for creating setor
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      if (hospitais.data.length === 0) {
        console.log('No hospitais available, skipping test')
        return
      }
      testHospitalId = hospitais.data[0].id

      // CREATE
      const timestamp = Date.now()
      const created = await apiRequest<Setor>('/setores', {
        method: 'POST',
        body: JSON.stringify({
          nome: `Setor ${timestamp}`,
          descricao: 'Descrição do setor de teste',
          hospitalId: testHospitalId,
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.nome).toBe(`Setor ${timestamp}`)
      expect(created.descricao).toBe('Descrição do setor de teste')
      expect(created.hospitalId).toBe(testHospitalId)
      expect(created.ativo).toBe(true)
      createdSetorId = created.id

      // READ
      const fetched = await apiRequest<Setor>(`/setores/${createdSetorId}`)
      expect(fetched.id).toBe(createdSetorId)

      // UPDATE
      const updated = await apiRequest<Setor>(`/setores/${createdSetorId}`, {
        method: 'PUT',
        body: JSON.stringify({ descricao: 'Descrição atualizada' }),
      })
      expect(updated.descricao).toBe('Descrição atualizada')

      // DELETE
      await apiRequest(`/setores/${createdSetorId}`, { method: 'DELETE' })
    })

    it('should create setor with only nome and hospitalId', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      if (hospitais.data.length === 0) {
        console.log('No hospitais available, skipping test')
        return
      }

      const timestamp = Date.now()
      const created = await apiRequest<Setor>('/setores', {
        method: 'POST',
        body: JSON.stringify({
          nome: `Radiologia ${timestamp}`,
          hospitalId: hospitais.data[0].id,
        }),
      })

      expect(created.nome).toBe(`Radiologia ${timestamp}`)
      expect(created.descricao).toBeNull()

      // Cleanup
      await apiRequest(`/setores/${created.id}`, { method: 'DELETE' })
    })
  })

  describe('Activate/Deactivate', () => {
    it('should deactivate and reactivate setor', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      if (hospitais.data.length === 0) {
        console.log('No hospitais available, skipping test')
        return
      }

      const timestamp = Date.now()
      const setor = await apiRequest<Setor>('/setores', {
        method: 'POST',
        body: JSON.stringify({
          nome: `AD Setor ${timestamp}`,
          hospitalId: hospitais.data[0].id,
        }),
      })

      // Deactivate
      const deactivated = await apiRequest<Setor>(`/setores/${setor.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      expect(deactivated.ativo).toBe(false)

      // Reactivate
      const reactivated = await apiRequest<Setor>(`/setores/${setor.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: true }),
      })
      expect(reactivated.ativo).toBe(true)

      // Cleanup
      await apiRequest(`/setores/${setor.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should filter by hospitalId', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')

      if (hospitais.data.length > 0) {
        const response = await apiRequest<PaginatedResponse<Setor>>(
          `/setores?hospitalId=${hospitais.data[0].id}`
        )

        response.data.forEach((setor) => {
          expect(setor.hospitalId).toBe(hospitais.data[0].id)
        })
      }
    })

    it('should search by nome', async () => {
      const response = await apiRequest<PaginatedResponse<Setor>>('/setores?search=UTI')

      response.data.forEach((setor) => {
        expect(setor.nome.toLowerCase()).toContain('uti')
      })
    })

    it('should filter by ativo status', async () => {
      const response = await apiRequest<PaginatedResponse<Setor>>('/setores?ativo=true')

      response.data.forEach((setor) => {
        expect(setor.ativo).toBe(true)
      })
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Setor>>('/setores?page=1&limit=5')

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
