import { apiClient } from './api-client';
import type { Escalista, PaginatedResponse, QueryParams, BulkOperationResult, EscalistaStatus } from './types';

export interface CreateEscalistaDto {
  medicoId: string;
  grupoId: string;
}

export interface UpdateEscalistaDto {
  status?: EscalistaStatus;
}

class EscalistasService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Escalista>> {
    return apiClient.get<PaginatedResponse<Escalista>>('/escalistas', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Escalista> {
    return apiClient.get<Escalista>(`/escalistas/${id}`);
  }

  async create(data: CreateEscalistaDto): Promise<Escalista> {
    return apiClient.post<Escalista>('/escalistas', data);
  }

  async update(id: string, data: UpdateEscalistaDto): Promise<Escalista> {
    return apiClient.put<Escalista>(`/escalistas/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/escalistas/${id}`);
  }

  async ativar(id: string): Promise<Escalista> {
    return apiClient.post<Escalista>(`/escalistas/${id}/ativar`);
  }

  async inativar(id: string): Promise<Escalista> {
    return apiClient.post<Escalista>(`/escalistas/${id}/inativar`);
  }

  async bulkAtivar(ids: string[]): Promise<BulkOperationResult> {
    return apiClient.post<BulkOperationResult>('/escalistas/bulk/ativar', { ids });
  }

  async bulkInativar(ids: string[]): Promise<BulkOperationResult> {
    return apiClient.post<BulkOperationResult>('/escalistas/bulk/inativar', { ids });
  }
}

export const escalistasService = new EscalistasService();
export { EscalistasService };
