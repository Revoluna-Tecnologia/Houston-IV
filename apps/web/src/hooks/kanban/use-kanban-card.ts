'use client'

import { useState, useEffect, useCallback } from 'react'
import { kanbanService, type KanbanCard, type UpdateCardDto } from '../../services/kanban'

interface UseKanbanCardReturn {
  data: KanbanCard | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  update: (data: UpdateCardDto) => Promise<KanbanCard>
  move: (status: string) => Promise<KanbanCard>
  assign: (assigneeId: string | null) => Promise<KanbanCard>
  addTag: (name: string, grupoId: string, color?: string) => Promise<KanbanCard>
  removeTag: (tagId: string) => Promise<KanbanCard>
  addLink: (title: string, url: string) => Promise<KanbanCard>
  removeLink: (linkId: string) => Promise<KanbanCard>
  addComment: (content: string) => Promise<KanbanCard>
}

export function useKanbanCard(id: string): UseKanbanCardReturn {
  const [data, setData] = useState<KanbanCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const card = await kanbanService.getCardById(id)
      setData(card)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch card'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const update = useCallback(
    async (updateData: UpdateCardDto): Promise<KanbanCard> => {
      const card = await kanbanService.updateCard(id, updateData)
      setData(card)
      return card
    },
    [id]
  )

  const move = useCallback(
    async (status: string): Promise<KanbanCard> => {
      const card = await kanbanService.moveCard(id, status)
      setData(card)
      return card
    },
    [id]
  )

  const assign = useCallback(
    async (assigneeId: string | null): Promise<KanbanCard> => {
      const card = await kanbanService.assignCard(id, assigneeId)
      setData(card)
      return card
    },
    [id]
  )

  const addTag = useCallback(
    async (name: string, grupoId: string, color?: string): Promise<KanbanCard> => {
      const card = await kanbanService.addTag(id, name, grupoId, color)
      setData(card)
      return card
    },
    [id]
  )

  const removeTag = useCallback(
    async (tagId: string): Promise<KanbanCard> => {
      const card = await kanbanService.removeTag(id, tagId)
      setData(card)
      return card
    },
    [id]
  )

  const addLink = useCallback(
    async (title: string, url: string): Promise<KanbanCard> => {
      const card = await kanbanService.addLink(id, title, url)
      setData(card)
      return card
    },
    [id]
  )

  const removeLink = useCallback(
    async (linkId: string): Promise<KanbanCard> => {
      const card = await kanbanService.removeLink(id, linkId)
      setData(card)
      return card
    },
    [id]
  )

  const addComment = useCallback(
    async (content: string): Promise<KanbanCard> => {
      const card = await kanbanService.addComment(id, content)
      setData(card)
      return card
    },
    [id]
  )

  return {
    data,
    isLoading,
    error,
    refetch,
    update,
    move,
    assign,
    addTag,
    removeTag,
    addLink,
    removeLink,
    addComment,
  }
}
