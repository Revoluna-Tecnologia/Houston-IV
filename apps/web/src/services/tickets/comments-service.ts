import { apiClient } from '../api-client'
import type { TicketComment, CreateCommentDto, TicketsPaginatedResponse } from './types'

const getBasePath = (ticketId: string) => `/tickets/${ticketId}/comments`

export const commentsService = {
  async getAll(ticketId: string): Promise<TicketsPaginatedResponse<TicketComment>> {
    return apiClient.get<TicketsPaginatedResponse<TicketComment>>(getBasePath(ticketId))
  },

  async create(ticketId: string, data: CreateCommentDto): Promise<TicketComment> {
    return apiClient.post<TicketComment>(getBasePath(ticketId), data)
  },

  async update(ticketId: string, commentId: string, content: string): Promise<TicketComment> {
    return apiClient.put<TicketComment>(`${getBasePath(ticketId)}/${commentId}`, { content })
  },

  async delete(ticketId: string, commentId: string): Promise<void> {
    return apiClient.delete<void>(`${getBasePath(ticketId)}/${commentId}`)
  },
}
