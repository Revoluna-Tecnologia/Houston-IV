'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KanbanCard } from '@/services/kanban'
import { KanbanCardItem } from './KanbanCardItem'

interface KanbanColumnProps {
  id: string
  title: string
  cards: KanbanCard[]
  onCardClick: (card: KanbanCard) => void
  onMoveCard: (cardId: string, newStatus: string) => void
}

export function KanbanColumn({ id, title, cards, onCardClick, onMoveCard }: KanbanColumnProps) {
  const t = useTranslations('Kanban')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-muted/50')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-muted/50')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-muted/50')
    const cardId = e.dataTransfer.getData('cardId')
    if (cardId) {
      onMoveCard(cardId, id)
    }
  }

  return (
    <div
      className="flex-shrink-0 w-80 transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {cards.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 min-h-[200px]">
          {cards.map((card) => (
            <KanbanCardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
          {cards.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              {t('card.dragHere')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
