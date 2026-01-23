import { apiClient } from './api-client';
import type { Vaga, VagaStatus, PaginatedResponse, QueryParams, CreateVagaDto, UpdateVagaDto } from './types';

class VagasService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Vaga>> {
    return apiClient.get<PaginatedResponse<Vaga>>('/vagas', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Vaga> {
    return apiClient.get<Vaga>(`/vagas/${id}`);
  }

  async create(data: CreateVagaDto): Promise<Vaga> {
    return apiClient.post<Vaga>('/vagas', data);
  }

  async update(id: string, data: UpdateVagaDto): Promise<Vaga> {
    return apiClient.put<Vaga>(`/vagas/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/vagas/${id}`);
  }

  async updateStatus(id: string, status: VagaStatus): Promise<Vaga> {
    return apiClient.patch<Vaga>(`/vagas/${id}/status`, { status });
  }

  async createBulk(data: CreateVagaDto[]): Promise<Vaga[]> {
    return apiClient.post<Vaga[]>('/vagas/bulk', data);
  }
}

export const vagasService = new VagasService();
export { VagasService };
