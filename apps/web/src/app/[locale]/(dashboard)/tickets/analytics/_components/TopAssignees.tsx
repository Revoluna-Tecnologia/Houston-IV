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

interface TopAssigneesProps {
  data: TicketAnalytics['topAssignees']
}

export function TopAssignees({ data }: TopAssigneesProps) {
  const formatHours = (hours: number | null) => {
    if (hours === null) return '-'
    if (hours < 1) return `${Math.round(hours * 60)}min`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Responsaveis</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum responsavel atribuido
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Responsavel</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Abertos</TableHead>
                <TableHead className="text-right">Resolvidos</TableHead>
                <TableHead className="text-right">Tempo Medio</TableHead>
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
