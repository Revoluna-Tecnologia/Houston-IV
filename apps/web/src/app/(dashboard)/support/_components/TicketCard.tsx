'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Ticket } from '@/services/tickets'

interface TicketCardProps {
  ticket: Ticket
  onView: (ticket: Ticket) => void
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

export function TicketCard({ ticket, onView }: TicketCardProps) {
  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onView(ticket)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight line-clamp-2">{ticket.title}</h3>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${priority.className}`}>{priority.label}</span>
            {ticket.commentsCount ? (
              <span className="text-xs text-muted-foreground">{ticket.commentsCount} comentarios</span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
        {ticket.slaBreach && (
          <div className="mt-2 text-xs text-red-600 font-medium">SLA violado</div>
        )}
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView(ticket) }}>
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
