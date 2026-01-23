import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { AnalyticsQueryDto } from './dto'
import type {
  TicketAnalyticsResponseDto,
  StatusCountDto,
  PriorityCountDto,
  CategoryCountDto,
  SectorCountDto,
  TimelineDataPointDto,
  SlaMetricsDto,
  AssigneeMetricsDto,
} from './dto'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(query: AnalyticsQueryDto): Promise<TicketAnalyticsResponseDto> {
    const where = this.buildWhereClause(query)

    const [
      totalTickets,
      byStatus,
      byPriority,
      byCategory,
      bySector,
      avgResolutionTime,
      slaMetrics,
      timeline,
      topAssignees,
    ] = await Promise.all([
      this.getTotalCount(where),
      this.getCountByStatus(where),
      this.getCountByPriority(where),
      this.getCountByCategory(where),
      this.getCountBySector(where),
      this.getAvgResolutionTime(where),
      this.getSlaMetrics(where),
      this.getTimeline(query),
      this.getTopAssignees(where),
    ])

    const openTickets = byStatus.open + byStatus.in_review + byStatus.in_progress
    const resolvedTickets = byStatus.resolved + byStatus.closed

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTimeHours: avgResolutionTime,
      byStatus,
      byPriority,
      byCategory,
      bySector,
      timeline,
      slaMetrics,
      topAssignees,
    }
  }

  private buildWhereClause(query: AnalyticsQueryDto): Record<string, unknown> {
    const where: Record<string, unknown> = {}

    if (query.grupoId) where.grupoId = query.grupoId
    if (query.assigneeId) where.assignedToId = query.assigneeId
    if (query.sector) where.sector = query.sector

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) (where.createdAt as Record<string, Date>).gte = new Date(query.startDate)
      if (query.endDate) (where.createdAt as Record<string, Date>).lte = new Date(query.endDate)
    }

    return where
  }

  private async getTotalCount(where: Record<string, unknown>): Promise<number> {
    return this.prisma.ticket.count({ where })
  }

  private async getCountByStatus(where: Record<string, unknown>): Promise<StatusCountDto> {
    const counts = await this.prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    })

    const result: StatusCountDto = { open: 0, in_review: 0, in_progress: 0, resolved: 0, closed: 0 }
    for (const item of counts) {
      result[item.status as keyof StatusCountDto] = item._count.status
    }
    return result
  }

  private async getCountByPriority(where: Record<string, unknown>): Promise<PriorityCountDto> {
    const counts = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    })

    const result: PriorityCountDto = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const item of counts) {
      result[item.priority as keyof PriorityCountDto] = item._count.priority
    }
    return result
  }

  private async getCountByCategory(where: Record<string, unknown>): Promise<CategoryCountDto> {
    const counts = await this.prisma.ticket.groupBy({
      by: ['category'],
      where,
      _count: { category: true },
    })

    const result: CategoryCountDto = { ui: 0, functionality: 0, performance: 0, security: 0, api: 0, other: 0 }
    for (const item of counts) {
      result[item.category as keyof CategoryCountDto] = item._count.category
    }
    return result
  }

  private async getCountBySector(where: Record<string, unknown>): Promise<SectorCountDto> {
    const counts = await this.prisma.ticket.groupBy({
      by: ['sector'],
      where,
      _count: { sector: true },
    })

    const result: SectorCountDto = { dev: 0, comercial: 0, prompters: 0 }
    for (const item of counts) {
      result[item.sector as keyof SectorCountDto] = item._count.sector
    }
    return result
  }

  private async getAvgResolutionTime(where: Record<string, unknown>): Promise<number | null> {
    const resolved = await this.prisma.ticket.findMany({
      where: { ...where, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    })

    if (resolved.length === 0) return null

    const totalHours = resolved.reduce((sum, t) => {
      const diff = t.resolvedAt!.getTime() - t.createdAt.getTime()
      return sum + diff / (1000 * 60 * 60)
    }, 0)

    return Math.round((totalHours / resolved.length) * 10) / 10
  }

  private async getSlaMetrics(where: Record<string, unknown>): Promise<SlaMetricsDto> {
    const now = new Date()
    const tickets = await this.prisma.ticket.findMany({
      where: { ...where, slaDeadline: { not: null } },
      select: { slaDeadline: true, slaBreach: true, status: true },
    })

    const total = tickets.length
    const breached = tickets.filter((t) => t.slaBreach).length
    const atRisk = tickets.filter((t) => {
      if (t.slaBreach || t.status === 'resolved' || t.status === 'closed') return false
      const deadline = t.slaDeadline!
      const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursRemaining > 0 && hoursRemaining <= 24
    }).length
    const onTrack = total - breached - atRisk

    return {
      total,
      breached,
      atRisk,
      onTrack,
      breachRate: total > 0 ? Math.round((breached / total) * 100) : 0,
    }
  }

  private async getTimeline(query: AnalyticsQueryDto): Promise<TimelineDataPointDto[]> {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = query.endDate ? new Date(query.endDate) : new Date()

    const where: Record<string, unknown> = {}
    if (query.grupoId) where.grupoId = query.grupoId
    if (query.sector) where.sector = query.sector

    const created = await this.prisma.ticket.groupBy({
      by: ['createdAt'],
      where: { ...where, createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
    })

    const resolved = await this.prisma.ticket.groupBy({
      by: ['resolvedAt'],
      where: { ...where, resolvedAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
    })

    const dateMap = new Map<string, { created: number; resolved: number }>()

    for (const item of created) {
      const dateKey = item.createdAt.toISOString().split('T')[0]
      const existing = dateMap.get(dateKey) || { created: 0, resolved: 0 }
      existing.created += item._count.id
      dateMap.set(dateKey, existing)
    }

    for (const item of resolved) {
      if (!item.resolvedAt) continue
      const dateKey = item.resolvedAt.toISOString().split('T')[0]
      const existing = dateMap.get(dateKey) || { created: 0, resolved: 0 }
      existing.resolved += item._count.id
      dateMap.set(dateKey, existing)
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }))
  }

  private async getTopAssignees(where: Record<string, unknown>): Promise<AssigneeMetricsDto[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { ...where, assignedToId: { not: null } },
      select: { assignedToId: true, status: true, createdAt: true, resolvedAt: true },
    })

    const assigneeMap = new Map<string, { total: number; open: number; resolved: number; resolutionTimes: number[] }>()

    for (const t of tickets) {
      const id = t.assignedToId!
      const existing = assigneeMap.get(id) || { total: 0, open: 0, resolved: 0, resolutionTimes: [] }
      existing.total++

      if (['open', 'in_review', 'in_progress'].includes(t.status)) {
        existing.open++
      } else {
        existing.resolved++
        if (t.resolvedAt) {
          const hours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60)
          existing.resolutionTimes.push(hours)
        }
      }

      assigneeMap.set(id, existing)
    }

    return Array.from(assigneeMap.entries())
      .map(([assigneeId, data]) => ({
        assigneeId,
        assigneeName: assigneeId,
        total: data.total,
        open: data.open,
        resolved: data.resolved,
        avgResolutionTimeHours:
          data.resolutionTimes.length > 0
            ? Math.round((data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length) * 10) / 10
            : null,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }
}
