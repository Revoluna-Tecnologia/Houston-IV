import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Grupo {
  id: string
  nome: string
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

describe('Grupos Integration', () => {
  let createdGrupoId: string

  describe('CRUD Operations', () => {
    it('should list grupos', async () => {
      const response = await apiRequest<PaginatedResponse<Grupo>>('/grupos')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should create, read, update and delete grupo', async () => {
      // CREATE
      const timestamp = Date.now()
      const created = await apiRequest<Grupo>('/grupos', {
        method: 'POST',
        body: JSON.stringify({
          nome: `Grupo Integração ${timestamp}`,
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.nome).toBe(`Grupo Integração ${timestamp}`)
      expect(created.ativo).toBe(true)
      createdGrupoId = created.id

      // READ
      const fetched = await apiRequest<Grupo>(`/grupos/${createdGrupoId}`)
      expect(fetched.id).toBe(createdGrupoId)

      // UPDATE
      const updated = await apiRequest<Grupo>(`/grupos/${createdGrupoId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: `Grupo Atualizado ${timestamp}` }),
      })
      expect(updated.nome).toBe(`Grupo Atualizado ${timestamp}`)

      // DELETE
      await apiRequest(`/grupos/${createdGrupoId}`, { method: 'DELETE' })
    })
  })

  describe('Activate/Deactivate', () => {
    it('should deactivate and reactivate grupo', async () => {
      const timestamp = Date.now()
      const grupo = await apiRequest<Grupo>('/grupos', {
        method: 'POST',
        body: JSON.stringify({ nome: `Grupo AD ${timestamp}` }),
      })

      // Deactivate
      const deactivated = await apiRequest<Grupo>(`/grupos/${grupo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      expect(deactivated.ativo).toBe(false)

      // Reactivate
      const reactivated = await apiRequest<Grupo>(`/grupos/${grupo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: true }),
      })
      expect(reactivated.ativo).toBe(true)

      // Cleanup
      await apiRequest(`/grupos/${grupo.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should search by nome', async () => {
      const response = await apiRequest<PaginatedResponse<Grupo>>('/grupos?search=grupo')

      expect(response.data).toBeDefined()
    })

    it('should filter by ativo status', async () => {
      const response = await apiRequest<PaginatedResponse<Grupo>>('/grupos?ativo=true')

      response.data.forEach((grupo) => {
        expect(grupo.ativo).toBe(true)
      })
    })
  })
})
