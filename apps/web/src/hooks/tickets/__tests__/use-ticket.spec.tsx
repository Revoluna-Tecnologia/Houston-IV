import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTicket } from '../use-ticket'
import { ticketsService } from '../../../services/tickets'
import type { Ticket } from '../../../services/tickets'

vi.mock('../../../services/tickets', () => ({
  ticketsService: {
    getById: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
    archive: vi.fn(),
  },
}))

const mockTicket: Ticket = {
  id: 'ticket-1',
  title: 'Test Ticket',
  description: 'Description',
  status: 'open',
  priority: 'medium',
  type: 'bug',
  category: 'functionality',
  sector: 'dev',
  grupoId: 'grupo-1',
  reporterId: 'user-1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('useTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ticketsService.getById).mockResolvedValue(mockTicket)
  })

  describe('initial fetch', () => {
    it('should fetch ticket by id on mount', async () => {
      const { result } = renderHook(() => useTicket('ticket-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(ticketsService.getById).toHaveBeenCalledWith('ticket-1')
      expect(result.current.data).toEqual(mockTicket)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Ticket not found')
      vi.mocked(ticketsService.getById).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toBeNull()
    })
  })

  describe('update', () => {
    it('should update the ticket', async () => {
      const updatedTicket = { ...mockTicket, title: 'Updated Title' }
      vi.mocked(ticketsService.update).mockResolvedValue(updatedTicket)

      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let updated: Ticket | undefined
      await act(async () => {
        updated = await result.current.update({ title: 'Updated Title' })
      })

      expect(updated).toEqual(updatedTicket)
      expect(ticketsService.update).toHaveBeenCalledWith('ticket-1', { title: 'Updated Title' })
      expect(result.current.data).toEqual(updatedTicket)
    })
  })

  describe('updateStatus', () => {
    it('should update the ticket status', async () => {
      const updatedTicket = { ...mockTicket, status: 'closed' as const }
      vi.mocked(ticketsService.updateStatus).mockResolvedValue(updatedTicket)

      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.updateStatus('closed')
      })

      expect(ticketsService.updateStatus).toHaveBeenCalledWith('ticket-1', 'closed')
      expect(result.current.data?.status).toBe('closed')
    })
  })

  describe('assign', () => {
    it('should assign the ticket to a user', async () => {
      const assignedTicket = { ...mockTicket, assigneeId: 'user-2' }
      vi.mocked(ticketsService.assign).mockResolvedValue(assignedTicket)

      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.assign('user-2')
      })

      expect(ticketsService.assign).toHaveBeenCalledWith('ticket-1', 'user-2')
      expect(result.current.data?.assigneeId).toBe('user-2')
    })

    it('should unassign the ticket', async () => {
      const unassignedTicket = { ...mockTicket, assigneeId: null }
      vi.mocked(ticketsService.assign).mockResolvedValue(unassignedTicket)

      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.assign(null)
      })

      expect(ticketsService.assign).toHaveBeenCalledWith('ticket-1', null)
    })
  })

  describe('archive', () => {
    it('should archive the ticket', async () => {
      const archivedTicket = { ...mockTicket, archivedAt: '2024-01-01' }
      vi.mocked(ticketsService.archive).mockResolvedValue(archivedTicket)

      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.archive()
      })

      expect(ticketsService.archive).toHaveBeenCalledWith('ticket-1')
      expect(result.current.data).toEqual(archivedTicket)
    })
  })

  describe('refetch', () => {
    it('should refetch the ticket', async () => {
      const { result } = renderHook(() => useTicket('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(ticketsService.getById).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(ticketsService.getById).toHaveBeenCalledTimes(2)
    })
  })
})
