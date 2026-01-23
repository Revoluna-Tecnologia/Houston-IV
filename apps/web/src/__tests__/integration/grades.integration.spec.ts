import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Grade {
  id: string
  nome: string
  hospitalId: string
  setorId: string
  mes: number
  ano: number
  status: string
  publicadoEm?: string
}

interface Slot {
  id: string
  gradeId: string
  data: string
  horaInicio: string
  horaFim: string
  medicoId?: string
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

describe('Grades Integration', () => {
  let createdGradeId: string
  let testHospitalId: string
  let testSetorId: string

  describe('CRUD Operations', () => {
    it('should list grades', async () => {
      const response = await apiRequest<PaginatedResponse<Grade>>('/grades')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should create, read, update and delete grade', async () => {
      // Get hospital and setor for creating grade
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
      const created = await apiRequest<Grade>('/grades', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Grade Integração',
          hospitalId: testHospitalId,
          setorId: testSetorId,
          mes: 12,
          ano: 2024,
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.nome).toBe('Grade Integração')
      expect(created.status).toBe('rascunho')
      createdGradeId = created.id

      // READ
      const fetched = await apiRequest<Grade>(`/grades/${createdGradeId}`)
      expect(fetched.id).toBe(createdGradeId)

      // UPDATE
      const updated = await apiRequest<Grade>(`/grades/${createdGradeId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: 'Grade Atualizada' }),
      })
      expect(updated.nome).toBe('Grade Atualizada')

      // DELETE
      await apiRequest(`/grades/${createdGradeId}`, { method: 'DELETE' })
    })
  })

  describe('Status Transitions', () => {
    it('should publish and unpublish grade', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      const setores = await apiRequest<PaginatedResponse<{ id: string }>>(
        `/setores?hospitalId=${hospitais.data[0]?.id}`
      )

      if (!hospitais.data[0] || !setores.data[0]) {
        console.log('No data available, skipping test')
        return
      }

      const grade = await apiRequest<Grade>('/grades', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Grade Publicar',
          hospitalId: hospitais.data[0].id,
          setorId: setores.data[0].id,
          mes: 11,
          ano: 2024,
        }),
      })

      // Publish
      const published = await apiRequest<Grade>(`/grades/${grade.id}/publicar`, {
        method: 'POST',
      })
      expect(published.status).toBe('publicada')
      expect(published.publicadoEm).toBeDefined()

      // Unpublish
      const unpublished = await apiRequest<Grade>(`/grades/${grade.id}/despublicar`, {
        method: 'POST',
      })
      expect(unpublished.status).toBe('rascunho')

      // Cleanup
      await apiRequest(`/grades/${grade.id}`, { method: 'DELETE' })
    })
  })

  describe('Slots Management', () => {
    it('should add and remove slots from grade', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      const setores = await apiRequest<PaginatedResponse<{ id: string }>>(
        `/setores?hospitalId=${hospitais.data[0]?.id}`
      )

      if (!hospitais.data[0] || !setores.data[0]) {
        console.log('No data available, skipping test')
        return
      }

      const grade = await apiRequest<Grade>('/grades', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Grade Slots',
          hospitalId: hospitais.data[0].id,
          setorId: setores.data[0].id,
          mes: 10,
          ano: 2024,
        }),
      })

      // Add slot
      const slot = await apiRequest<Slot>(`/grades/${grade.id}/slots`, {
        method: 'POST',
        body: JSON.stringify({
          data: '2024-10-15',
          horaInicio: '08:00',
          horaFim: '14:00',
        }),
      })

      expect(slot.id).toBeDefined()
      expect(slot.gradeId).toBe(grade.id)

      // List slots
      const slots = await apiRequest<Slot[]>(`/grades/${grade.id}/slots`)
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.length).toBeGreaterThanOrEqual(1)

      // Remove slot
      await apiRequest(`/grades/${grade.id}/slots/${slot.id}`, { method: 'DELETE' })

      // Cleanup
      await apiRequest(`/grades/${grade.id}`, { method: 'DELETE' })
    })

    it('should assign medico to slot', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')
      const setores = await apiRequest<PaginatedResponse<{ id: string }>>(
        `/setores?hospitalId=${hospitais.data[0]?.id}`
      )
      const medicos = await apiRequest<PaginatedResponse<{ id: string }>>('/medicos')

      if (!hospitais.data[0] || !setores.data[0] || !medicos.data[0]) {
        console.log('No data available, skipping test')
        return
      }

      const grade = await apiRequest<Grade>('/grades', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Grade Atribuir',
          hospitalId: hospitais.data[0].id,
          setorId: setores.data[0].id,
          mes: 9,
          ano: 2024,
        }),
      })

      const slot = await apiRequest<Slot>(`/grades/${grade.id}/slots`, {
        method: 'POST',
        body: JSON.stringify({
          data: '2024-09-15',
          horaInicio: '08:00',
          horaFim: '14:00',
        }),
      })

      // Assign medico
      const assigned = await apiRequest<Slot>(`/grades/${grade.id}/slots/${slot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ medicoId: medicos.data[0].id }),
      })
      expect(assigned.medicoId).toBe(medicos.data[0].id)

      // Unassign medico
      const unassigned = await apiRequest<Slot>(`/grades/${grade.id}/slots/${slot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ medicoId: null }),
      })
      expect(unassigned.medicoId).toBeNull()

      // Cleanup
      await apiRequest(`/grades/${grade.id}`, { method: 'DELETE' })
    })
  })

  describe('Filtering', () => {
    it('should filter by hospitalId', async () => {
      const hospitais = await apiRequest<PaginatedResponse<{ id: string }>>('/hospitais')

      if (hospitais.data.length > 0) {
        const response = await apiRequest<PaginatedResponse<Grade>>(
          `/grades?hospitalId=${hospitais.data[0].id}`
        )

        response.data.forEach((grade) => {
          expect(grade.hospitalId).toBe(hospitais.data[0].id)
        })
      }
    })

    it('should filter by mes and ano', async () => {
      const response = await apiRequest<PaginatedResponse<Grade>>('/grades?mes=12&ano=2024')

      response.data.forEach((grade) => {
        expect(grade.mes).toBe(12)
        expect(grade.ano).toBe(2024)
      })
    })

    it('should filter by status', async () => {
      const response = await apiRequest<PaginatedResponse<Grade>>('/grades?status=publicada')

      response.data.forEach((grade) => {
        expect(grade.status).toBe('publicada')
      })
    })

    it('should paginate results', async () => {
      const response = await apiRequest<PaginatedResponse<Grade>>('/grades?page=1&limit=5')

      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })
})
