import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Especialidade {
  id: string
  nome: string
  sigla?: string
  cor?: string
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

describe('Especialidades Integration', () => {
  let createdEspecialidadeId: string

  describe('CRUD Operations', () => {
    it('should list especialidades', async () => {
      const response = await apiRequest<PaginatedResponse<Especialidade>>('/especialidades')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete especialidade', async () => {
      // CREATE
      const timestamp = Date.now()
      const created = await apiRequest<Especialidade>('/especialidades', {
        method: 'POST',
        body: JSON.stringify({
          nome: `Especialidade ${timestamp}`,
          sigla: 'ESP',
          cor: '#FF0000',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.nome).toBe(`Especialidade ${timestamp}`)
      expect(created.sigla).toBe('ESP')
      expect(created.cor).toBe('#FF0000')
      expect(created.ativo).toBe(true)
      createdEspecialidadeId = created.id

      // READ
      const fetched = await apiRequest<Especialidade>(
        `/especialidades/${createdEspecialidadeId}`
      )
      expect(fetched.id).toBe(createdEspecialidadeId)

      // UPDATE
      const updated = await apiRequest<Especialidade>(
        `/especialidades/${createdEspecialidadeId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            sigla: 'ESPA',
            cor: '#00FF00',
          }),
        }
      )
      expect(updated.sigla).toBe('ESPA')
      expect(updated.cor).toBe('#00FF00')

      // DELETE
      await apiRequest(`/especialidades/${createdEspecialidadeId}`, { method: 'DELETE' })
    })

    it('should create especialidade with only nome', async () => {
      const timestamp = Date.now()
      const created = await apiRequest<Especialidade>('/especialidades', {
        method: 'POST',
        body: JSON.stringify({
          nome: `Neurologia ${timestamp}`,
        }),
      })

      expect(created.nome).toBe(`Neurologia ${timestamp}`)
      expect(created.sigla).toBeNull()
      expect(created.cor).toBeNull()

      // Cleanup
      await apiRequest(`/especialidades/${created.id}`, { method: 'DELETE' })
    })
  })

  describe('Activate/Deactivate', () => {
    it('should deactivate and reactivate especialidade', async () => {
      const timestamp = Date.now()
      const especialidade = await apiRequest<Especialidade>('/especialidades', {
        method: 'POST',
        body: JSON.stringify({
          nome: `Ativar Desativar ${timestamp}`,
        }),
      })

      // Deactivate
      const deactivated = await apiRequest<Especialidade>(
        `/especialidades/${especialidade.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ ativo: false }),
        }
      )
      expect(deactivated.ativo).toBe(false)

      // Reactivate
      const reactivated = await apiRequest<Especialidade>(
        `/especialidades/${especialidade.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ ativo: true }),
        }
      )
      expect(reactivated.ativo).toBe(true)

      // Cleanup
      await apiRequest(`/especialidades/${especialidade.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should search by nome', async () => {
      const response = await apiRequest<PaginatedResponse<Especialidade>>(
        '/especialidades?search=cardio'
      )

      response.data.forEach((especialidade) => {
        expect(especialidade.nome.toLowerCase()).toContain('cardio')
      })
    })

    it('should filter by ativo status', async () => {
      const response = await apiRequest<PaginatedResponse<Especialidade>>(
        '/especialidades?ativo=true'
      )

      response.data.forEach((especialidade) => {
        expect(especialidade.ativo).toBe(true)
      })
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Especialidade>>(
        '/especialidades?page=1&limit=5'
      )

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
