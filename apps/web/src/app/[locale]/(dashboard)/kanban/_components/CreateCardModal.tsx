'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanTab, type CreateCardDto } from '@/services/kanban'

interface CreateCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateCardDto) => Promise<void>
  grupoId: string
  defaultStatus?: string
}

export function CreateCardModal({ open, onOpenChange, onSubmit, grupoId, defaultStatus = 'backlog' }: CreateCardModalProps) {
  const t = useTranslations('Kanban')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    tab: KanbanTab.PROJETOS,
  })

  const STATUSES = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: t('card.statusTodo') },
    { value: 'in_progress', label: t('card.statusInProgress') },
    { value: 'review', label: t('card.statusReview') },
    { value: 'done', label: t('card.statusDone') },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        grupoId,
        description: formData.description || undefined,
      })
      onOpenChange(false)
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        tab: KanbanTab.PROJETOS,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('newCard')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('card.titleLabel')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('card.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('card.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('card.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('card.tab')}</Label>
              <Select
                value={formData.tab}
                onValueChange={(v) => setFormData({ ...formData, tab: v as KanbanTab })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KanbanTab.PROJETOS}>{t('tabs.projects')}</SelectItem>
                  <SelectItem value={KanbanTab.FINANCEIRO}>{t('tabs.financial')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('card.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('card.creating') : t('card.createCard')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
