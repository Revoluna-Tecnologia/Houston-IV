import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useEscalistas } from '../use-escalistas'
import { escalistasService } from '../../services/escalistas-service'
import type { Escalista, BulkOperationResult } from '../../services/types'

vi.mock('../../services/escalistas-service', () => ({
  escalistasService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ativar: vi.fn(),
    inativar: vi.fn(),
    bulkAtivar: vi.fn(),
    bulkInativar: vi.fn(),
  },
}))

const mockEscalistas: Escalista[] = [
  {
    id: 'esc-1',
    nome: 'João Silva',
    cpf: '12345678901',
    telefone: '11999999999',
    email: 'joao@example.com',
    status: 'ativo',
    grupoId: 'grupo-1',
    especialidadeIds: ['esp-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'esc-2',
    nome: 'Maria Santos',
    cpf: '98765432109',
    telefone: '11888888888',
    email: 'maria@example.com',
    status: 'pendente',
    grupoId: 'grupo-1',
    especialidadeIds: ['esp-2'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

const mockPaginatedResponse = {
  data: mockEscalistas,
  meta: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
}

describe('useEscalistas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(escalistasService.getAll).mockResolvedValue(mockPaginatedResponse)
  })

  describe('initial fetch', () => {
    it('should fetch escalistas on mount', async () => {
      const { result } = renderHook(() => useEscalistas())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(escalistasService.getAll).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockEscalistas)
      expect(result.current.meta.total).toBe(2)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(escalistasService.getAll).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a new escalista', async () => {
      const newEscalista: Escalista = {
        id: 'esc-3',
        nome: 'Carlos Lima',
        cpf: '11122233344',
        telefone: '11777777777',
        email: 'carlos@example.com',
        status: 'pendente',
        grupoId: 'grupo-1',
        especialidadeIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(escalistasService.create).mockResolvedValue(newEscalista)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const createData = { nome: 'Carlos Lima', cpf: '11122233344', grupoId: 'grupo-1' }
      let created: Escalista | undefined
      await act(async () => {
        created = await result.current.create(createData)
      })

      expect(created).toEqual(newEscalista)
      expect(escalistasService.create).toHaveBeenCalledWith(createData)
    })
  })

  describe('update', () => {
    it('should update an escalista', async () => {
      const updatedEscalista = { ...mockEscalistas[0], nome: 'João Updated' }
      vi.mocked(escalistasService.update).mockResolvedValue(updatedEscalista)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.update('esc-1', { nome: 'João Updated' })
      })

      expect(escalistasService.update).toHaveBeenCalledWith('esc-1', { nome: 'João Updated' })
    })
  })

  describe('remove', () => {
    it('should delete an escalista', async () => {
      vi.mocked(escalistasService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.remove('esc-1')
      })

      expect(escalistasService.delete).toHaveBeenCalledWith('esc-1')
    })
  })

  describe('ativar', () => {
    it('should activate an escalista', async () => {
      const activatedEscalista = { ...mockEscalistas[1], status: 'ativo' as const }
      vi.mocked(escalistasService.ativar).mockResolvedValue(activatedEscalista)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.ativar('esc-2')
      })

      expect(escalistasService.ativar).toHaveBeenCalledWith('esc-2')
    })
  })

  describe('inativar', () => {
    it('should deactivate an escalista', async () => {
      const deactivatedEscalista = { ...mockEscalistas[0], status: 'inativo' as const }
      vi.mocked(escalistasService.inativar).mockResolvedValue(deactivatedEscalista)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.inativar('esc-1')
      })

      expect(escalistasService.inativar).toHaveBeenCalledWith('esc-1')
    })
  })

  describe('bulkAtivar', () => {
    it('should activate multiple escalistas', async () => {
      const bulkResult: BulkOperationResult = { success: 2, failed: 0 }
      vi.mocked(escalistasService.bulkAtivar).mockResolvedValue(bulkResult)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let bulkResponse: BulkOperationResult | undefined
      await act(async () => {
        bulkResponse = await result.current.bulkAtivar(['esc-1', 'esc-2'])
      })

      expect(bulkResponse).toEqual(bulkResult)
      expect(escalistasService.bulkAtivar).toHaveBeenCalledWith(['esc-1', 'esc-2'])
    })
  })

  describe('bulkInativar', () => {
    it('should deactivate multiple escalistas', async () => {
      const bulkResult: BulkOperationResult = { success: 2, failed: 0 }
      vi.mocked(escalistasService.bulkInativar).mockResolvedValue(bulkResult)

      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let bulkResponse: BulkOperationResult | undefined
      await act(async () => {
        bulkResponse = await result.current.bulkInativar(['esc-1', 'esc-2'])
      })

      expect(bulkResponse).toEqual(bulkResult)
      expect(escalistasService.bulkInativar).toHaveBeenCalledWith(['esc-1', 'esc-2'])
    })
  })

  describe('refetch', () => {
    it('should refetch escalistas', async () => {
      const { result } = renderHook(() => useEscalistas())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(escalistasService.getAll).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(escalistasService.getAll).toHaveBeenCalledTimes(2)
    })
  })
})
