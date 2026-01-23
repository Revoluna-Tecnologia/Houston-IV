import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { AnalyticsService } from '../analytics.service'
import { PrismaService } from '../../../prisma/prisma.service'

describe('AnalyticsService', () => {
  let service: AnalyticsService
  let prisma: {
    ticket: {
      count: Mock
      groupBy: Mock
      findMany: Mock
    }
  }

  beforeEach(() => {
    prisma = {
      ticket: {
        count: vi.fn().mockResolvedValue(100),
        groupBy: vi.fn().mockResolvedValue([]),
        findMany: vi.fn().mockResolvedValue([]),
      },
    }

    service = new AnalyticsService(prisma as unknown as PrismaService)
  })

  describe('getAnalytics', () => {
    it('should return complete analytics', async () => {
      prisma.ticket.count.mockResolvedValue(100)
      prisma.ticket.groupBy
        .mockResolvedValueOnce([
          { status: 'open', _count: { status: 15 } },
          { status: 'in_progress', _count: { status: 10 } },
          { status: 'resolved', _count: { status: 50 } },
          { status: 'closed', _count: { status: 20 } },
        ])
        .mockResolvedValueOnce([
          { priority: 'low', _count: { priority: 20 } },
          { priority: 'medium', _count: { priority: 50 } },
          { priority: 'high', _count: { priority: 25 } },
          { priority: 'critical', _count: { priority: 5 } },
        ])
        .mockResolvedValueOnce([
          { category: 'functionality', _count: { category: 40 } },
          { category: 'ui', _count: { category: 15 } },
        ])
        .mockResolvedValueOnce([
          { sector: 'dev', _count: { sector: 60 } },
          { sector: 'comercial', _count: { sector: 25 } },
        ])
        .mockResolvedValueOnce([]) // timeline created
        .mockResolvedValueOnce([]) // timeline resolved

      const result = await service.getAnalytics({})

      expect(result.totalTickets).toBe(100)
      expect(result.byStatus.open).toBe(15)
      expect(result.byStatus.resolved).toBe(50)
      expect(result.byPriority.medium).toBe(50)
      expect(result.byCategory.functionality).toBe(40)
      expect(result.bySector.dev).toBe(60)
    })

    it('should filter by grupoId', async () => {
      await service.getAnalytics({ grupoId: 'grupo-1' })

      expect(prisma.ticket.count).toHaveBeenCalledWith({
        where: { grupoId: 'grupo-1' },
      })
    })

    it('should filter by date range', async () => {
      await service.getAnalytics({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(prisma.ticket.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      })
    })

    it('should filter by sector', async () => {
      await service.getAnalytics({ sector: 'dev' })

      expect(prisma.ticket.count).toHaveBeenCalledWith({
        where: { sector: 'dev' },
      })
    })

    it('should filter by assignee', async () => {
      await service.getAnalytics({ assigneeId: 'user-1' })

      expect(prisma.ticket.count).toHaveBeenCalledWith({
        where: { assignedToId: 'user-1' },
      })
    })

    it('should calculate average resolution time', async () => {
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      prisma.ticket.findMany
        .mockResolvedValueOnce([
          { createdAt: hourAgo, resolvedAt: now },
          { createdAt: hourAgo, resolvedAt: now },
        ])
        .mockResolvedValue([])

      const result = await service.getAnalytics({})

      expect(result.avgResolutionTimeHours).toBe(1)
    })

    it('should return null for avg resolution when no resolved tickets', async () => {
      prisma.ticket.findMany.mockResolvedValue([])

      const result = await service.getAnalytics({})

      expect(result.avgResolutionTimeHours).toBeNull()
    })

    it('should calculate SLA metrics', async () => {
      const now = new Date()
      const future = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      const nearDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000)
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      prisma.ticket.findMany
        .mockResolvedValueOnce([]) // avg resolution
        .mockResolvedValueOnce([
          { slaDeadline: future, slaBreach: false, status: 'open' }, // on track
          { slaDeadline: nearDeadline, slaBreach: false, status: 'open' }, // at risk
          { slaDeadline: past, slaBreach: true, status: 'open' }, // breached
        ])
        .mockResolvedValue([])

      const result = await service.getAnalytics({})

      expect(result.slaMetrics.total).toBe(3)
      expect(result.slaMetrics.breached).toBe(1)
      expect(result.slaMetrics.atRisk).toBe(1)
      expect(result.slaMetrics.onTrack).toBe(1)
      expect(result.slaMetrics.breachRate).toBe(33)
    })

    it('should calculate top assignees', async () => {
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      prisma.ticket.findMany
        .mockResolvedValueOnce([]) // avg resolution
        .mockResolvedValueOnce([]) // SLA metrics
        .mockResolvedValueOnce([
          { assignedToId: 'user-1', status: 'resolved', createdAt: hourAgo, resolvedAt: now },
          { assignedToId: 'user-1', status: 'open', createdAt: hourAgo, resolvedAt: null },
          { assignedToId: 'user-2', status: 'resolved', createdAt: hourAgo, resolvedAt: now },
        ])

      const result = await service.getAnalytics({})

      expect(result.topAssignees).toHaveLength(2)
      expect(result.topAssignees[0].assigneeId).toBe('user-1')
      expect(result.topAssignees[0].total).toBe(2)
      expect(result.topAssignees[0].resolved).toBe(1)
      expect(result.topAssignees[0].open).toBe(1)
    })

    it('should limit top assignees to 10', async () => {
      const assignees = Array.from({ length: 15 }, (_, i) => ({
        assignedToId: `user-${i}`,
        status: 'resolved',
        createdAt: new Date(),
        resolvedAt: new Date(),
      }))

      prisma.ticket.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(assignees)

      const result = await service.getAnalytics({})

      expect(result.topAssignees.length).toBeLessThanOrEqual(10)
    })
  })
})
