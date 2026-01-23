'use client'

import { useState, useEffect, useCallback } from 'react'
import { ticketsService, type Ticket, type UpdateTicketDto, type TicketStatus } from '../../services/tickets'

interface UseTicketReturn {
  data: Ticket | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  update: (data: UpdateTicketDto) => Promise<Ticket>
  updateStatus: (status: TicketStatus) => Promise<Ticket>
  assign: (assigneeId: string | null) => Promise<Ticket>
  archive: () => Promise<Ticket>
}

export function useTicket(id: string): UseTicketReturn {
  const [data, setData] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const ticket = await ticketsService.getById(id)
      setData(ticket)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch ticket'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const update = useCallback(
    async (updateData: UpdateTicketDto): Promise<Ticket> => {
      const ticket = await ticketsService.update(id, updateData)
      setData(ticket)
      return ticket
    },
    [id]
  )

  const updateStatus = useCallback(
    async (status: TicketStatus): Promise<Ticket> => {
      const ticket = await ticketsService.updateStatus(id, status)
      setData(ticket)
      return ticket
    },
    [id]
  )

  const assign = useCallback(
    async (assigneeId: string | null): Promise<Ticket> => {
      const ticket = await ticketsService.assign(id, assigneeId)
      setData(ticket)
      return ticket
    },
    [id]
  )

  const archive = useCallback(async (): Promise<Ticket> => {
    const ticket = await ticketsService.archive(id)
    setData(ticket)
    return ticket
  }, [id])

  return { data, isLoading, error, refetch, update, updateStatus, assign, archive }
}
