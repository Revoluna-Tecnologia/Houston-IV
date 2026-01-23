'use client'

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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Aberto', variant: 'default' },
  in_review: { label: 'Em Revisao', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  resolved: { label: 'Resolvido', variant: 'outline' },
  closed: { label: 'Fechado', variant: 'outline' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', className: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critica', className: 'bg-red-100 text-red-800' },
}

export function TicketsTable({
  tickets,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onStatusChange,
}: TicketsTableProps) {
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
          <TableHead>Titulo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
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
                  <Badge variant="destructive">Violado</Badge>
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
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
        {tickets.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              Nenhum ticket encontrado
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
