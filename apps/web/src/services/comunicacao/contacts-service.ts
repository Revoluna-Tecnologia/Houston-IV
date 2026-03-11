/**
 * Contacts Service
 * Gerencia contatos salvos
 */

import { apiClient } from '../api-client';
import type {
  Contact,
  CreateContactDto,
  UpdateContactDto,
  ContactQueryDto,
  ContactListResponse,
} from './types';

const BASE_PATH = '/contacts';

class ContactsService {
  /**
   * Lista todos os contatos
   */
  async getAll(params?: ContactQueryDto): Promise<ContactListResponse> {
    return apiClient.get<ContactListResponse>(BASE_PATH, params as Record<string, unknown>);
  }

  /**
   * Busca um contato por ID
   */
  async getById(id: string): Promise<Contact> {
    return apiClient.get<Contact>(`${BASE_PATH}/${id}`);
  }

  /**
   * Cria um novo contato
   */
  async create(data: CreateContactDto): Promise<Contact> {
    return apiClient.post<Contact>(BASE_PATH, data);
  }

  /**
   * Atualiza um contato (PUT)
   */
  async update(id: string, data: UpdateContactDto): Promise<Contact> {
    return apiClient.put<Contact>(`${BASE_PATH}/${id}`, data);
  }

  /**
   * Deleta um contato
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  }

  /**
   * Alterna favorito (PATCH /contacts/:id/favorite)
   */
  async toggleFavorite(id: string): Promise<Contact> {
    return apiClient.patch<Contact>(`${BASE_PATH}/${id}/favorite`);
  }

  /**
   * Alterna bloqueio (PATCH /contacts/:id/block)
   */
  async toggleBlock(id: string): Promise<Contact> {
    return apiClient.patch<Contact>(`${BASE_PATH}/${id}/block`);
  }
}

export const contactsService = new ContactsService();
