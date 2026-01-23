import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useHospitais } from '../use-hospitais'
import { hospitaisService } from '../../services'
import type { Hospital } from '../../services'

vi.mock('../../services', () => ({
  hospitaisService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockHospitais: Hospital[] = [
  {
    id: 'hosp-1',
    nome: 'Hospital São Paulo',
    cnpj: '12345678901234',
    endereco: 'Rua A, 100',
    telefone: '1133334444',
    email: 'contato@hsp.com',
    grupoId: 'grupo-1',
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'hosp-2',
    nome: 'Hospital ABC',
    cnpj: '98765432109876',
    endereco: 'Av B, 200',
    telefone: '1122223333',
    email: 'contato@habc.com',
    grupoId: 'grupo-1',
    ativo: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

const mockPaginatedResponse = {
  data: mockHospitais,
  meta: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
}

describe('useHospitais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hospitaisService.getAll).mockResolvedValue(mockPaginatedResponse)
  })

  describe('initial fetch', () => {
    it('should fetch hospitais on mount', async () => {
      const { result } = renderHook(() => useHospitais())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(hospitaisService.getAll).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockHospitais)
      expect(result.current.meta.total).toBe(2)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(hospitaisService.getAll).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useHospitais())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a new hospital', async () => {
      const newHospital: Hospital = {
        id: 'hosp-3',
        nome: 'Hospital Novo',
        cnpj: '11122233344455',
        endereco: 'Rua C, 300',
        telefone: '1144445555',
        email: 'contato@hnovo.com',
        grupoId: 'grupo-1',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(hospitaisService.create).mockResolvedValue(newHospital)

      const { result } = renderHook(() => useHospitais())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const createData = { nome: 'Hospital Novo', cnpj: '11122233344455', grupoId: 'grupo-1' }
      let created: Hospital | undefined
      await act(async () => {
        created = await result.current.create(createData)
      })

      expect(created).toEqual(newHospital)
      expect(hospitaisService.create).toHaveBeenCalledWith(createData)
    })
  })

  describe('update', () => {
    it('should update a hospital', async () => {
      const updatedHospital = { ...mockHospitais[0], nome: 'Hospital SP Updated' }
      vi.mocked(hospitaisService.update).mockResolvedValue(updatedHospital)

      const { result } = renderHook(() => useHospitais())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.update('hosp-1', { nome: 'Hospital SP Updated' })
      })

      expect(hospitaisService.update).toHaveBeenCalledWith('hosp-1', { nome: 'Hospital SP Updated' })
    })
  })

  describe('remove', () => {
    it('should delete a hospital', async () => {
      vi.mocked(hospitaisService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useHospitais())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.remove('hosp-1')
      })

      expect(hospitaisService.delete).toHaveBeenCalledWith('hosp-1')
    })
  })

  describe('refetch', () => {
    it('should refetch hospitais', async () => {
      const { result } = renderHook(() => useHospitais())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(hospitaisService.getAll).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(hospitaisService.getAll).toHaveBeenCalledTimes(2)
    })
  })
})
