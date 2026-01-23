'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { TicketAnalytics, TicketStatus, TicketPriority, TicketCategory } from '@/services/tickets'

interface DistributionChartsProps {
  byStatus: TicketAnalytics['byStatus']
  byPriority: TicketAnalytics['byPriority']
  byCategory: TicketAnalytics['byCategory']
  total: number
}

const statusLabels: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Aberto', color: 'bg-blue-500' },
  in_review: { label: 'Em Revisao', color: 'bg-yellow-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-purple-500' },
  resolved: { label: 'Resolvido', color: 'bg-green-500' },
  closed: { label: 'Fechado', color: 'bg-gray-500' },
}

const priorityLabels: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-400' },
  medium: { label: 'Media', color: 'bg-blue-400' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  critical: { label: 'Critica', color: 'bg-red-500' },
}

const categoryLabels: Record<TicketCategory, string> = {
  ui: 'UI',
  functionality: 'Funcionalidade',
  performance: 'Performance',
  security: 'Seguranca',
  api: 'API',
  other: 'Outro',
}

export function DistributionCharts({
  byStatus,
  byPriority,
  byCategory,
  total,
}: DistributionChartsProps) {
  const calcPercent = (value: number) => (total > 0 ? (value / total) * 100 : 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(byStatus).map(([key, value]) => {
            const config = statusLabels[key as TicketStatus]
            const percent = calcPercent(value)
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{config?.label || key}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config?.color || 'bg-gray-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Prioridade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(byPriority).map(([key, value]) => {
            const config = priorityLabels[key as TicketPriority]
            const percent = calcPercent(value)
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{config?.label || key}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config?.color || 'bg-gray-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(byCategory).map(([key, value]) => {
            const percent = calcPercent(value)
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{categoryLabels[key as TicketCategory] || key}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
