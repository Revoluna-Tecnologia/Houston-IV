/**
 * WhatsApp Service
 * Serviço principal que abstrai o uso dos providers de WhatsApp
 * Implementa Strategy Pattern para trocar providers via ENV
 */

import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  IWhatsAppProvider,
  WHATSAPP_PROVIDER,
} from './providers/whatsapp-provider.interface'
import {
  WhatsAppProvider,
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
  WebhookEvent,
} from './types'

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name)
  private readonly activeProvider: WhatsAppProvider

  constructor(
    @Inject(WHATSAPP_PROVIDER)
    private readonly provider: IWhatsAppProvider,
    private readonly configService: ConfigService
  ) {
    this.activeProvider = this.configService.get<WhatsAppProvider>(
      'WHATSAPP_PROVIDER',
      WhatsAppProvider.ZAPSTER
    )
  }

  onModuleInit(): void {
    this.logger.log(`WhatsApp Service initialized with provider: ${this.activeProvider}`)
    this.logger.log(`Provider name: ${this.provider.providerName}`)
  }

  /**
   * Retorna o provider ativo
   */
  getActiveProvider(): WhatsAppProvider {
    return this.activeProvider
  }

  /**
   * Verifica se o provider suporta grupos
   */
  supportsGroups(): boolean {
    return this.activeProvider === WhatsAppProvider.ZAPSTER
  }

  /**
   * Verifica se o provider suporta templates
   */
  supportsTemplates(): boolean {
    return (
      this.activeProvider === WhatsAppProvider.TWILIO ||
      this.activeProvider === WhatsAppProvider.META
    )
  }

  // === Instance Management ===

  async listInstances(): Promise<ProviderInstance[]> {
    return this.provider.listInstances()
  }

  async getInstance(instanceId: string): Promise<ProviderInstance> {
    return this.provider.getInstance(instanceId)
  }

  async createInstance(name: string): Promise<ProviderInstance> {
    return this.provider.createInstance(name)
  }

  async deleteInstance(instanceId: string): Promise<void> {
    return this.provider.deleteInstance(instanceId)
  }

  async getConnectionStatus(instanceId: string): Promise<ConnectionStatus> {
    return this.provider.getConnectionStatus(instanceId)
  }

  async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    return this.provider.getQRCode(instanceId)
  }

  async getPairingCode(instanceId: string, phoneNumber: string): Promise<PairingCodeResponse> {
    return this.provider.getPairingCode(instanceId, phoneNumber)
  }

  async powerOn(instanceId: string): Promise<void> {
    return this.provider.powerOn(instanceId)
  }

  async powerOff(instanceId: string): Promise<void> {
    return this.provider.powerOff(instanceId)
  }

  async disconnect(instanceId: string): Promise<void> {
    return this.provider.disconnect(instanceId)
  }

  // === Messaging ===

  async sendTextMessage(
    instanceId: string,
    to: string,
    text: string,
    replyToId?: string
  ): Promise<SendMessageResult> {
    this.logger.debug(`Sending text message to ${to} via ${this.activeProvider}`)
    return this.provider.sendTextMessage(instanceId, to, text, replyToId)
  }

  async sendMediaMessage(
    instanceId: string,
    payload: SendMessagePayload
  ): Promise<SendMessageResult> {
    this.logger.debug(`Sending media message to ${payload.to} via ${this.activeProvider}`)
    return this.provider.sendMediaMessage(instanceId, payload)
  }

  async sendTemplateMessage(
    instanceId: string,
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<SendMessageResult> {
    if (!this.provider.sendTemplateMessage) {
      throw new Error(`Provider ${this.activeProvider} does not support templates`)
    }
    this.logger.debug(`Sending template ${templateName} to ${to} via ${this.activeProvider}`)
    return this.provider.sendTemplateMessage(instanceId, to, templateName, params)
  }

  async sendReaction(
    instanceId: string,
    to: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    return this.provider.sendReaction(instanceId, to, messageId, emoji)
  }

  async removeReaction(instanceId: string, to: string, messageId: string): Promise<void> {
    return this.provider.removeReaction(instanceId, to, messageId)
  }

  // === Groups ===

  async listGroups(instanceId: string): Promise<ProviderGroup[]> {
    return this.provider.listGroups(instanceId)
  }

  async getGroup(instanceId: string, groupId: string): Promise<ProviderGroup> {
    return this.provider.getGroup(instanceId, groupId)
  }

  async createGroup(instanceId: string, payload: CreateGroupPayload): Promise<ProviderGroup> {
    return this.provider.createGroup(instanceId, payload)
  }

  async addGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void> {
    return this.provider.addGroupParticipants(instanceId, groupId, participants)
  }

  async removeGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void> {
    return this.provider.removeGroupParticipants(instanceId, groupId, participants)
  }

  async leaveGroup(instanceId: string, groupId: string): Promise<void> {
    return this.provider.leaveGroup(instanceId, groupId)
  }

  // === Webhooks ===

  async listWebhooks(instanceId: string): Promise<WebhookConfig[]> {
    return this.provider.listWebhooks(instanceId)
  }

  async createWebhook(instanceId: string, payload: CreateWebhookPayload): Promise<WebhookConfig> {
    return this.provider.createWebhook(instanceId, payload)
  }

  async deleteWebhook(instanceId: string, webhookId: string): Promise<void> {
    return this.provider.deleteWebhook(instanceId, webhookId)
  }

  validateWebhookSignature(payload: string, signature: string, secret?: string): boolean {
    return this.provider.validateWebhookSignature(payload, signature, secret || '')
  }

  /**
   * Configura webhook padrão para uma instância
   */
  async setupDefaultWebhook(instanceId: string, baseUrl: string): Promise<WebhookConfig> {
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp/${instanceId}`
    const events: WebhookEvent[] = [
      WebhookEvent.MESSAGE_RECEIVED,
      WebhookEvent.MESSAGE_SENT,
      WebhookEvent.MESSAGE_DELIVERED,
      WebhookEvent.MESSAGE_READ,
      WebhookEvent.MESSAGE_FAILED,
      WebhookEvent.CONNECTION_UPDATE,
    ]

    return this.createWebhook(instanceId, {
      url: webhookUrl,
      events,
      name: 'Houston IV Webhook',
      secret: this.configService.get<string>('WEBHOOK_SECRET'),
    })
  }

  // === Utilities ===

  async verifyNumber(instanceId: string, phoneNumber: string): Promise<boolean> {
    return this.provider.verifyNumber(instanceId, phoneNumber)
  }

  async getContactInfo(
    instanceId: string,
    phoneNumber: string
  ): Promise<{ name?: string; profilePicture?: string }> {
    if (!this.provider.getContactInfo) {
      return {}
    }
    return this.provider.getContactInfo(instanceId, phoneNumber)
  }

  formatPhoneNumber(phoneNumber: string): string {
    return this.provider.formatPhoneNumber(phoneNumber)
  }
}
