'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ticketsService,
  type Ticket,
  type TicketQueryParams,
  type CreateTicketDto,
  type UpdateTicketDto,
  type TicketStatus,
  type TicketsPaginatedResponse,
} from '../../services/tickets'

interface UseTicketsReturn {
  data: Ticket[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  create: (data: CreateTicketDto) => Promise<Ticket>
  update: (id: string, data: UpdateTicketDto) => Promise<Ticket>
  updateStatus: (id: string, status: TicketStatus) => Promise<Ticket>
  assign: (id: string, assigneeId: string | null) => Promise<Ticket>
  archive: (id: string) => Promise<Ticket>
  remove: (id: string) => Promise<void>
}

const defaultPagination = { total: 0, page: 1, totalPages: 0 }

export function useTickets(query?: TicketQueryParams): UseTicketsReturn {
  const [data, setData] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState(defaultPagination)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const queryRef = useRef(query)
  const queryKey = JSON.stringify(query)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response: TicketsPaginatedResponse<Ticket> = await ticketsService.getAll(queryRef.current)
      setData(response.data)
      setPagination({ total: response.total, page: response.page, totalPages: response.totalPages })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tickets'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queryRef.current = query
    refetch()
  }, [queryKey, refetch])

  const create = useCallback(
    async (createData: CreateTicketDto): Promise<Ticket> => {
      const ticket = await ticketsService.create(createData)
      await refetch()
      return ticket
    },
    [refetch]
  )

  const update = useCallback(
    async (id: string, updateData: UpdateTicketDto): Promise<Ticket> => {
      const ticket = await ticketsService.update(id, updateData)
      await refetch()
      return ticket
    },
    [refetch]
  )

  const updateStatus = useCallback(
    async (id: string, status: TicketStatus): Promise<Ticket> => {
      const ticket = await ticketsService.updateStatus(id, status)
      await refetch()
      return ticket
    },
    [refetch]
  )

  const assign = useCallback(
    async (id: string, assigneeId: string | null): Promise<Ticket> => {
      const ticket = await ticketsService.assign(id, assigneeId)
      await refetch()
      return ticket
    },
    [refetch]
  )

  const archive = useCallback(
    async (id: string): Promise<Ticket> => {
      const ticket = await ticketsService.archive(id)
      await refetch()
      return ticket
    },
    [refetch]
  )

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await ticketsService.delete(id)
      await refetch()
    },
    [refetch]
  )

  return {
    data,
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
    isLoading,
    error,
    refetch,
    create,
    update,
    updateStatus,
    assign,
    archive,
    remove,
  }
}
