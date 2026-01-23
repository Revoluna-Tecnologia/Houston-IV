'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TicketAnalytics } from '@/services/tickets'

interface AnalyticsCardsProps {
  data: TicketAnalytics
}

export function AnalyticsCards({ data }: AnalyticsCardsProps) {
  const formatHours = (hours: number | null) => {
    if (hours === null) return '-'
    if (hours < 1) return `${Math.round(hours * 60)}min`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalTickets}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{data.openTickets}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{data.resolvedTickets}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tempo Medio de Resolucao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatHours(data.avgResolutionTimeHours)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
