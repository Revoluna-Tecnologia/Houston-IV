/**
 * Shift Offers Service
 * Gerencia ofertas de plantao via chat
 */

import { apiClient } from '../api-client';
import type {
  ShiftOffer,
  CreateShiftOfferDto,
  RespondShiftOfferDto,
  ShiftOfferQueryDto,
  PaginatedResponse,
} from './types';

const BASE_PATH = '/shift-offers';

class ShiftOffersService {
  /**
   * Lista todas as ofertas de plantao
   */
  async getAll(params?: ShiftOfferQueryDto): Promise<PaginatedResponse<ShiftOffer>> {
    return apiClient.get<PaginatedResponse<ShiftOffer>>(BASE_PATH, params as Record<string, unknown>);
  }

  /**
   * Busca uma oferta por ID
   */
  async getById(id: string): Promise<ShiftOffer> {
    return apiClient.get<ShiftOffer>(`${BASE_PATH}/${id}`);
  }

  /**
   * Cria uma nova oferta de plantao
   */
  async create(data: CreateShiftOfferDto): Promise<ShiftOffer> {
    return apiClient.post<ShiftOffer>(BASE_PATH, data);
  }

  /**
   * Responde a uma oferta (aceitar ou rejeitar)
   */
  async respond(id: string, data: RespondShiftOfferDto): Promise<ShiftOffer> {
    return apiClient.post<ShiftOffer>(`${BASE_PATH}/${id}/respond`, data);
  }

  /**
   * Cancela uma oferta pendente
   */
  async cancel(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  }

  /**
   * Lista ofertas enviadas pelo usuario
   */
  async getSent(params?: ShiftOfferQueryDto): Promise<PaginatedResponse<ShiftOffer>> {
    return apiClient.get<PaginatedResponse<ShiftOffer>>(`${BASE_PATH}/sent`, params as Record<string, unknown>);
  }

  /**
   * Lista ofertas recebidas pelo usuario
   */
  async getReceived(params?: ShiftOfferQueryDto): Promise<PaginatedResponse<ShiftOffer>> {
    return apiClient.get<PaginatedResponse<ShiftOffer>>(`${BASE_PATH}/received`, params as Record<string, unknown>);
  }

  /**
   * Reenvia uma oferta expirada
   */
  async resend(id: string): Promise<ShiftOffer> {
    return apiClient.post<ShiftOffer>(`${BASE_PATH}/${id}/resend`);
  }
}

export const shiftOffersService = new ShiftOffersService();
