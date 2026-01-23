/**
 * WhatsApp Service
 * Gerencia instancias WhatsApp
 */

import { apiClient } from '../api-client';
import type {
  WhatsAppInstance,
  CreateWhatsAppInstanceDto,
  QRCodeResponse,
  PairingCodeResponse,
  ConnectionStatusResponse,
} from './types';

const BASE_PATH = '/whatsapp/instances';

class WhatsAppService {
  /**
   * Lista todas as instancias do grupo
   */
  async getAll(): Promise<WhatsAppInstance[]> {
    return apiClient.get<WhatsAppInstance[]>(BASE_PATH);
  }

  /**
   * Busca instancia por ID
   */
  async getById(id: string): Promise<WhatsAppInstance> {
    return apiClient.get<WhatsAppInstance>(`${BASE_PATH}/${id}`);
  }

  /**
   * Busca instancia do grupo atual
   */
  async getByGrupo(grupoId: string): Promise<WhatsAppInstance | null> {
    try {
      return await apiClient.get<WhatsAppInstance>(`${BASE_PATH}/grupo/${grupoId}`);
    } catch {
      return null;
    }
  }

  /**
   * Cria uma nova instancia WhatsApp
   */
  async create(data: CreateWhatsAppInstanceDto): Promise<WhatsAppInstance> {
    return apiClient.post<WhatsAppInstance>(BASE_PATH, data);
  }

  /**
   * Deleta uma instancia
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  }

  /**
   * Obtem QR Code para conexao
   */
  async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    return apiClient.get<QRCodeResponse>(`${BASE_PATH}/${instanceId}/qr`);
  }

  /**
   * Obtem codigo de pareamento (alternativa ao QR)
   */
  async getPairingCode(instanceId: string, phoneNumber: string): Promise<PairingCodeResponse> {
    return apiClient.post<PairingCodeResponse>(`${BASE_PATH}/${instanceId}/pairing-code`, {
      phoneNumber,
    });
  }

  /**
   * Verifica status da conexao
   */
  async getConnectionStatus(instanceId: string): Promise<ConnectionStatusResponse> {
    return apiClient.get<ConnectionStatusResponse>(`${BASE_PATH}/${instanceId}/status`);
  }

  /**
   * Conecta a instancia (inicia sessao)
   */
  async connect(instanceId: string): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/${instanceId}/connect`);
  }

  /**
   * Desconecta a instancia (encerra sessao)
   */
  async disconnect(instanceId: string): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/${instanceId}/disconnect`);
  }

  /**
   * Reinicia a instancia
   */
  async restart(instanceId: string): Promise<void> {
    return apiClient.post<void>(`${BASE_PATH}/${instanceId}/restart`);
  }

  /**
   * Atualiza webhook URL
   */
  async updateWebhook(instanceId: string, webhookUrl: string): Promise<void> {
    return apiClient.patch<void>(`${BASE_PATH}/${instanceId}`, { webhookUrl });
  }
}

export const whatsappService = new WhatsAppService();
