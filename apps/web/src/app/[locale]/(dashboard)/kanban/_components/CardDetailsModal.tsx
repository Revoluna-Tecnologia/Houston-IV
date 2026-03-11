'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { KanbanCard } from '@/services/kanban'

interface CardDetailsModalProps {
  card: KanbanCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddComment: (cardId: string, content: string) => Promise<void>
  onAddLink: (cardId: string, title: string, url: string) => Promise<void>
  onDelete: (cardId: string) => Promise<void>
}

export function CardDetailsModal({ card, open, onOpenChange, onAddComment, onAddLink, onDelete }: CardDetailsModalProps) {
  const t = useTranslations('Kanban')
  const [newComment, setNewComment] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!card) return null

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      await onAddComment(card.id, newComment)
      setNewComment('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return
    setIsSubmitting(true)
    try {
      await onAddLink(card.id, newLinkTitle, newLinkUrl)
      setNewLinkTitle('')
      setNewLinkUrl('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(t('card.deleteConfirm'))) {
      await onDelete(card.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {card.description && (
            <div>
              <h4 className="font-medium mb-2">{t('card.description')}</h4>
              <p className="text-muted-foreground">{card.description}</p>
            </div>
          )}

          {card.tags && card.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {card.links && card.links.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Links</h4>
              <div className="space-y-2">
                {card.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">{t('card.addLink')}</h4>
            <div className="flex gap-2">
              <Input
                placeholder={t('card.linkTitlePlaceholder')}
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="URL"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddLink} disabled={isSubmitting}>
                {t('card.add')}
              </Button>
            </div>
          </div>

          {card.timeline && card.timeline.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">{t('card.history')}</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {card.timeline.map((entry) => (
                  <div key={entry.id} className="text-sm p-2 bg-muted rounded">
                    <span className="text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString('pt-BR')}:
                    </span>{' '}
                    {entry.content || entry.type}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">{t('card.addComment')}</h4>
            <Textarea
              placeholder={t('card.commentPlaceholder')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
                {t('card.comment')}
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-xs text-muted-foreground">
              {t('card.createdAt')} {new Date(card.createdAt).toLocaleDateString('pt-BR')}
            </span>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              {t('card.deleteCard')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
