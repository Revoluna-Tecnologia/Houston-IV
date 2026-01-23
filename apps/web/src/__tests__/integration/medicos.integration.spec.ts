import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Medico {
  id: string
  nome: string
  crm: string
  telefone: string
  email?: string
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

describe('Medicos Integration', () => {
  let createdMedicoId: string

  describe('CRUD Operations', () => {
    it('should list medicos', async () => {
      const response = await apiRequest<PaginatedResponse<Medico>>('/medicos')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete medico', async () => {
      // CREATE
      const timestamp = Date.now()
      const created = await apiRequest<Medico>('/medicos', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Dr. Teste Integração',
          crm: `INT${timestamp}-SP`,
          telefone: '5511999990001',
          email: `teste${timestamp}@medico.com`,
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.nome).toBe('Dr. Teste Integração')
      expect(created.ativo).toBe(true)
      createdMedicoId = created.id

      // READ
      const fetched = await apiRequest<Medico>(`/medicos/${createdMedicoId}`)
      expect(fetched.id).toBe(createdMedicoId)

      // UPDATE
      const updated = await apiRequest<Medico>(`/medicos/${createdMedicoId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: 'Dr. Atualizado Integração' }),
      })
      expect(updated.nome).toBe('Dr. Atualizado Integração')

      // DELETE
      await apiRequest(`/medicos/${createdMedicoId}`, { method: 'DELETE' })
    })
  })

  describe('Activate/Deactivate', () => {
    it('should deactivate and reactivate medico', async () => {
      const timestamp = Date.now()
      const medico = await apiRequest<Medico>('/medicos', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Dr. Ativar/Desativar',
          crm: `AD${timestamp}-SP`,
          telefone: '5511999990002',
        }),
      })

      // Deactivate
      const deactivated = await apiRequest<Medico>(`/medicos/${medico.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      expect(deactivated.ativo).toBe(false)

      // Reactivate
      const reactivated = await apiRequest<Medico>(`/medicos/${medico.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: true }),
      })
      expect(reactivated.ativo).toBe(true)

      // Cleanup
      await apiRequest(`/medicos/${medico.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should search by nome', async () => {
      const response = await apiRequest<PaginatedResponse<Medico>>('/medicos?search=Dr')

      response.data.forEach((medico) => {
        expect(medico.nome.toLowerCase()).toContain('dr')
      })
    })

    it('should filter by ativo status', async () => {
      const response = await apiRequest<PaginatedResponse<Medico>>('/medicos?ativo=true')

      response.data.forEach((medico) => {
        expect(medico.ativo).toBe(true)
      })
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Medico>>('/medicos?page=1&limit=5')

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
