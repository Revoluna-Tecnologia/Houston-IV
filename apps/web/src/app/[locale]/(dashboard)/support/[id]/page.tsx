'use client'

import { use, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useTicket } from '@/hooks/tickets/use-ticket'
import { useTicketComments } from '@/hooks/tickets/use-ticket-comments'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const t = useTranslations('Support')
  const tCommon = useTranslations('Common.actions')
  const router = useRouter()
  const { data: ticket, isLoading, error } = useTicket(id)
  const { data: comments, create: createComment } = useTicketComments(id)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      await createComment({ content: newComment })
      setNewComment('')
    } finally {
      setIsSubmitting(false)
    }
  }, [newComment, createComment])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          {t('detail.notFound')}
        </div>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/support')}>
          {t('detail.back')}
        </Button>
      </div>
    )
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/support')}>
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('detail.back')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className={`text-xs px-2 py-1 rounded ${priority.className}`}>{priority.label}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('detail.createdAt', { date: new Date(ticket.createdAt).toLocaleDateString('pt-BR') })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t('detail.description')}</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.location && (
            <div>
              <h4 className="font-medium mb-1">{t('detail.location')}</h4>
              <p className="text-muted-foreground">{ticket.location}</p>
            </div>
          )}

          {ticket.reproductionSteps && (
            <div>
              <h4 className="font-medium mb-1">{t('detail.reproductionSteps')}</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.reproductionSteps}</p>
            </div>
          )}

          {ticket.slaBreach && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 font-medium">{t('detail.slaBreach')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.comments', { count: comments.length })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('detail.noComments')}</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
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

          <div className="pt-4 border-t">
            <Textarea
              placeholder={t('detail.addCommentPlaceholder')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting ? t('detail.sending') : t('detail.sendComment')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
