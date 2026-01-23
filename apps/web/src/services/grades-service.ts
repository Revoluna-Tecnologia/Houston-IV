import { apiClient } from './api-client';
import type { Grade, Vaga, PaginatedResponse, QueryParams, CreateGradeDto, UpdateGradeDto, CreateTimeSlotDto } from './types';

class GradesService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Grade>> {
    return apiClient.get<PaginatedResponse<Grade>>('/grades', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Grade> {
    return apiClient.get<Grade>(`/grades/${id}`);
  }

  async create(data: CreateGradeDto): Promise<Grade> {
    return apiClient.post<Grade>('/grades', data);
  }

  async update(id: string, data: UpdateGradeDto): Promise<Grade> {
    return apiClient.put<Grade>(`/grades/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/grades/${id}`);
  }

  async addTimeSlots(gradeId: string, slots: CreateTimeSlotDto[]): Promise<Grade> {
    return apiClient.post<Grade>(`/grades/${gradeId}/slots`, { slots });
  }

  async publish(id: string): Promise<Grade> {
    return apiClient.patch<Grade>(`/grades/${id}/publish`);
  }

  async generateVagas(id: string): Promise<Vaga[]> {
    return apiClient.post<Vaga[]>(`/grades/${id}/generate-vagas`);
  }
}

export const gradesService = new GradesService();
export { GradesService };
