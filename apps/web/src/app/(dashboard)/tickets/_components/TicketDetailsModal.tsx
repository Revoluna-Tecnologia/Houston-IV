'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTicketComments } from '@/hooks/tickets/use-ticket-comments'
import { TicketStatus } from '@/services/tickets'
import type { Ticket } from '@/services/tickets'

interface TicketDetailsModalProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (id: string, status: TicketStatus) => Promise<void>
  onAssign: (id: string, assigneeId: string | null) => Promise<void>
  onArchive: (id: string) => Promise<void>
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: TicketStatus.OPEN, label: 'Aberto' },
  { value: TicketStatus.IN_REVIEW, label: 'Em Revisao' },
  { value: TicketStatus.IN_PROGRESS, label: 'Em Andamento' },
  { value: TicketStatus.RESOLVED, label: 'Resolvido' },
  { value: TicketStatus.CLOSED, label: 'Fechado' },
]

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

export function TicketDetailsModal({
  ticket,
  open,
  onOpenChange,
  onStatusChange,
  onAssign,
  onArchive,
}: TicketDetailsModalProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: comments, create: createComment } = useTicketComments(ticket?.id || '')

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !ticket) return
    setIsSubmitting(true)
    try {
      await createComment({ content: newComment, isInternal: true })
      setNewComment('')
    } finally {
      setIsSubmitting(false)
    }
  }, [newComment, ticket, createComment])

  const handleStatusChange = useCallback(
    async (status: TicketStatus) => {
      if (!ticket) return
      await onStatusChange(ticket.id, status)
    },
    [ticket, onStatusChange]
  )

  const handleArchive = useCallback(async () => {
    if (!ticket || !confirm('Tem certeza que deseja arquivar este ticket?')) return
    await onArchive(ticket.id)
    onOpenChange(false)
  }, [ticket, onArchive, onOpenChange])

  if (!ticket) return null

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{ticket.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div>
              <h4 className="font-medium mb-2">Descricao</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {ticket.location && (
              <div>
                <h4 className="font-medium mb-1">Localizacao</h4>
                <p className="text-muted-foreground">{ticket.location}</p>
              </div>
            )}

            {ticket.reproductionSteps && (
              <div>
                <h4 className="font-medium mb-1">Passos para Reproducao</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {ticket.reproductionSteps}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Comentarios Internos ({comments.length})</h4>
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum comentario</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <Textarea
                  placeholder="Adicionar comentario interno..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    Comentar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Prioridade</h4>
              <span className={`text-xs px-2 py-1 rounded ${priority.className}`}>
                {priority.label}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Categoria</h4>
              <span className="text-sm capitalize">{ticket.category}</span>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Tipo</h4>
              <span className="text-sm capitalize">{ticket.type}</span>
            </div>

            {ticket.slaBreach && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <Badge variant="destructive">SLA Violado</Badge>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <p className="text-xs text-muted-foreground">
                Criado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
              </p>
              {ticket.resolvedAt && (
                <p className="text-xs text-muted-foreground">
                  Resolvido em {new Date(ticket.resolvedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleArchive}
              >
                Arquivar Ticket
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
