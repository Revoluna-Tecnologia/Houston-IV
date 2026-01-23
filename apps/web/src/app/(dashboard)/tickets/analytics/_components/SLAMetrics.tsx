'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { TicketAnalytics } from '@/services/tickets'

interface SLAMetricsProps {
  data: TicketAnalytics['slaMetrics']
}

export function SLAMetrics({ data }: SLAMetricsProps) {
  const complianceRate = 100 - data.breachRate

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metricas de SLA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Taxa de Cumprimento</span>
            <span className="text-sm font-bold">{complianceRate.toFixed(1)}%</span>
          </div>
          <Progress value={complianceRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">No Prazo</p>
            <p className="text-xl font-bold text-green-700">{data.onTrack}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600">Em Risco</p>
            <p className="text-xl font-bold text-yellow-700">{data.atRisk}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Violados</p>
            <p className="text-xl font-bold text-red-700">{data.breached}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total com SLA</p>
            <p className="text-xl font-bold text-gray-700">{data.total}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
