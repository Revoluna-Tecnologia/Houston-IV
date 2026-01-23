/**
 * Messages Service
 * Gerencia mensagens de chat
 */

import { apiClient } from '../api-client';
import type {
  Message,
  SendMessageDto,
  MessageQueryDto,
  CursorPaginatedResponse,
} from './types';

const BASE_PATH = '/messages';

class MessagesService {
  /**
   * Lista mensagens de uma conversa com paginacao por cursor
   */
  async getByConversation(
    conversationId: string,
    params?: MessageQueryDto
  ): Promise<CursorPaginatedResponse<Message>> {
    return apiClient.get<CursorPaginatedResponse<Message>>(
      `${BASE_PATH}/conversation/${conversationId}`,
      params as Record<string, unknown>
    );
  }

  /**
   * Busca uma mensagem por ID
   */
  async getById(id: string): Promise<Message> {
    return apiClient.get<Message>(`${BASE_PATH}/${id}`);
  }

  /**
   * Envia uma nova mensagem
   */
  async send(data: SendMessageDto): Promise<Message> {
    return apiClient.post<Message>(BASE_PATH, data);
  }

  /**
   * Marca mensagens como lidas
   */
  async markAsRead(conversationId: string): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/conversation/${conversationId}/read`);
  }

  /**
   * Deleta uma mensagem (soft delete)
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  }

  /**
   * Adiciona uma reacao a uma mensagem
   */
  async react(id: string, emoji: string): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/${id}/react`, { emoji });
  }

  /**
   * Remove uma reacao de uma mensagem
   */
  async removeReaction(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}/react`);
  }

  /**
   * Faz upload de arquivo e retorna a URL
   */
  async uploadMedia(file: File): Promise<{ url: string; mimeType: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${BASE_PATH}/upload`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  }

  /**
   * Busca mensagens por termo
   */
  async search(
    conversationId: string,
    query: string
  ): Promise<Message[]> {
    return apiClient.get<Message[]>(
      `${BASE_PATH}/conversation/${conversationId}/search`,
      { query }
    );
  }
}

export const messagesService = new MessagesService();
