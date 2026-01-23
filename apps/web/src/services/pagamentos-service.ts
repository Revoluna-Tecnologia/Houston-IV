import { apiClient } from './api-client';
import type { Pagamento, PaginatedResponse, QueryParams, CreatePagamentoDto, UpdatePagamentoDto, BulkOperationResult } from './types';

class PagamentosService {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Pagamento>> {
    return apiClient.get<PaginatedResponse<Pagamento>>('/pagamentos', params as Record<string, unknown>);
  }

  async getById(id: string): Promise<Pagamento> {
    return apiClient.get<Pagamento>(`/pagamentos/${id}`);
  }

  async create(data: CreatePagamentoDto): Promise<Pagamento> {
    return apiClient.post<Pagamento>('/pagamentos', data);
  }

  async update(id: string, data: UpdatePagamentoDto): Promise<Pagamento> {
    return apiClient.put<Pagamento>(`/pagamentos/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/pagamentos/${id}`);
  }

  async autorizar(id: string): Promise<Pagamento> {
    return apiClient.patch<Pagamento>(`/pagamentos/${id}/autorizar`);
  }

  async pagar(id: string): Promise<Pagamento> {
    return apiClient.patch<Pagamento>(`/pagamentos/${id}/pagar`);
  }

  async bulkAutorizar(ids: string[]): Promise<BulkOperationResult> {
    return apiClient.patch<BulkOperationResult>('/pagamentos/bulk/autorizar', { ids });
  }

  async bulkPagar(ids: string[]): Promise<BulkOperationResult> {
    return apiClient.patch<BulkOperationResult>('/pagamentos/bulk/pagar', { ids });
  }
}

export const pagamentosService = new PagamentosService();
export { PagamentosService };
