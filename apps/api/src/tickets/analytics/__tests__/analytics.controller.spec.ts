import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { AnalyticsController } from '../analytics.controller'
import { AnalyticsService } from '../analytics.service'

describe('AnalyticsController', () => {
  let controller: AnalyticsController
  let service: {
    getAnalytics: Mock
  }

  const mockAnalytics = {
    totalTickets: 100,
    openTickets: 30,
    resolvedTickets: 70,
    avgResolutionTimeHours: 24.5,
    byStatus: {
      open: 15,
      in_review: 5,
      in_progress: 10,
      resolved: 50,
      closed: 20,
    },
    byPriority: {
      low: 20,
      medium: 50,
      high: 25,
      critical: 5,
    },
    byCategory: {
      ui: 15,
      functionality: 40,
      performance: 20,
      security: 10,
      api: 10,
      other: 5,
    },
    bySector: {
      dev: 60,
      comercial: 25,
      prompters: 15,
    },
    timeline: [
      { date: '2024-01-01', created: 5, resolved: 3 },
      { date: '2024-01-02', created: 8, resolved: 6 },
    ],
    slaMetrics: {
      total: 80,
      breached: 5,
      atRisk: 10,
      onTrack: 65,
      breachRate: 6,
    },
    topAssignees: [
      {
        assigneeId: 'user-1',
        assigneeName: 'user-1',
        total: 20,
        open: 5,
        resolved: 15,
        avgResolutionTimeHours: 18.5,
      },
    ],
  }

  beforeEach(() => {
    service = {
      getAnalytics: vi.fn().mockResolvedValue(mockAnalytics),
    }

    controller = new AnalyticsController(service as unknown as AnalyticsService)
  })

  describe('getAnalytics', () => {
    it('should return analytics without filters', async () => {
      const query = {}

      const result = await controller.getAnalytics(query)

      expect(result.totalTickets).toBe(100)
      expect(result.openTickets).toBe(30)
      expect(result.resolvedTickets).toBe(70)
      expect(service.getAnalytics).toHaveBeenCalledWith(query)
    })

    it('should filter by grupoId', async () => {
      const query = { grupoId: 'grupo-1' }

      await controller.getAnalytics(query)

      expect(service.getAnalytics).toHaveBeenCalledWith(query)
    })

    it('should filter by date range', async () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      await controller.getAnalytics(query)

      expect(service.getAnalytics).toHaveBeenCalledWith(query)
    })

    it('should filter by sector', async () => {
      const query = { sector: 'dev' }

      await controller.getAnalytics(query)

      expect(service.getAnalytics).toHaveBeenCalledWith(query)
    })

    it('should filter by assignee', async () => {
      const query = { assigneeId: 'user-1' }

      await controller.getAnalytics(query)

      expect(service.getAnalytics).toHaveBeenCalledWith(query)
    })

    it('should combine multiple filters', async () => {
      const query = {
        grupoId: 'grupo-1',
        sector: 'dev',
        assigneeId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      }

      await controller.getAnalytics(query)

      expect(service.getAnalytics).toHaveBeenCalledWith(query)
    })
  })
})
