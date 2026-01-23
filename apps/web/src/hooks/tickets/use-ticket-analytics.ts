'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { analyticsService, type TicketAnalytics, type AnalyticsQueryParams } from '../../services/tickets'

interface UseTicketAnalyticsReturn {
  data: TicketAnalytics | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useTicketAnalytics(query?: AnalyticsQueryParams): UseTicketAnalyticsReturn {
  const [data, setData] = useState<TicketAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const queryRef = useRef(query)
  const queryKey = JSON.stringify(query)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const analytics = await analyticsService.getAnalytics(queryRef.current)
      setData(analytics)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queryRef.current = query
    refetch()
  }, [queryKey, refetch])

  return { data, isLoading, error, refetch }
}
