import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface CheckinCheckout {
  id: string
  vagaId: string
  medicoId: string
  checkinAt: string | null
  checkoutAt: string | null
  observacoes?: string
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

describe('Checkin-Checkout Integration', () => {
  let createdRecordId: string
  let testVagaId: string
  let testMedicoId: string

  describe('CRUD Operations', () => {
    it('should list checkin-checkout records', async () => {
      const response = await apiRequest<PaginatedResponse<CheckinCheckout>>('/checkin-checkout')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete checkin-checkout record', async () => {
      // Get vaga and medico for creating record
      const vagas = await apiRequest<PaginatedResponse<{ id: string }>>('/vagas')
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (vagas.data.length === 0 || medicos.data.length === 0) {
        console.log('No vagas or medicos available, skipping test')
        return
      }
      testVagaId = vagas.data[0].id
      testMedicoId = medicos.data[0].id

      // CREATE
      const created = await apiRequest<CheckinCheckout>('/checkin-checkout', {
        method: 'POST',
        body: JSON.stringify({
          vagaId: testVagaId,
          medicoId: testMedicoId,
          observacoes: 'Plantão de teste',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.vagaId).toBe(testVagaId)
      expect(created.medicoId).toBe(testMedicoId)
      expect(created.checkinAt).toBeNull()
      expect(created.checkoutAt).toBeNull()
      createdRecordId = created.id

      // READ
      const fetched = await apiRequest<CheckinCheckout>(`/checkin-checkout/${createdRecordId}`)
      expect(fetched.id).toBe(createdRecordId)

      // UPDATE
      const updated = await apiRequest<CheckinCheckout>(`/checkin-checkout/${createdRecordId}`, {
        method: 'PUT',
        body: JSON.stringify({ observacoes: 'Observações atualizadas' }),
      })
      expect(updated.observacoes).toBe('Observações atualizadas')

      // DELETE
      await apiRequest(`/checkin-checkout/${createdRecordId}`, { method: 'DELETE' })
    })
  })

  describe('Checkin/Checkout Flow', () => {
    it('should complete full checkin-checkout flow', async () => {
      const vagas = await apiRequest<PaginatedResponse<{ id: string }>>('/vagas')
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (vagas.data.length === 0 || medicos.data.length === 0) {
        console.log('No vagas or medicos available, skipping test')
        return
      }

      // Create record
      const record = await apiRequest<CheckinCheckout>('/checkin-checkout', {
        method: 'POST',
        body: JSON.stringify({
          vagaId: vagas.data[0].id,
          medicoId: medicos.data[0].id,
          observacoes: 'Fluxo completo',
        }),
      })

      expect(record.checkinAt).toBeNull()
      expect(record.checkoutAt).toBeNull()

      // Checkin
      const afterCheckin = await apiRequest<CheckinCheckout>(
        `/checkin-checkout/${record.id}/checkin`,
        { method: 'POST' }
      )
      expect(afterCheckin.checkinAt).toBeDefined()
      expect(afterCheckin.checkoutAt).toBeNull()

      // Checkout
      const afterCheckout = await apiRequest<CheckinCheckout>(
        `/checkin-checkout/${record.id}/checkout`,
        { method: 'POST' }
      )
      expect(afterCheckout.checkinAt).toBeDefined()
      expect(afterCheckout.checkoutAt).toBeDefined()

      // Cleanup
      await apiRequest(`/checkin-checkout/${record.id}`, { method: 'DELETE' })
    })

    it('should register checkin', async () => {
      const vagas = await apiRequest<PaginatedResponse<{ id: string }>>('/vagas')
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (vagas.data.length === 0 || medicos.data.length === 0) {
        console.log('No vagas or medicos available, skipping test')
        return
      }

      const record = await apiRequest<CheckinCheckout>('/checkin-checkout', {
        method: 'POST',
        body: JSON.stringify({
          vagaId: vagas.data[0].id,
          medicoId: medicos.data[0].id,
        }),
      })

      const result = await apiRequest<CheckinCheckout>(
        `/checkin-checkout/${record.id}/checkin`,
        { method: 'POST' }
      )

      expect(result.checkinAt).toBeDefined()

      // Cleanup
      await apiRequest(`/checkin-checkout/${record.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should filter by medicoId', async () => {
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (medicos.data.length > 0) {
        const response = await apiRequest<PaginatedResponse<CheckinCheckout>>(
          `/checkin-checkout?medicoId=${medicos.data[0].id}`
        )

        response.data.forEach((record) => {
          expect(record.medicoId).toBe(medicos.data[0].id)
        })
      }
    })

    it('should filter by vagaId', async () => {
      const vagas = await apiRequest<PaginatedResponse<{ id: string }>>('/vagas')

      if (vagas.data.length > 0) {
        const response = await apiRequest<PaginatedResponse<CheckinCheckout>>(
          `/checkin-checkout?vagaId=${vagas.data[0].id}`
        )

        response.data.forEach((record) => {
          expect(record.vagaId).toBe(vagas.data[0].id)
        })
      }
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<CheckinCheckout>>(
        '/checkin-checkout?page=1&limit=5'
      )

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
