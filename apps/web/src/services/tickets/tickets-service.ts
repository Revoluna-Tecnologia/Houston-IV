import { apiClient } from '../api-client'
import type {
  Ticket,
  CreateTicketDto,
  UpdateTicketDto,
  TicketQueryParams,
  TicketsPaginatedResponse,
  TicketStatus,
} from './types'

const BASE_PATH = '/tickets'

export const ticketsService = {
  async getAll(params?: TicketQueryParams): Promise<TicketsPaginatedResponse<Ticket>> {
    return apiClient.get<TicketsPaginatedResponse<Ticket>>(BASE_PATH, params as Record<string, unknown>)
  },

  async getById(id: string): Promise<Ticket> {
    return apiClient.get<Ticket>(`${BASE_PATH}/${id}`)
  },

  async create(data: CreateTicketDto): Promise<Ticket> {
    return apiClient.post<Ticket>(BASE_PATH, data)
  },

  async update(id: string, data: UpdateTicketDto): Promise<Ticket> {
    return apiClient.put<Ticket>(`${BASE_PATH}/${id}`, data)
  },

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return apiClient.patch<Ticket>(`${BASE_PATH}/${id}/status`, { status })
  },

  async assign(id: string, assignedToId: string | null): Promise<Ticket> {
    return apiClient.patch<Ticket>(`${BASE_PATH}/${id}/assign`, { assignedToId })
  },

  async archive(id: string): Promise<Ticket> {
    return apiClient.patch<Ticket>(`${BASE_PATH}/${id}/archive`, {})
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`)
  },
}
