import { apiClient } from './api-client';
import type { User, UserRole, PaginatedResponse, QueryParams } from './types';

export interface CreateUserDto {
  email: string;
  password: string;
  nome: string;
  role: UserRole;
  grupoIds?: string[];
}

export interface UpdateUserDto {
  nome?: string;
  role?: UserRole;
  grupoIds?: string[];
  ativo?: boolean;
}

class UsersService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>('/users', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async create(data: CreateUserDto): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }

  async activate(id: string): Promise<User> {
    return apiClient.post<User>(`/users/${id}/activate`);
  }

  async deactivate(id: string): Promise<User> {
    return apiClient.post<User>(`/users/${id}/deactivate`);
  }
}

export const usersService = new UsersService();
export { UsersService };
