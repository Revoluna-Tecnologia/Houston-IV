'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TicketAnalytics } from '@/services/tickets'
import { useTranslations } from 'next-intl'

interface TopAssigneesProps {
  data: TicketAnalytics['topAssignees']
}

export function TopAssignees({ data }: TopAssigneesProps) {
  const t = useTranslations('Tickets')

  const formatHours = (hours: number | null) => {
    if (hours === null) return '-'
    if (hours < 1) return `${Math.round(hours * 60)}min`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.topAssignees')}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('admin.noAssignees')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.assignee')}</TableHead>
                <TableHead className="text-right">{t('admin.total')}</TableHead>
                <TableHead className="text-right">{t('admin.openCount')}</TableHead>
                <TableHead className="text-right">{t('admin.resolvedCount')}</TableHead>
                <TableHead className="text-right">{t('admin.avgTime')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((assignee) => (
                <TableRow key={assignee.assigneeId}>
                  <TableCell className="font-medium">{assignee.assigneeName}</TableCell>
                  <TableCell className="text-right">{assignee.total}</TableCell>
                  <TableCell className="text-right text-blue-600">{assignee.open}</TableCell>
                  <TableCell className="text-right text-green-600">{assignee.resolved}</TableCell>
                  <TableCell className="text-right">
                    {formatHours(assignee.avgResolutionTimeHours)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
