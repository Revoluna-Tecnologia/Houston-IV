'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  kanbanService,
  type KanbanCard,
  type KanbanQueryParams,
  type CreateCardDto,
  type UpdateCardDto,
  type KanbanTag,
} from '../../services/kanban'

interface UseKanbanBoardReturn {
  cards: KanbanCard[]
  tags: KanbanTag[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  createCard: (data: CreateCardDto) => Promise<KanbanCard>
  updateCard: (id: string, data: UpdateCardDto) => Promise<KanbanCard>
  moveCard: (id: string, status: string) => Promise<KanbanCard>
  assignCard: (id: string, assigneeId: string | null) => Promise<KanbanCard>
  deleteCard: (id: string, hard?: boolean) => Promise<void>
  addTag: (cardId: string, name: string, grupoId: string, color?: string) => Promise<KanbanCard>
  removeTag: (cardId: string, tagId: string) => Promise<KanbanCard>
  addLink: (cardId: string, title: string, url: string) => Promise<KanbanCard>
  removeLink: (cardId: string, linkId: string) => Promise<KanbanCard>
  addComment: (cardId: string, content: string) => Promise<KanbanCard>
}

export function useKanbanBoard(query?: KanbanQueryParams): UseKanbanBoardReturn {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [tags, setTags] = useState<KanbanTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const queryRef = useRef(query)
  const queryKey = JSON.stringify(query)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [cardsData, tagsData] = await Promise.all([
        kanbanService.getCards(queryRef.current),
        queryRef.current?.grupoId ? kanbanService.getTags(queryRef.current.grupoId) : Promise.resolve([]),
      ])
      setCards(cardsData)
      setTags(tagsData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch kanban board'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queryRef.current = query
    refetch()
  }, [queryKey, refetch])

  const createCard = useCallback(
    async (data: CreateCardDto): Promise<KanbanCard> => {
      const card = await kanbanService.createCard(data)
      await refetch()
      return card
    },
    [refetch]
  )

  const updateCard = useCallback(
    async (id: string, data: UpdateCardDto): Promise<KanbanCard> => {
      const card = await kanbanService.updateCard(id, data)
      await refetch()
      return card
    },
    [refetch]
  )

  const moveCard = useCallback(
    async (id: string, status: string): Promise<KanbanCard> => {
      const card = await kanbanService.moveCard(id, status)
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      return card
    },
    []
  )

  const assignCard = useCallback(
    async (id: string, assigneeId: string | null): Promise<KanbanCard> => {
      const card = await kanbanService.assignCard(id, assigneeId)
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, assigneeId } : c)))
      return card
    },
    []
  )

  const deleteCard = useCallback(
    async (id: string, hard?: boolean): Promise<void> => {
      await kanbanService.deleteCard(id, hard)
      setCards((prev) => prev.filter((c) => c.id !== id))
    },
    []
  )

  const addTag = useCallback(
    async (cardId: string, name: string, grupoId: string, color?: string): Promise<KanbanCard> => {
      const card = await kanbanService.addTag(cardId, name, grupoId, color)
      await refetch()
      return card
    },
    [refetch]
  )

  const removeTag = useCallback(
    async (cardId: string, tagId: string): Promise<KanbanCard> => {
      const card = await kanbanService.removeTag(cardId, tagId)
      await refetch()
      return card
    },
    [refetch]
  )

  const addLink = useCallback(
    async (cardId: string, title: string, url: string): Promise<KanbanCard> => {
      const card = await kanbanService.addLink(cardId, title, url)
      await refetch()
      return card
    },
    [refetch]
  )

  const removeLink = useCallback(
    async (cardId: string, linkId: string): Promise<KanbanCard> => {
      const card = await kanbanService.removeLink(cardId, linkId)
      await refetch()
      return card
    },
    [refetch]
  )

  const addComment = useCallback(
    async (cardId: string, content: string): Promise<KanbanCard> => {
      const card = await kanbanService.addComment(cardId, content)
      await refetch()
      return card
    },
    [refetch]
  )

  return {
    cards,
    tags,
    isLoading,
    error,
    refetch,
    createCard,
    updateCard,
    moveCard,
    assignCard,
    deleteCard,
    addTag,
    removeTag,
    addLink,
    removeLink,
    addComment,
  }
}
