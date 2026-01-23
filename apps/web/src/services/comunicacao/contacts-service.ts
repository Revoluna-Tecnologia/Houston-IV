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
  PaginatedResponse,
} from './types';

const BASE_PATH = '/contacts';

class ContactsService {
  /**
   * Lista todos os contatos
   */
  async getAll(params?: ContactQueryDto): Promise<PaginatedResponse<Contact>> {
    return apiClient.get<PaginatedResponse<Contact>>(BASE_PATH, params as Record<string, unknown>);
  }

  /**
   * Busca um contato por ID
   */
  async getById(id: string): Promise<Contact> {
    return apiClient.get<Contact>(`${BASE_PATH}/${id}`);
  }

  /**
   * Busca um contato por numero de telefone
   */
  async getByPhone(phoneNumber: string): Promise<Contact | null> {
    try {
      return await apiClient.get<Contact>(`${BASE_PATH}/phone/${encodeURIComponent(phoneNumber)}`);
    } catch {
      return null;
    }
  }

  /**
   * Cria um novo contato
   */
  async create(data: CreateContactDto): Promise<Contact> {
    return apiClient.post<Contact>(BASE_PATH, data);
  }

  /**
   * Atualiza um contato
   */
  async update(id: string, data: UpdateContactDto): Promise<Contact> {
    return apiClient.patch<Contact>(`${BASE_PATH}/${id}`, data);
  }

  /**
   * Deleta um contato
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  }

  /**
   * Marca/desmarca contato como favorito
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<Contact> {
    return apiClient.patch<Contact>(`${BASE_PATH}/${id}`, { isFavorite });
  }

  /**
   * Bloqueia/desbloqueia um contato
   */
  async toggleBlock(id: string, isBlocked: boolean): Promise<Contact> {
    return apiClient.patch<Contact>(`${BASE_PATH}/${id}`, { isBlocked });
  }

  /**
   * Importa contatos de medicos do grupo
   */
  async importFromMedicos(): Promise<{ imported: number }> {
    return apiClient.post<{ imported: number }>(`${BASE_PATH}/import-medicos`);
  }
}

export const contactsService = new ContactsService();
