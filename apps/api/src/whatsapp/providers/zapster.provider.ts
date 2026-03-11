/**
 * Zapster Provider
 * Implementação do IWhatsAppProvider para a API Zapster
 * Provider padrão do sistema
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { createHmac } from 'crypto'
import { AxiosError } from 'axios'
import { IWhatsAppProvider } from './whatsapp-provider.interface'
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
  WhatsAppProviderError,
  WhatsAppProvider,
  WebhookEvent,
} from '../types'

@Injectable()
export class ZapsterProvider implements IWhatsAppProvider {
  readonly providerName = 'zapster'
  private readonly logger = new Logger(ZapsterProvider.name)
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly webhookSecret: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.apiUrl = this.configService.get<string>('ZAPSTER_API_URL', 'https://api.zapsterapi.com/v1')
    this.apiKey = this.configService.get<string>('ZAPSTER_API_KEY', '')
    this.webhookSecret = this.configService.get<string>('ZAPSTER_WEBHOOK_SECRET', '')

    if (!this.apiKey) {
      this.logger.warn('ZAPSTER_API_KEY not configured — WhatsApp integration disabled')
    }
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  // === Instance Management ===

  async listInstances(): Promise<ProviderInstance[]> {
    const response = await this.request<{ data: ZapsterInstance[] }>('GET', '/instances')
    return response.data.map(this.mapInstance)
  }

  async getInstance(instanceId: string): Promise<ProviderInstance> {
    const response = await this.request<ZapsterInstance>('GET', `/instances/${instanceId}`)
    return this.mapInstance(response)
  }

  async createInstance(name: string): Promise<ProviderInstance> {
    const response = await this.request<ZapsterInstance>('POST', '/instances', { name })
    return this.mapInstance(response)
  }

  async deleteInstance(instanceId: string): Promise<void> {
    await this.request('DELETE', `/instances/${instanceId}`)
  }

  async getConnectionStatus(instanceId: string): Promise<ConnectionStatus> {
    const response = await this.request<{ status: string }>('GET', `/instances/${instanceId}/status`)
    return this.mapConnectionStatus(response.status)
  }

  async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    const response = await this.request<{ qr: string; expiresAt?: string }>(
      'GET',
      `/instances/${instanceId}/qr`
    )
    return {
      qr: response.qr.startsWith('data:') ? response.qr : `data:image/png;base64,${response.qr}`,
      expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
    }
  }

  async getPairingCode(instanceId: string, phoneNumber: string): Promise<PairingCodeResponse> {
    const response = await this.request<{ code: string; expiresAt?: string }>(
      'POST',
      `/instances/${instanceId}/pairing-code`,
      { phoneNumber: this.formatPhoneNumber(phoneNumber) }
    )
    return {
      code: response.code,
      expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
    }
  }

  async powerOn(instanceId: string): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/power-on`)
  }

  async powerOff(instanceId: string): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/power-off`)
  }

  async disconnect(instanceId: string): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/logout`)
  }

  // === Messaging ===

  async sendTextMessage(
    instanceId: string,
    to: string,
    text: string,
    replyToId?: string
  ): Promise<SendMessageResult> {
    const response = await this.request<{ messageId: string; timestamp: string }>(
      'POST',
      `/instances/${instanceId}/messages/text`,
      {
        to: this.formatPhoneNumber(to),
        text,
        quotedMessageId: replyToId,
      }
    )
    return {
      messageId: response.messageId,
      timestamp: new Date(response.timestamp),
      status: 'sent',
    }
  }

  async sendMediaMessage(
    instanceId: string,
    payload: SendMessagePayload
  ): Promise<SendMessageResult> {
    const response = await this.request<{ messageId: string; timestamp: string }>(
      'POST',
      `/instances/${instanceId}/messages/media`,
      {
        to: this.formatPhoneNumber(payload.to),
        mediaType: payload.mediaType,
        url: payload.mediaUrl,
        caption: payload.caption,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        quotedMessageId: payload.replyToId,
      }
    )
    return {
      messageId: response.messageId,
      timestamp: new Date(response.timestamp),
      status: 'sent',
    }
  }

  async sendReaction(
    instanceId: string,
    to: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/messages/${messageId}/reaction`, {
      to: this.formatPhoneNumber(to),
      emoji,
    })
  }

  async removeReaction(instanceId: string, to: string, messageId: string): Promise<void> {
    await this.request('DELETE', `/instances/${instanceId}/messages/${messageId}/reaction`, {
      to: this.formatPhoneNumber(to),
    })
  }

  // === Groups ===

  async listGroups(instanceId: string): Promise<ProviderGroup[]> {
    const response = await this.request<{ data: ZapsterGroup[] }>(
      'GET',
      `/instances/${instanceId}/groups`
    )
    return response.data.map(this.mapGroup)
  }

  async getGroup(instanceId: string, groupId: string): Promise<ProviderGroup> {
    const response = await this.request<ZapsterGroup>(
      'GET',
      `/instances/${instanceId}/groups/${groupId}`
    )
    return this.mapGroup(response)
  }

  async createGroup(instanceId: string, payload: CreateGroupPayload): Promise<ProviderGroup> {
    const response = await this.request<ZapsterGroup>('POST', `/instances/${instanceId}/groups`, {
      name: payload.name,
      participants: payload.participants.map((p) => this.formatPhoneNumber(p)),
      description: payload.description,
    })
    return this.mapGroup(response)
  }

  async addGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/groups/${groupId}/participants`, {
      participants: participants.map((p) => this.formatPhoneNumber(p)),
    })
  }

  async removeGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void> {
    await this.request('DELETE', `/instances/${instanceId}/groups/${groupId}/participants`, {
      participants: participants.map((p) => this.formatPhoneNumber(p)),
    })
  }

  async promoteGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/groups/${groupId}/admins`, {
      participants: participants.map((p) => this.formatPhoneNumber(p)),
    })
  }

  async demoteGroupParticipants(
    instanceId: string,
    groupId: string,
    participants: string[]
  ): Promise<void> {
    await this.request('DELETE', `/instances/${instanceId}/groups/${groupId}/admins`, {
      participants: participants.map((p) => this.formatPhoneNumber(p)),
    })
  }

  async leaveGroup(instanceId: string, groupId: string): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/groups/${groupId}/leave`)
  }

  // === Webhooks ===

  async listWebhooks(instanceId: string): Promise<WebhookConfig[]> {
    const response = await this.request<{ data: ZapsterWebhook[] }>(
      'GET',
      `/instances/${instanceId}/webhooks`
    )
    return response.data.map(this.mapWebhook)
  }

  async createWebhook(instanceId: string, payload: CreateWebhookPayload): Promise<WebhookConfig> {
    const response = await this.request<ZapsterWebhook>(
      'POST',
      `/instances/${instanceId}/webhooks`,
      {
        url: payload.url,
        events: payload.events,
        name: payload.name,
        secret: payload.secret,
      }
    )
    return this.mapWebhook(response)
  }

  async deleteWebhook(instanceId: string, webhookId: string): Promise<void> {
    await this.request('DELETE', `/instances/${instanceId}/webhooks/${webhookId}`)
  }

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = createHmac('sha256', secret || this.webhookSecret)
      .update(payload)
      .digest('hex')
    return signature === expectedSignature
  }

  // === Utilities ===

  async verifyNumber(instanceId: string, phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.request<{ exists: boolean }>(
        'GET',
        `/instances/${instanceId}/verify/${this.formatPhoneNumber(phoneNumber)}`
      )
      return response.exists
    } catch {
      return false
    }
  }

  async getContactInfo(
    instanceId: string,
    phoneNumber: string
  ): Promise<{ name?: string; profilePicture?: string }> {
    try {
      const response = await this.request<{ name?: string; profilePicture?: string }>(
        'GET',
        `/instances/${instanceId}/contacts/${this.formatPhoneNumber(phoneNumber)}`
      )
      return response
    } catch {
      return {}
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '')
    // Adiciona código do país se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    return cleaned
  }

  // === Private Methods ===

  private async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.apiUrl}${path}`,
          headers: this.headers,
          data,
        })
      )
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message
        const code = error.response?.data?.code || 'UNKNOWN_ERROR'
        const statusCode = error.response?.status

        this.logger.error(`Zapster API error: ${statusCode} - ${message}`, {
          path,
          method,
          code,
        })

        throw new WhatsAppProviderError(message, code, statusCode, WhatsAppProvider.ZAPSTER)
      }
      throw error
    }
  }

  private mapInstance(instance: ZapsterInstance): ProviderInstance {
    return {
      id: instance.id,
      name: instance.name,
      status: this.mapConnectionStatus(instance.status),
      phoneNumber: instance.phoneNumber,
      createdAt: new Date(instance.createdAt),
      metadata: instance.metadata,
    }
  }

  private mapConnectionStatus(status: string): ConnectionStatus {
    const statusMap: Record<string, ConnectionStatus> = {
      connected: ConnectionStatus.CONNECTED,
      disconnected: ConnectionStatus.DISCONNECTED,
      connecting: ConnectionStatus.CONNECTING,
      offline: ConnectionStatus.OFFLINE,
    }
    return statusMap[status.toLowerCase()] || ConnectionStatus.OFFLINE
  }

  private mapGroup(group: ZapsterGroup): ProviderGroup {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      participants: group.participants || [],
      admins: group.admins || [],
      createdAt: group.createdAt ? new Date(group.createdAt) : undefined,
      pictureUrl: group.pictureUrl,
    }
  }

  private mapWebhook(webhook: ZapsterWebhook): WebhookConfig {
    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events.map(e => e as WebhookEvent).filter(e => Object.values(WebhookEvent).includes(e)),
      name: webhook.name,
      active: webhook.active ?? true,
      secret: webhook.secret,
      createdAt: new Date(webhook.createdAt),
    }
  }
}

// === Zapster API Types ===

interface ZapsterInstance {
  id: string
  name: string
  status: string
  phoneNumber?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface ZapsterGroup {
  id: string
  name: string
  description?: string
  participants?: string[]
  admins?: string[]
  createdAt?: string
  pictureUrl?: string
}

interface ZapsterWebhook {
  id: string
  url: string
  events: string[]
  name: string
  active?: boolean
  secret?: string
  createdAt: string
}
