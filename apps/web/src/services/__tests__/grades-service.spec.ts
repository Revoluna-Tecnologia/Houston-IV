import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GradesService } from '../grades-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('GradesService', () => {
  let service: GradesService

  const mockGrade = {
    id: 'grade-1',
    nome: 'Grade Janeiro 2025',
    hospitalId: 'hospital-1',
    setorId: 'setor-1',
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31',
    status: 'rascunho',
    slots: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockVaga = {
    id: 'vaga-1',
    gradeId: 'grade-1',
    data: '2025-01-15',
    horarioInicio: '08:00',
    horarioFim: '12:00',
    especialidadeId: 'esp-1',
  }

  const mockPaginatedResponse = {
    data: [mockGrade],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GradesService()
  })

  describe('getAll', () => {
    it('should fetch all grades', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/grades', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch grades with filter params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { hospitalId: 'hospital-1', status: 'publicada' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/grades', params)
    })

    it('should handle pagination params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { page: 2, limit: 20 }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/grades', params)
    })
  })

  describe('getById', () => {
    it('should fetch grade by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockGrade)

      const result = await service.getById('grade-1')

      expect(apiClient.get).toHaveBeenCalledWith('/grades/grade-1')
      expect(result).toEqual(mockGrade)
    })
  })

  describe('create', () => {
    it('should create a new grade', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockGrade)

      const createData = {
        nome: 'Grade Janeiro 2025',
        hospitalId: 'hospital-1',
        setorId: 'setor-1',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/grades', createData)
      expect(result).toEqual(mockGrade)
    })
  })

  describe('update', () => {
    it('should update a grade', async () => {
      const updatedGrade = { ...mockGrade, nome: 'Grade Atualizada' }
      vi.mocked(apiClient.put).mockResolvedValue(updatedGrade)

      const updateData = { nome: 'Grade Atualizada' }
      const result = await service.update('grade-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/grades/grade-1', updateData)
      expect(result).toEqual(updatedGrade)
    })

    it('should update multiple fields', async () => {
      const updatedGrade = {
        ...mockGrade,
        nome: 'Nova Grade',
        dataFim: '2025-02-28',
      }
      vi.mocked(apiClient.put).mockResolvedValue(updatedGrade)

      const updateData = {
        nome: 'Nova Grade',
        dataFim: '2025-02-28',
      }
      const result = await service.update('grade-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/grades/grade-1', updateData)
      expect(result).toEqual(updatedGrade)
    })
  })

  describe('delete', () => {
    it('should delete a grade', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('grade-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/grades/grade-1')
    })
  })

  describe('addTimeSlots', () => {
    it('should add time slots to grade', async () => {
      const gradeWithSlots = {
        ...mockGrade,
        slots: [
          { dia: 'segunda', horarioInicio: '08:00', horarioFim: '12:00' },
          { dia: 'terca', horarioInicio: '14:00', horarioFim: '18:00' },
        ],
      }
      vi.mocked(apiClient.post).mockResolvedValue(gradeWithSlots)

      const slots = [
        { dia: 'segunda', horarioInicio: '08:00', horarioFim: '12:00' },
        { dia: 'terca', horarioInicio: '14:00', horarioFim: '18:00' },
      ]

      const result = await service.addTimeSlots('grade-1', slots)

      expect(apiClient.post).toHaveBeenCalledWith('/grades/grade-1/slots', { slots })
      expect(result).toEqual(gradeWithSlots)
    })

    it('should add empty slots array', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockGrade)

      await service.addTimeSlots('grade-1', [])

      expect(apiClient.post).toHaveBeenCalledWith('/grades/grade-1/slots', { slots: [] })
    })
  })

  describe('publish', () => {
    it('should publish a grade', async () => {
      const publishedGrade = { ...mockGrade, status: 'publicada' }
      vi.mocked(apiClient.patch).mockResolvedValue(publishedGrade)

      const result = await service.publish('grade-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/grades/grade-1/publish')
      expect(result).toEqual(publishedGrade)
    })
  })

  describe('generateVagas', () => {
    it('should generate vagas from grade', async () => {
      const vagas = [mockVaga, { ...mockVaga, id: 'vaga-2', data: '2025-01-16' }]
      vi.mocked(apiClient.post).mockResolvedValue(vagas)

      const result = await service.generateVagas('grade-1')

      expect(apiClient.post).toHaveBeenCalledWith('/grades/grade-1/generate-vagas')
      expect(result).toEqual(vagas)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no vagas generated', async () => {
      vi.mocked(apiClient.post).mockResolvedValue([])

      const result = await service.generateVagas('grade-1')

      expect(apiClient.post).toHaveBeenCalledWith('/grades/grade-1/generate-vagas')
      expect(result).toEqual([])
    })
  })
})
