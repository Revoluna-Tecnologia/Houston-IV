import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Pagamento {
  id: string
  medicoId: string
  vagaId?: string
  valor: number
  status: string
  tipo: string
  dataPagamento?: string
  comprovante?: string
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

describe('Pagamentos Integration', () => {
  let createdPagamentoId: string
  let testMedicoId: string

  describe('CRUD Operations', () => {
    it('should list pagamentos', async () => {
      const response = await apiRequest<PaginatedResponse<Pagamento>>('/pagamentos')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete pagamento', async () => {
      // Get medico for creating pagamento
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')
      if (medicos.data.length === 0) {
        console.log('No medicos available, skipping test')
        return
      }
      testMedicoId = medicos.data[0].id

      // CREATE
      const created = await apiRequest<Pagamento>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify({
          medicoId: testMedicoId,
          valor: 1000,
          tipo: 'plantao',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.medicoId).toBe(testMedicoId)
      expect(created.valor).toBe(1000)
      expect(created.status).toBe('pendente')
      createdPagamentoId = created.id

      // READ
      const fetched = await apiRequest<Pagamento>(`/pagamentos/${createdPagamentoId}`)
      expect(fetched.id).toBe(createdPagamentoId)

      // UPDATE
      const updated = await apiRequest<Pagamento>(`/pagamentos/${createdPagamentoId}`, {
        method: 'PUT',
        body: JSON.stringify({ valor: 1200 }),
      })
      expect(updated.valor).toBe(1200)

      // DELETE
      await apiRequest(`/pagamentos/${createdPagamentoId}`, { method: 'DELETE' })
    })
  })

  describe('Status Transitions', () => {
    it('should authorize and process pagamento', async () => {
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (medicos.data.length === 0) {
        console.log('No medicos available, skipping test')
        return
      }

      const pagamento = await apiRequest<Pagamento>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify({
          medicoId: medicos.data[0].id,
          valor: 800,
          tipo: 'plantao',
        }),
      })

      // Authorize
      const authorized = await apiRequest<Pagamento>(`/pagamentos/${pagamento.id}/autorizar`, {
        method: 'POST',
      })
      expect(authorized.status).toBe('autorizado')

      // Process/Pay
      const processed = await apiRequest<Pagamento>(`/pagamentos/${pagamento.id}/pagar`, {
        method: 'POST',
        body: JSON.stringify({ dataPagamento: new Date().toISOString() }),
      })
      expect(processed.status).toBe('pago')
      expect(processed.dataPagamento).toBeDefined()

      // Cleanup
      await apiRequest(`/pagamentos/${pagamento.id}`, { method: 'DELETE' })
    })

    it('should cancel pagamento', async () => {
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (medicos.data.length === 0) {
        console.log('No medicos available, skipping test')
        return
      }

      const pagamento = await apiRequest<Pagamento>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify({
          medicoId: medicos.data[0].id,
          valor: 500,
          tipo: 'plantao',
        }),
      })

      // Cancel
      const cancelled = await apiRequest<Pagamento>(`/pagamentos/${pagamento.id}/cancelar`, {
        method: 'POST',
      })
      expect(cancelled.status).toBe('cancelado')

      // Cleanup
      await apiRequest(`/pagamentos/${pagamento.id}`, { method: 'DELETE' })
    })
  })

  describe('Batch Operations', () => {
    it('should authorize multiple pagamentos', async () => {
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (medicos.data.length === 0) {
        console.log('No medicos available, skipping test')
        return
      }

      // Create multiple pagamentos
      const pag1 = await apiRequest<Pagamento>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify({
          medicoId: medicos.data[0].id,
          valor: 300,
          tipo: 'plantao',
        }),
      })

      const pag2 = await apiRequest<Pagamento>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify({
          medicoId: medicos.data[0].id,
          valor: 400,
          tipo: 'plantao',
        }),
      })

      // Batch authorize
      const result = await apiRequest<{ authorized: number }>('/pagamentos/autorizar-lote', {
        method: 'POST',
        body: JSON.stringify({ ids: [pag1.id, pag2.id] }),
      })

      expect(result.authorized).toBe(2)

      // Cleanup
      await apiRequest(`/pagamentos/${pag1.id}`, { method: 'DELETE' })
      await apiRequest(`/pagamentos/${pag2.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const response = await apiRequest<PaginatedResponse<Pagamento>>(
        '/pagamentos?status=pendente'
      )

      response.data.forEach((pagamento) => {
        expect(pagamento.status).toBe('pendente')
      })
    })

    it('should filter by medicoId', async () => {
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (medicos.data.length > 0) {
        const response = await apiRequest<PaginatedResponse<Pagamento>>(
          `/pagamentos?medicoId=${medicos.data[0].id}`
        )

        response.data.forEach((pagamento) => {
          expect(pagamento.medicoId).toBe(medicos.data[0].id)
        })
      }
    })

    it('should filter by tipo', async () => {
      const response = await apiRequest<PaginatedResponse<Pagamento>>('/pagamentos?tipo=plantao')

      response.data.forEach((pagamento) => {
        expect(pagamento.tipo).toBe('plantao')
      })
    })

    it('should filter by date range', async () => {
      const dataInicio = '2024-01-01'
      const dataFim = '2024-12-31'

      const response = await apiRequest<PaginatedResponse<Pagamento>>(
        `/pagamentos?dataInicio=${dataInicio}&dataFim=${dataFim}`
      )

      expect(response.data).toBeDefined()
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Pagamento>>('/pagamentos?page=1&limit=5')

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Reports', () => {
    it('should get pagamentos summary', async () => {
      const response = await apiRequest<{
        total: number
        pendente: number
        autorizado: number
        pago: number
        cancelado: number
      }>('/pagamentos/resumo')

      expect(response.total).toBeDefined()
      expect(typeof response.total).toBe('number')
    })

    it('should get pagamentos by medico report', async () => {
      const response = await apiRequest<
        { medicoId: string; medicoNome: string; total: number; count: number }[]
      >('/pagamentos/por-medico')

      expect(Array.isArray(response)).toBe(true)
    })
  })
})
