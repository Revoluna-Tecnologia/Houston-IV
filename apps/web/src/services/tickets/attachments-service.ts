import { apiClient } from '../api-client'
import type { TicketAttachment, CreateAttachmentDto } from './types'

const getBasePath = (ticketId: string) => `/tickets/${ticketId}/attachments`

export const attachmentsService = {
  async getAll(ticketId: string): Promise<TicketAttachment[]> {
    return apiClient.get<TicketAttachment[]>(getBasePath(ticketId))
  },

  async create(ticketId: string, data: CreateAttachmentDto): Promise<TicketAttachment> {
    return apiClient.post<TicketAttachment>(getBasePath(ticketId), data)
  },

  async delete(ticketId: string, attachmentId: string): Promise<{ key: string }> {
    return apiClient.delete<{ key: string }>(`${getBasePath(ticketId)}/${attachmentId}`)
  },
}
