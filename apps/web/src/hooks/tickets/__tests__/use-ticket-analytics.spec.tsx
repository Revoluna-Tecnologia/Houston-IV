import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTicketAnalytics } from '../use-ticket-analytics'
import { analyticsService } from '../../../services/tickets'
import type { TicketAnalytics } from '../../../services/tickets'

vi.mock('../../../services/tickets', () => ({
  analyticsService: {
    getAnalytics: vi.fn(),
  },
}))

const mockAnalytics: TicketAnalytics = {
  totalTickets: 100,
  openTickets: 30,
  closedTickets: 50,
  inProgressTickets: 20,
  avgResolutionTime: 24,
  ticketsByPriority: {
    low: 20,
    medium: 50,
    high: 25,
    urgent: 5,
  },
  ticketsByType: {
    bug: 40,
    feature: 30,
    support: 20,
    improvement: 10,
  },
  ticketsByCategory: {
    ui: 25,
    functionality: 35,
    performance: 15,
    security: 10,
    api: 10,
    other: 5,
  },
  ticketsOverTime: [
    { date: '2024-01-01', count: 10 },
    { date: '2024-01-02', count: 15 },
    { date: '2024-01-03', count: 8 },
  ],
}

describe('useTicketAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(analyticsService.getAnalytics).mockResolvedValue(mockAnalytics)
  })

  describe('initial fetch', () => {
    it('should fetch analytics on mount', async () => {
      const { result } = renderHook(() => useTicketAnalytics())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(analyticsService.getAnalytics).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockAnalytics)
    })

    it('should pass query params to service', async () => {
      const query = {
        grupoId: 'grupo-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }

      const { result } = renderHook(() => useTicketAnalytics(query))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(analyticsService.getAnalytics).toHaveBeenCalledWith(query)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch analytics')
      vi.mocked(analyticsService.getAnalytics).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTicketAnalytics())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toBeNull()
    })
  })

  describe('query changes', () => {
    it('should refetch when query changes', async () => {
      const { result, rerender } = renderHook(
        ({ query }) => useTicketAnalytics(query),
        { initialProps: { query: { grupoId: 'grupo-1' } } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(1)

      rerender({ query: { grupoId: 'grupo-2' } })

      await waitFor(() => {
        expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(2)
      })

      expect(analyticsService.getAnalytics).toHaveBeenLastCalledWith({ grupoId: 'grupo-2' })
    })
  })

  describe('refetch', () => {
    it('should refetch analytics', async () => {
      const { result } = renderHook(() => useTicketAnalytics())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(2)
    })
  })
})
