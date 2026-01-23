import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Escalista {
  id: string
  nome: string
  email: string
  role: string
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

describe('Escalistas Integration', () => {
  let createdEscalistaId: string

  describe('CRUD Operations', () => {
    it('should list escalistas', async () => {
      const response = await apiRequest<PaginatedResponse<Escalista>>('/escalistas')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete escalista', async () => {
      // CREATE
      const timestamp = Date.now()
      const created = await apiRequest<Escalista>('/escalistas', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Escalista Integração',
          email: `escalista${timestamp}@test.com`,
          senha: 'Senha@123456',
          role: 'escalista',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.nome).toBe('Escalista Integração')
      expect(created.role).toBe('escalista')
      expect(created.ativo).toBe(true)
      createdEscalistaId = created.id

      // READ
      const fetched = await apiRequest<Escalista>(`/escalistas/${createdEscalistaId}`)
      expect(fetched.id).toBe(createdEscalistaId)

      // UPDATE
      const updated = await apiRequest<Escalista>(`/escalistas/${createdEscalistaId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: 'Escalista Atualizado' }),
      })
      expect(updated.nome).toBe('Escalista Atualizado')

      // DELETE
      await apiRequest(`/escalistas/${createdEscalistaId}`, { method: 'DELETE' })
    })
  })

  describe('Role Management', () => {
    it('should update escalista role', async () => {
      const timestamp = Date.now()
      const escalista = await apiRequest<Escalista>('/escalistas', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Promover Escalista',
          email: `promover${timestamp}@test.com`,
          senha: 'Senha@123456',
          role: 'escalista',
        }),
      })

      // Promote to coordenador
      const promoted = await apiRequest<Escalista>(`/escalistas/${escalista.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'coordenador' }),
      })
      expect(promoted.role).toBe('coordenador')

      // Cleanup
      await apiRequest(`/escalistas/${escalista.id}`, { method: 'DELETE' })
    })
  })

  describe('Activate/Deactivate', () => {
    it('should deactivate and reactivate escalista', async () => {
      const timestamp = Date.now()
      const escalista = await apiRequest<Escalista>('/escalistas', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Desativar Escalista',
          email: `desativar${timestamp}@test.com`,
          senha: 'Senha@123456',
          role: 'escalista',
        }),
      })

      // Deactivate
      const deactivated = await apiRequest<Escalista>(`/escalistas/${escalista.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      expect(deactivated.ativo).toBe(false)

      // Reactivate
      const reactivated = await apiRequest<Escalista>(`/escalistas/${escalista.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: true }),
      })
      expect(reactivated.ativo).toBe(true)

      // Cleanup
      await apiRequest(`/escalistas/${escalista.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should filter by role', async () => {
      const response = await apiRequest<PaginatedResponse<Escalista>>(
        '/escalistas?role=administrador'
      )

      response.data.forEach((escalista) => {
        expect(escalista.role).toBe('administrador')
      })
    })

    it('should filter by ativo status', async () => {
      const response = await apiRequest<PaginatedResponse<Escalista>>('/escalistas?ativo=true')

      response.data.forEach((escalista) => {
        expect(escalista.ativo).toBe(true)
      })
    })

    it('should search by nome or email', async () => {
      const response = await apiRequest<PaginatedResponse<Escalista>>('/escalistas?search=admin')

      expect(response.data).toBeDefined()
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Escalista>>(
        '/escalistas?page=1&limit=5'
      )

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
