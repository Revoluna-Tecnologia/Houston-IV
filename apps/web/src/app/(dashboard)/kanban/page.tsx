'use client'

import { useState, useCallback, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useKanbanBoard } from '@/hooks/kanban'
import { KanbanTab } from '@/services/kanban'
import {
  KanbanColumn,
  CreateCardModal,
  CardDetailsModal,
} from './_components'
import type { KanbanCard } from '@/services/kanban'

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'A Fazer' },
  { id: 'in_progress', title: 'Em Progresso' },
  { id: 'review', title: 'Revisao' },
  { id: 'done', title: 'Concluido' },
]

const TABS: { value: KanbanTab; label: string }[] = [
  { value: KanbanTab.PROJETOS, label: 'Projetos' },
  { value: KanbanTab.FINANCEIRO, label: 'Financeiro' },
]

export default function KanbanPage() {
  const { user } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<KanbanTab>(KanbanTab.PROJETOS)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)

  const {
    cards,
    isLoading,
    error,
    createCard,
    updateCard,
    moveCard,
    addComment,
    addLink,
    deleteCard,
  } = useKanbanBoard({ tab: activeTab })

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards
    const query = searchQuery.toLowerCase()
    return cards.filter(
      (card) =>
        card.title.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query)
    )
  }, [cards, searchQuery])

  const getColumnCards = useCallback(
    (status: string) => filteredCards.filter((card) => card.status === status),
    [filteredCards]
  )

  const currentGrupoId = user?.grupoIds?.[0] ?? ''

  const handleCreateCard = useCallback(
    async (data: Parameters<typeof createCard>[0]) => {
      await createCard(data)
      setIsCreateModalOpen(false)
    },
    [createCard],
  )

  const handleMoveCard = useCallback(
    async (cardId: string, newStatus: string) => {
      await moveCard(cardId, newStatus)
    },
    [moveCard]
  )

  const handleAddComment = useCallback(
    async (cardId: string, content: string) => {
      await addComment(cardId, content)
    },
    [addComment]
  )

  const handleAddLink = useCallback(
    async (cardId: string, title: string, url: string) => {
      await addLink(cardId, title, url)
    },
    [addLink]
  )

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      await deleteCard(cardId)
      setSelectedCard(null)
    },
    [deleteCard]
  )

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Erro ao carregar o quadro Kanban
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kanban</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Novo Card</Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Select
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as KanbanTab)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione a aba" />
          </SelectTrigger>
          <SelectContent>
            {TABS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-72">
              <Skeleton className="h-8 w-full mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              cards={getColumnCards(column.id)}
              onMoveCard={handleMoveCard}
              onCardClick={setSelectedCard}
            />
          ))}
        </div>
      )}

      <CreateCardModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateCard}
        grupoId={currentGrupoId}
      />

      <CardDetailsModal
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
        onAddComment={handleAddComment}
        onAddLink={handleAddLink}
        onDelete={handleDeleteCard}
      />
    </div>
  )
}
