'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Ticket, TicketStatus } from '@/services/tickets'

interface TicketsTableProps {
  tickets: Ticket[]
  selectedIds: string[]
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onView: (ticket: Ticket) => void
  onStatusChange: (id: string, status: TicketStatus) => void
}

export function TicketsTable({
  tickets,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onStatusChange,
}: TicketsTableProps) {
  const t = useTranslations('Tickets')

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    open: { label: 'Aberto', variant: 'default' },
    in_review: { label: t('admin.statusInReview'), variant: 'secondary' },
    in_progress: { label: t('admin.statusInProgress'), variant: 'secondary' },
    resolved: { label: t('admin.statusResolved'), variant: 'outline' },
    closed: { label: t('admin.statusClosed'), variant: 'outline' },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
    medium: { label: t('admin.priorityMedium'), className: 'bg-blue-100 text-blue-800' },
    high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
    critical: { label: t('admin.priorityCritical'), className: 'bg-red-100 text-red-800' },
  }

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
          </TableHead>
          <TableHead>{t('admin.titleColumn')}</TableHead>
          <TableHead>{t('admin.statusColumn')}</TableHead>
          <TableHead>{t('admin.priorityColumn')}</TableHead>
          <TableHead>{t('admin.categoryColumn')}</TableHead>
          <TableHead>{t('admin.createdAtColumn')}</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead className="text-right">{t('admin.actionsColumn')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => {
          const status = statusConfig[ticket.status] || statusConfig.open
          const priority = priorityConfig[ticket.priority] || priorityConfig.medium
          const isSelected = selectedIds.includes(ticket.id)

          return (
            <TableRow key={ticket.id} className={isSelected ? 'bg-muted/50' : ''}>
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(ticket.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium max-w-xs truncate">
                {ticket.title}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded ${priority.className}`}>
                  {priority.label}
                </span>
              </TableCell>
              <TableCell className="capitalize">{ticket.category}</TableCell>
              <TableCell>
                {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                {ticket.slaBreach ? (
                  <Badge variant="destructive">{t('admin.violated')}</Badge>
                ) : ticket.slaDeadline ? (
                  <span className="text-xs text-muted-foreground">
                    {new Date(ticket.slaDeadline).toLocaleDateString('pt-BR')}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(ticket)}>
                  {t('admin.view')}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
        {tickets.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              {t('admin.noTicketsFound')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
