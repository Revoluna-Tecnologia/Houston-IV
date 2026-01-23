import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMedicos } from '../use-medicos'
import { medicosService } from '../../services'
import type { Medico } from '../../services'

vi.mock('../../services', () => ({
  medicosService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockMedicos: Medico[] = [
  {
    id: 'med-1',
    nome: 'Dr. João Silva',
    crm: '123456',
    especialidade: 'Clínica Geral',
    telefone: '11999999999',
    email: 'joao@medico.com',
    grupoId: 'grupo-1',
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'med-2',
    nome: 'Dra. Maria Santos',
    crm: '654321',
    especialidade: 'Cardiologia',
    telefone: '11888888888',
    email: 'maria@medico.com',
    grupoId: 'grupo-1',
    ativo: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

const mockPaginatedResponse = {
  data: mockMedicos,
  meta: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
}

describe('useMedicos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(medicosService.getAll).mockResolvedValue(mockPaginatedResponse)
  })

  describe('initial fetch', () => {
    it('should fetch medicos on mount', async () => {
      const { result } = renderHook(() => useMedicos())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(medicosService.getAll).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockMedicos)
      expect(result.current.meta.total).toBe(2)
    })

    it('should pass query params to service', async () => {
      const { result } = renderHook(() => useMedicos({ search: 'João' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(medicosService.getAll).toHaveBeenCalledWith({ search: 'João' })
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(medicosService.getAll).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useMedicos())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a new medico', async () => {
      const newMedico: Medico = {
        id: 'med-3',
        nome: 'Dr. Carlos Lima',
        crm: '789012',
        especialidade: 'Pediatria',
        telefone: '11777777777',
        email: 'carlos@medico.com',
        grupoId: 'grupo-1',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(medicosService.create).mockResolvedValue(newMedico)

      const { result } = renderHook(() => useMedicos())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const createData = { nome: 'Dr. Carlos Lima', crm: '789012', grupoId: 'grupo-1' }
      let created: Medico | undefined
      await act(async () => {
        created = await result.current.create(createData)
      })

      expect(created).toEqual(newMedico)
      expect(medicosService.create).toHaveBeenCalledWith(createData)
    })
  })

  describe('update', () => {
    it('should update a medico', async () => {
      const updatedMedico = { ...mockMedicos[0], nome: 'Dr. João Updated' }
      vi.mocked(medicosService.update).mockResolvedValue(updatedMedico)

      const { result } = renderHook(() => useMedicos())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.update('med-1', { nome: 'Dr. João Updated' })
      })

      expect(medicosService.update).toHaveBeenCalledWith('med-1', { nome: 'Dr. João Updated' })
    })
  })

  describe('remove', () => {
    it('should delete a medico', async () => {
      vi.mocked(medicosService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useMedicos())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.remove('med-1')
      })

      expect(medicosService.delete).toHaveBeenCalledWith('med-1')
    })
  })

  describe('refetch', () => {
    it('should refetch medicos', async () => {
      const { result } = renderHook(() => useMedicos())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(medicosService.getAll).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(medicosService.getAll).toHaveBeenCalledTimes(2)
    })
  })
})
