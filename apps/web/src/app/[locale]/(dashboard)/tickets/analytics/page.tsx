'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTicketAnalytics } from '@/hooks/tickets'
import type { AnalyticsQueryParams } from '@/services/tickets'
import {
  AnalyticsCards,
  SLAMetrics,
  DistributionCharts,
  TopAssignees,
  TimelineChart,
} from './_components'

export default function TicketAnalyticsPage() {
  const t = useTranslations('Tickets')
  const [sector, setSector] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const sectorOptions = [
    { value: 'all', label: t('analytics.allSectors') },
    { value: 'dev', label: t('analytics.sectorDev') },
    { value: 'comercial', label: t('analytics.sectorComercial') },
    { value: 'prompters', label: t('analytics.sectorPrompters') },
  ]

  const queryParams = useMemo<AnalyticsQueryParams>(() => ({
    sector: sector !== 'all' ? sector : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [sector, startDate, endDate])

  const { data, isLoading, error, refetch } = useTicketAnalytics(queryParams)

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{t('analytics.loadError')}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
        <Button variant="outline" onClick={() => refetch()}>
          {t('analytics.refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('analytics.sectorPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {sectorOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('analytics.from')}:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('analytics.to')}:</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <AnalyticsCards data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimelineChart data={data.timeline} />
            <SLAMetrics data={data.slaMetrics} />
          </div>

          <DistributionCharts
            byStatus={data.byStatus}
            byPriority={data.byPriority}
            byCategory={data.byCategory}
            total={data.totalTickets}
          />

          <TopAssignees data={data.topAssignees} />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {t('analytics.noData')}
        </div>
      )}
    </div>
  )
}
