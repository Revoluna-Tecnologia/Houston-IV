'use client'

import { Badge } from '@/components/ui/badge'
import type { KanbanCard } from '@/services/kanban'

interface KanbanCardItemProps {
  card: KanbanCard
  onClick: () => void
}

export function KanbanCardItem({ card, onClick }: KanbanCardItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id)
    e.currentTarget.classList.add('opacity-50')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50')
  }

  return (
    <div
      className="p-3 bg-background border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      <h4 className="font-medium text-sm line-clamp-2">{card.title}</h4>
      {card.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
      )}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs px-1.5 py-0"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
          {card.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              +{card.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {new Date(card.createdAt).toLocaleDateString('pt-BR')}
        </span>
        {card.assigneeId && (
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium">U</span>
          </div>
        )}
      </div>
    </div>
  )
}
