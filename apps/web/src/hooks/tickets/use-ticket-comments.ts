'use client'

import { useState, useEffect, useCallback } from 'react'
import { commentsService, type TicketComment, type CreateCommentDto } from '../../services/tickets'

interface UseTicketCommentsReturn {
  data: TicketComment[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  create: (data: CreateCommentDto) => Promise<TicketComment>
  update: (commentId: string, content: string) => Promise<TicketComment>
  remove: (commentId: string) => Promise<void>
}

export function useTicketComments(ticketId: string): UseTicketCommentsReturn {
  const [data, setData] = useState<TicketComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await commentsService.getAll(ticketId)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comments'))
    } finally {
      setIsLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const create = useCallback(
    async (createData: CreateCommentDto): Promise<TicketComment> => {
      const comment = await commentsService.create(ticketId, createData)
      await refetch()
      return comment
    },
    [ticketId, refetch]
  )

  const update = useCallback(
    async (commentId: string, content: string): Promise<TicketComment> => {
      const comment = await commentsService.update(ticketId, commentId, content)
      await refetch()
      return comment
    },
    [ticketId, refetch]
  )

  const remove = useCallback(
    async (commentId: string): Promise<void> => {
      await commentsService.delete(ticketId, commentId)
      await refetch()
    },
    [ticketId, refetch]
  )

  return { data, isLoading, error, refetch, create, update, remove }
}
