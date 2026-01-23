import { apiClient } from './api-client';
import type { Hospital, PaginatedResponse, QueryParams, CreateHospitalDto, UpdateHospitalDto } from './types';

class HospitaisService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Hospital>> {
    return apiClient.get<PaginatedResponse<Hospital>>('/hospitais', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Hospital> {
    return apiClient.get<Hospital>(`/hospitais/${id}`);
  }

  async create(data: CreateHospitalDto): Promise<Hospital> {
    return apiClient.post<Hospital>('/hospitais', data);
  }

  async update(id: string, data: UpdateHospitalDto): Promise<Hospital> {
    return apiClient.put<Hospital>(`/hospitais/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/hospitais/${id}`);
  }
}

export const hospitaisService = new HospitaisService();
export { HospitaisService };
