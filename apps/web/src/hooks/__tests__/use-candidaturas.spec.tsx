import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCandidaturas } from '../use-candidaturas'
import { candidaturasService } from '../../services'
import type { Candidatura } from '../../services'

vi.mock('../../services', () => ({
  candidaturasService: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    aprovar: vi.fn(),
    rejeitar: vi.fn(),
  },
}))

const mockCandidaturas: Candidatura[] = [
  {
    id: 'cand-1',
    vagaId: 'vaga-1',
    escalistaId: 'escalista-1',
    status: 'pendente',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cand-2',
    vagaId: 'vaga-2',
    escalistaId: 'escalista-2',
    status: 'aprovada',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

const mockPaginatedResponse = {
  data: mockCandidaturas,
  meta: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
}

describe('useCandidaturas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(candidaturasService.getAll).mockResolvedValue(mockPaginatedResponse)
  })

  describe('initial fetch', () => {
    it('should fetch candidaturas on mount', async () => {
      const { result } = renderHook(() => useCandidaturas())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(candidaturasService.getAll).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockCandidaturas)
      expect(result.current.meta.total).toBe(2)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(candidaturasService.getAll).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCandidaturas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a new candidatura', async () => {
      const newCandidatura: Candidatura = {
        id: 'cand-3',
        vagaId: 'vaga-3',
        escalistaId: 'escalista-3',
        status: 'pendente',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(candidaturasService.create).mockResolvedValue(newCandidatura)

      const { result } = renderHook(() => useCandidaturas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let created: Candidatura | undefined
      await act(async () => {
        created = await result.current.create({ vagaId: 'vaga-3', escalistaId: 'escalista-3' })
      })

      expect(created).toEqual(newCandidatura)
      expect(candidaturasService.create).toHaveBeenCalledWith({ vagaId: 'vaga-3', escalistaId: 'escalista-3' })
    })
  })

  describe('remove', () => {
    it('should delete a candidatura', async () => {
      vi.mocked(candidaturasService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCandidaturas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.remove('cand-1')
      })

      expect(candidaturasService.delete).toHaveBeenCalledWith('cand-1')
    })
  })

  describe('aprovar', () => {
    it('should approve a candidatura', async () => {
      const approvedCandidatura = { ...mockCandidaturas[0], status: 'aprovada' as const }
      vi.mocked(candidaturasService.aprovar).mockResolvedValue(approvedCandidatura)

      const { result } = renderHook(() => useCandidaturas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.aprovar('cand-1')
      })

      expect(candidaturasService.aprovar).toHaveBeenCalledWith('cand-1')
    })
  })

  describe('rejeitar', () => {
    it('should reject a candidatura', async () => {
      const rejectedCandidatura = { ...mockCandidaturas[0], status: 'rejeitada' as const }
      vi.mocked(candidaturasService.rejeitar).mockResolvedValue(rejectedCandidatura)

      const { result } = renderHook(() => useCandidaturas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.rejeitar('cand-1')
      })

      expect(candidaturasService.rejeitar).toHaveBeenCalledWith('cand-1')
    })
  })

  describe('refetch', () => {
    it('should refetch candidaturas', async () => {
      const { result } = renderHook(() => useCandidaturas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(candidaturasService.getAll).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(candidaturasService.getAll).toHaveBeenCalledTimes(2)
    })
  })
})
