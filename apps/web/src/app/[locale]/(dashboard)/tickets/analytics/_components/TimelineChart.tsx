'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TicketAnalytics } from '@/services/tickets'
import { useTranslations } from 'next-intl'

interface TimelineChartProps {
  data: TicketAnalytics['timeline']
}

export function TimelineChart({ data }: TimelineChartProps) {
  const t = useTranslations('Tickets')

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.ticketsTimeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t('admin.noDataAvailable')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.created, d.resolved)), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.ticketsTimeline')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48">
          {data.map((item, index) => {
            const createdHeight = (item.created / maxValue) * 100
            const resolvedHeight = (item.resolved / maxValue) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-40">
                  <div
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${createdHeight}%` }}
                    title={`${t('admin.created')}: ${item.created}`}
                  />
                  <div
                    className="flex-1 bg-green-400 rounded-t"
                    style={{ height: `${resolvedHeight}%` }}
                    title={`${t('admin.resolved')}: ${item.resolved}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground truncate w-full text-center">
                  {new Date(item.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded" />
            <span className="text-sm">{t('admin.created')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span className="text-sm">{t('admin.resolved')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
