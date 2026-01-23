import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTickets } from '../use-tickets'
import { ticketsService } from '../../../services/tickets'
import type { Ticket } from '../../../services/tickets'

vi.mock('../../../services/tickets', () => ({
  ticketsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Test Ticket 1',
    description: 'Description 1',
    status: 'open',
    priority: 'high',
    type: 'bug',
    category: 'functionality',
    sector: 'dev',
    grupoId: 'grupo-1',
    reporterId: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'ticket-2',
    title: 'Test Ticket 2',
    description: 'Description 2',
    status: 'in_progress',
    priority: 'medium',
    type: 'feature',
    category: 'ui',
    sector: 'dev',
    grupoId: 'grupo-1',
    reporterId: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
]

const mockPaginatedResponse = {
  data: mockTickets,
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
}

describe('useTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ticketsService.getAll).mockResolvedValue(mockPaginatedResponse)
  })

  describe('initial fetch', () => {
    it('should fetch tickets on mount', async () => {
      const { result } = renderHook(() => useTickets())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(ticketsService.getAll).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockTickets)
      expect(result.current.total).toBe(2)
      expect(result.current.page).toBe(1)
      expect(result.current.totalPages).toBe(1)
    })

    it('should pass query params to service', async () => {
      const { result } = renderHook(() =>
        useTickets({ status: 'open', priority: 'high' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(ticketsService.getAll).toHaveBeenCalledWith({ status: 'open', priority: 'high' })
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(ticketsService.getAll).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a new ticket', async () => {
      const newTicket: Ticket = {
        id: 'ticket-3',
        title: 'New Ticket',
        description: 'Description',
        status: 'open',
        priority: 'low',
        type: 'support',
        category: 'other',
        sector: 'dev',
        grupoId: 'grupo-1',
        reporterId: 'user-1',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      }
      vi.mocked(ticketsService.create).mockResolvedValue(newTicket)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const createData = { title: 'New Ticket', description: 'Description', grupoId: 'grupo-1', type: 'support' as const, category: 'other' as const, sector: 'dev' as const, priority: 'low' as const }
      let created: Ticket | undefined
      await act(async () => {
        created = await result.current.create(createData)
      })

      expect(created).toEqual(newTicket)
      expect(ticketsService.create).toHaveBeenCalledWith(createData)
    })
  })

  describe('update', () => {
    it('should update a ticket', async () => {
      const updatedTicket = { ...mockTickets[0], title: 'Updated Title' }
      vi.mocked(ticketsService.update).mockResolvedValue(updatedTicket)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.update('ticket-1', { title: 'Updated Title' })
      })

      expect(ticketsService.update).toHaveBeenCalledWith('ticket-1', { title: 'Updated Title' })
    })
  })

  describe('updateStatus', () => {
    it('should update ticket status', async () => {
      const updatedTicket = { ...mockTickets[0], status: 'closed' as const }
      vi.mocked(ticketsService.updateStatus).mockResolvedValue(updatedTicket)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.updateStatus('ticket-1', 'closed')
      })

      expect(ticketsService.updateStatus).toHaveBeenCalledWith('ticket-1', 'closed')
    })
  })

  describe('assign', () => {
    it('should assign a ticket', async () => {
      const assignedTicket = { ...mockTickets[0], assigneeId: 'user-2' }
      vi.mocked(ticketsService.assign).mockResolvedValue(assignedTicket)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.assign('ticket-1', 'user-2')
      })

      expect(ticketsService.assign).toHaveBeenCalledWith('ticket-1', 'user-2')
    })
  })

  describe('archive', () => {
    it('should archive a ticket', async () => {
      const archivedTicket = { ...mockTickets[0], archivedAt: '2024-01-01' }
      vi.mocked(ticketsService.archive).mockResolvedValue(archivedTicket)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.archive('ticket-1')
      })

      expect(ticketsService.archive).toHaveBeenCalledWith('ticket-1')
    })
  })

  describe('remove', () => {
    it('should delete a ticket', async () => {
      vi.mocked(ticketsService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.remove('ticket-1')
      })

      expect(ticketsService.delete).toHaveBeenCalledWith('ticket-1')
    })
  })

  describe('refetch', () => {
    it('should refetch tickets', async () => {
      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(ticketsService.getAll).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(ticketsService.getAll).toHaveBeenCalledTimes(2)
    })
  })
})
