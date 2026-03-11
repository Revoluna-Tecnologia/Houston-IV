'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Ticket } from '@/services/tickets'
import { useTranslations } from 'next-intl'

interface TicketCardProps {
  ticket: Ticket
  onView: (ticket: Ticket) => void
}

export function TicketCard({ ticket, onView }: TicketCardProps) {
  const t = useTranslations('Support')

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    open: { label: t('status.open'), variant: 'default' },
    in_review: { label: t('status.inReview'), variant: 'secondary' },
    in_progress: { label: t('status.inProgress'), variant: 'secondary' },
    resolved: { label: t('status.resolved'), variant: 'outline' },
    closed: { label: t('status.closed'), variant: 'outline' },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: t('priority.low'), className: 'bg-gray-100 text-gray-800' },
    medium: { label: t('priority.medium'), className: 'bg-blue-100 text-blue-800' },
    high: { label: t('priority.high'), className: 'bg-orange-100 text-orange-800' },
    critical: { label: t('priority.critical'), className: 'bg-red-100 text-red-800' },
  }

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
              <span className="text-xs text-muted-foreground">{ticket.commentsCount} {t('card.comments')}</span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
        {ticket.slaBreach && (
          <div className="mt-2 text-xs text-red-600 font-medium">{t('card.slaViolated')}</div>
        )}
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView(ticket) }}>
            {t('card.viewDetails')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
