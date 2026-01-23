/**
 * WhatsApp Provider Interface
 * Strategy Pattern - Interface base para todos os provedores de WhatsApp
 * Implementações: ZapsterProvider, TwilioProvider, MetaProvider
 */

import {
  ProviderInstance,
  QRCodeResponse,
  PairingCodeResponse,
  SendMessagePayload,
  SendMessageResult,
  ProviderGroup,
  CreateGroupPayload,
  WebhookConfig,
  CreateWebhookPayload,
  ConnectionStatus,
} from '../types'

export interface IWhatsAppProvider {
  /**
   * Identificador do provider
   */
  readonly providerName: string

  // === Instance Management ===

  /**
   * Lista todas as instâncias disponíveis
   */
  listInstances(): Promise<ProviderInstance[]>

  /**
   * Obtém detalhes de uma instância específica
   */
  getInstance(instanceId: string): Promise<ProviderInstance>

  /**
   * Cria uma nova instância
   */
  createInstance(name: string): Promise<ProviderInstance>

  /**
   * Deleta uma instância
   */
  deleteInstance(instanceId: string): Promise<void>

  /**
   * Obtém o status de conexão da instância
   */
  getConnectionStatus(instanceId: string): Promise<ConnectionStatus>

  /**
   * Obtém o QR Code para conexão
   */
  getQRCode(instanceId: string): Promise<QRCodeResponse>

  /**
   * Obtém o código de pareamento (8 dígitos)
   */
  getPairingCode(instanceId: string, phoneNumber: string): Promise<PairingCodeResponse>

  /**
   * Liga a instância
   */
  powerOn(instanceId: string): Promise<void>

  /**
   * Desliga a instância
   */
  powerOff(instanceId: string): Promise<void>

  /**
   * Desconecta o WhatsApp (logout)
   */
  disconnect(instanceId: string): Promise<void>

  // === Messaging ===

  /**
   * Envia uma mensagem de texto
   */
  sendTextMessage(
    instanceId: string,
    to: string,
    text: string,
    replyToId?: string
  ): Promise<SendMessageResult>

  /**
   * Envia uma mensagem com mídia (imagem, vídeo, áudio, documento)
   */
  sendMediaMessage(
    instanceId: string,
    payload: SendMessagePayload
  ): Promise<SendMessageResult>

  /**
   * Envia uma mensagem de template (para WhatsApp Business API)
   */
  sendTemplateMessage?(
    instanceId: string,
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<SendMessageResult>

  /**
   * Envia uma reação a uma mensagem
   */
  sendReaction(
    instanceId: string,
    to: string,
    messageId: string,
    emoji: string
  ): Promise<void>

  /**
   * Remove uma reação de uma mensagem
   */
  removeReaction(
    instanceId: string,
    to: string,
    messageId: string
  ): Promise<void>

  // === Groups ===

  /**
   * Lista todos os grupos da instância
   */
  listGroups(instanceId: string): Promise<ProviderGroup[]>

  /**
   * Obtém detalhes de um grupo
   */
  getGroup(instanceId: string, groupId: string): Promise<ProviderGroup>

  /**
   * Cria um novo grupo
   */
  createGroup(
    instanceId: string,
    payload: CreateGroupPayload
  ): Promise<ProviderGroup>

  /**
   * Adiciona participantes a um grupo
   */
  addGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void>

  /**
   * Remove participantes de um grupo
   */
  removeGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void>

  /**
   * Promove participantes a admin
   */
  promoteGroupParticipants?(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void>

  /**
   * Rebaixa admins para participantes
   */
  demoteGroupParticipants?(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void>

  /**
   * Sai de um grupo
   */
  leaveGroup(instanceId: string, groupId: string): Promise<void>

  // === Webhooks ===

  /**
   * Lista webhooks configurados
   */
  listWebhooks(instanceId: string): Promise<WebhookConfig[]>

  /**
   * Cria um webhook
   */
  createWebhook(
    instanceId: string,
    payload: CreateWebhookPayload
  ): Promise<WebhookConfig>

  /**
   * Deleta um webhook
   */
  deleteWebhook(instanceId: string, webhookId: string): Promise<void>

  /**
   * Valida assinatura de webhook
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean

  // === Utilities ===

  /**
   * Verifica se um número é válido no WhatsApp
   */
  verifyNumber(instanceId: string, phoneNumber: string): Promise<boolean>

  /**
   * Obtém informações de um contato
   */
  getContactInfo?(
    instanceId: string,
    phoneNumber: string
  ): Promise<{ name?: string; profilePicture?: string }>

  /**
   * Formata número para o padrão do provider
   */
  formatPhoneNumber(phoneNumber: string): string
}

/**
 * Token para injeção de dependência do provider
 */
export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER')
