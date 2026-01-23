import { apiClient } from './api-client';
import type { Candidatura, PaginatedResponse, QueryParams, CreateCandidaturaDto } from './types';

class CandidaturasService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Candidatura>> {
    return apiClient.get<PaginatedResponse<Candidatura>>('/candidaturas', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Candidatura> {
    return apiClient.get<Candidatura>(`/candidaturas/${id}`);
  }

  async create(data: CreateCandidaturaDto): Promise<Candidatura> {
    return apiClient.post<Candidatura>('/candidaturas', data);
  }

  async aprovar(id: string): Promise<Candidatura> {
    return apiClient.patch<Candidatura>(`/candidaturas/${id}/aprovar`);
  }

  async rejeitar(id: string): Promise<Candidatura> {
    return apiClient.patch<Candidatura>(`/candidaturas/${id}/rejeitar`);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/candidaturas/${id}`);
  }
}

export const candidaturasService = new CandidaturasService();
export { CandidaturasService };
