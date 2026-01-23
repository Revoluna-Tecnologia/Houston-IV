import { apiClient } from '../api-client'
import type { KanbanCard, CreateCardDto, UpdateCardDto, KanbanQueryParams, KanbanTag } from './types'

const BASE_PATH = '/kanban'

export const kanbanService = {
  async getCards(params?: KanbanQueryParams): Promise<KanbanCard[]> {
    return apiClient.get<KanbanCard[]>(`${BASE_PATH}/cards`, params as Record<string, unknown>)
  },

  async getCardById(id: string): Promise<KanbanCard> {
    return apiClient.get<KanbanCard>(`${BASE_PATH}/cards/${id}`)
  },

  async createCard(data: CreateCardDto): Promise<KanbanCard> {
    return apiClient.post<KanbanCard>(`${BASE_PATH}/cards`, data)
  },

  async updateCard(id: string, data: UpdateCardDto): Promise<KanbanCard> {
    return apiClient.put<KanbanCard>(`${BASE_PATH}/cards/${id}`, data)
  },

  async moveCard(id: string, status: string): Promise<KanbanCard> {
    return apiClient.patch<KanbanCard>(`${BASE_PATH}/cards/${id}/move`, { status })
  },

  async assignCard(id: string, assigneeId: string | null): Promise<KanbanCard> {
    return apiClient.patch<KanbanCard>(`${BASE_PATH}/cards/${id}/assign`, { assigneeId })
  },

  async deleteCard(id: string, hard?: boolean): Promise<void> {
    const path = hard ? `${BASE_PATH}/cards/${id}?hard=true` : `${BASE_PATH}/cards/${id}`
    return apiClient.delete<void>(path)
  },

  async addTag(cardId: string, name: string, grupoId: string, color?: string): Promise<KanbanCard> {
    return apiClient.post<KanbanCard>(`${BASE_PATH}/cards/${cardId}/tags`, { name, grupoId, color })
  },

  async removeTag(cardId: string, tagId: string): Promise<KanbanCard> {
    return apiClient.delete<KanbanCard>(`${BASE_PATH}/cards/${cardId}/tags/${tagId}`)
  },

  async getTags(grupoId: string): Promise<KanbanTag[]> {
    return apiClient.get<KanbanTag[]>(`${BASE_PATH}/tags`, { grupoId })
  },

  async addLink(cardId: string, title: string, url: string): Promise<KanbanCard> {
    return apiClient.post<KanbanCard>(`${BASE_PATH}/cards/${cardId}/links`, { title, url })
  },

  async removeLink(cardId: string, linkId: string): Promise<KanbanCard> {
    return apiClient.delete<KanbanCard>(`${BASE_PATH}/cards/${cardId}/links/${linkId}`)
  },

  async addComment(cardId: string, content: string): Promise<KanbanCard> {
    return apiClient.post<KanbanCard>(`${BASE_PATH}/cards/${cardId}/comments`, { content })
  },
}
