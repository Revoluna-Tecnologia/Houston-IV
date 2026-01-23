import { apiClient } from '../api-client'
import type { TicketAnalytics, AnalyticsQueryParams } from './types'

const BASE_PATH = '/tickets/analytics'

export const analyticsService = {
  async getAnalytics(params?: AnalyticsQueryParams): Promise<TicketAnalytics> {
    return apiClient.get<TicketAnalytics>(BASE_PATH, params as Record<string, unknown>)
  },
}
