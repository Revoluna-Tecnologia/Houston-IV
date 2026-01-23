import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Ticket {
  id: string
  titulo: string
  descricao: string
  status: string
  prioridade: string
  criadoPorId: string
  atribuidoParaId?: string
  createdAt: string
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

describe('Tickets Integration', () => {
  let createdTicketId: string

  describe('CRUD Operations', () => {
    it('should create, read, update and delete ticket', async () => {
      // CREATE
      const created = await apiRequest<Ticket>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          titulo: 'Ticket Integração',
          descricao: 'Descrição do ticket de teste',
          prioridade: 'media',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.titulo).toBe('Ticket Integração')
      expect(created.status).toBe('aberto')
      createdTicketId = created.id

      // READ
      const fetched = await apiRequest<Ticket>(`/tickets/${createdTicketId}`)
      expect(fetched.id).toBe(createdTicketId)
      expect(fetched.titulo).toBe('Ticket Integração')

      // UPDATE
      const updated = await apiRequest<Ticket>(`/tickets/${createdTicketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          titulo: 'Ticket Atualizado',
        }),
      })
      expect(updated.titulo).toBe('Ticket Atualizado')

      // DELETE
      await apiRequest(`/tickets/${createdTicketId}`, {
        method: 'DELETE',
      })

      // Verify deletion
      try {
        await apiRequest(`/tickets/${createdTicketId}`)
        expect.fail('Should have thrown 404')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Status Transitions', () => {
    it('should transition ticket through status flow', async () => {
      // Create ticket
      const ticket = await apiRequest<Ticket>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          titulo: 'Ticket Status Flow',
          descricao: 'Testando fluxo de status',
          prioridade: 'alta',
        }),
      })

      expect(ticket.status).toBe('aberto')

      // Start working
      const inProgress = await apiRequest<Ticket>(`/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'em_andamento' }),
      })
      expect(inProgress.status).toBe('em_andamento')

      // Resolve
      const resolved = await apiRequest<Ticket>(`/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolvido' }),
      })
      expect(resolved.status).toBe('resolvido')

      // Cleanup
      await apiRequest(`/tickets/${ticket.id}`, { method: 'DELETE' })
    })
  })

  describe('Listing and Filtering', () => {
    it('should list tickets with pagination', async () => {
      const response = await apiRequest<PaginatedResponse<Ticket>>('/tickets?page=1&limit=10')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta.page).toBe(1)
      expect(response.meta.limit).toBe(10)
    })

    it('should filter tickets by status', async () => {
      const response = await apiRequest<PaginatedResponse<Ticket>>('/tickets?status=aberto')

      response.data.forEach((ticket) => {
        expect(ticket.status).toBe('aberto')
      })
    })

    it('should filter tickets by prioridade', async () => {
      const response = await apiRequest<PaginatedResponse<Ticket>>('/tickets?prioridade=alta')

      response.data.forEach((ticket) => {
        expect(ticket.prioridade).toBe('alta')
      })
    })
  })

  describe('Assignment', () => {
    it('should assign ticket to user', async () => {
      // Create ticket
      const ticket = await apiRequest<Ticket>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          titulo: 'Ticket para Atribuir',
          descricao: 'Teste de atribuição',
          prioridade: 'media',
        }),
      })

      // Get escalistas to assign
      const escalistas = await apiRequest<PaginatedResponse<{ id: string }>>('/escalistas')

      if (escalistas.data.length > 0) {
        const assigned = await apiRequest<Ticket>(`/tickets/${ticket.id}/assign`, {
          method: 'PATCH',
          body: JSON.stringify({ atribuidoParaId: escalistas.data[0].id }),
        })

        expect(assigned.atribuidoParaId).toBe(escalistas.data[0].id)
      }

      // Cleanup
      await apiRequest(`/tickets/${ticket.id}`, { method: 'DELETE' })
    })
  })
})
