/**
 * Conversations Service
 * Gerencia conversas (chats diretos e grupos)
 */

import { apiClient } from '../api-client';
import type {
  Conversation,
  CreateConversationDto,
  UpdateConversationDto,
  AddParticipantDto,
  ConversationQueryDto,
  PaginatedResponse,
  Participant,
} from './types';

const BASE_PATH = '/conversations';

class ConversationsService {
  /**
   * Lista todas as conversas do usuario
   */
  async getAll(params?: ConversationQueryDto): Promise<PaginatedResponse<Conversation>> {
    return apiClient.get<PaginatedResponse<Conversation>>(BASE_PATH, params as Record<string, unknown>);
  }

  /**
   * Busca uma conversa por ID
   */
  async getById(id: string): Promise<Conversation> {
    return apiClient.get<Conversation>(`${BASE_PATH}/${id}`);
  }

  /**
   * Cria uma nova conversa
   */
  async create(data: CreateConversationDto): Promise<Conversation> {
    return apiClient.post<Conversation>(BASE_PATH, data);
  }

  /**
   * Atualiza uma conversa (nome do grupo)
   */
  async update(id: string, data: UpdateConversationDto): Promise<Conversation> {
    return apiClient.patch<Conversation>(`${BASE_PATH}/${id}`, data);
  }

  /**
   * Arquiva ou desarquiva uma conversa
   */
  async archive(id: string, archive: boolean): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/${id}/archive`, { archive });
  }

  /**
   * Deleta uma conversa
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  }

  /**
   * Adiciona um participante a uma conversa de grupo
   */
  async addParticipant(conversationId: string, data: AddParticipantDto): Promise<Participant> {
    return apiClient.post<Participant>(`${BASE_PATH}/${conversationId}/participants`, data);
  }

  /**
   * Remove um participante de uma conversa de grupo
   */
  async removeParticipant(conversationId: string, participantId: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${conversationId}/participants/${participantId}`);
  }

  /**
   * Lista participantes de uma conversa
   */
  async getParticipants(conversationId: string): Promise<Participant[]> {
    return apiClient.get<Participant[]>(`${BASE_PATH}/${conversationId}/participants`);
  }

  /**
   * Atualiza role de um participante
   */
  async updateParticipantRole(
    conversationId: string,
    participantId: string,
    role: 'admin' | 'member'
  ): Promise<Participant> {
    return apiClient.patch<Participant>(
      `${BASE_PATH}/${conversationId}/participants/${participantId}`,
      { role }
    );
  }

  /**
   * Silencia/desilencia notificacoes de uma conversa
   */
  async mute(conversationId: string, mute: boolean): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/${conversationId}/mute`, { mute });
  }
}

export const conversationsService = new ConversationsService();
