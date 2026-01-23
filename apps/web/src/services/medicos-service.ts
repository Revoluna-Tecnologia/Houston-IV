import { apiClient } from './api-client';
import type { Medico, PaginatedResponse, QueryParams, CreateMedicoDto, UpdateMedicoDto } from './types';

class MedicosService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Medico>> {
    return apiClient.get<PaginatedResponse<Medico>>('/medicos', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Medico> {
    return apiClient.get<Medico>(`/medicos/${id}`);
  }

  async create(data: CreateMedicoDto): Promise<Medico> {
    return apiClient.post<Medico>('/medicos', data);
  }

  async update(id: string, data: UpdateMedicoDto): Promise<Medico> {
    return apiClient.put<Medico>(`/medicos/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/medicos/${id}`);
  }
}

export const medicosService = new MedicosService();
export { MedicosService };
