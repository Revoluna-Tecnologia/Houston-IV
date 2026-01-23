/**
 * Meta Provider
 * Implementação do IWhatsAppProvider para Meta WhatsApp Cloud API
 * Provider para empresas com acesso direto à API da Meta
 */

import { Injectable, Logger, NotImplementedException } from '@nestjs/common'
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
} from '../types'

@Injectable()
export class MetaProvider implements IWhatsAppProvider {
  readonly providerName = 'meta'
  private readonly logger = new Logger(MetaProvider.name)
  private readonly apiUrl = 'https://graph.facebook.com/v18.0'
  private readonly accessToken: string
  private readonly phoneNumberId: string
  private readonly businessAccountId: string
  private readonly appSecret: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.accessToken = this.configService.get<string>('META_ACCESS_TOKEN', '')
    this.phoneNumberId = this.configService.get<string>('META_PHONE_NUMBER_ID', '')
    this.businessAccountId = this.configService.get<string>('META_BUSINESS_ACCOUNT_ID', '')
    this.appSecret = this.configService.get<string>('META_APP_SECRET', '')
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  // === Instance Management ===
  // Meta Cloud API usa Phone Number IDs como "instâncias"

  async listInstances(): Promise<ProviderInstance[]> {
    const response = await this.request<MetaPhoneNumbersResponse>(
      'GET',
      `/${this.businessAccountId}/phone_numbers`
    )
    return response.data.map(this.mapInstance.bind(this))
  }

  async getInstance(instanceId: string): Promise<ProviderInstance> {
    const response = await this.request<MetaPhoneNumber>('GET', `/${instanceId}`)
    return this.mapInstance(response)
  }

  async createInstance(_name: string): Promise<ProviderInstance> {
    throw new NotImplementedException(
      'Meta Cloud API não suporta criação de números via API. Configure no Meta Business Suite.'
    )
  }

  async deleteInstance(_instanceId: string): Promise<void> {
    throw new NotImplementedException(
      'Meta Cloud API não suporta deleção de números via API. Gerencie no Meta Business Suite.'
    )
  }

  async getConnectionStatus(_instanceId: string): Promise<ConnectionStatus> {
    // Meta está sempre conectado se as credenciais estão configuradas
    return this.accessToken && this.phoneNumberId
      ? ConnectionStatus.CONNECTED
      : ConnectionStatus.DISCONNECTED
  }

  async getQRCode(_instanceId: string): Promise<QRCodeResponse> {
    throw new NotImplementedException('Meta Cloud API não usa QR Code para conexão.')
  }

  async getPairingCode(_instanceId: string, _phoneNumber: string): Promise<PairingCodeResponse> {
    throw new NotImplementedException('Meta Cloud API não usa código de pareamento.')
  }

  async powerOn(_instanceId: string): Promise<void> {
    this.logger.log('Meta Cloud API instances are always on')
  }

  async powerOff(_instanceId: string): Promise<void> {
    throw new NotImplementedException('Meta Cloud API não suporta desligar instâncias.')
  }

  async disconnect(_instanceId: string): Promise<void> {
    throw new NotImplementedException('Meta Cloud API não suporta desconexão.')
  }

  // === Messaging ===

  async sendTextMessage(
    instanceId: string,
    to: string,
    text: string,
    replyToId?: string
  ): Promise<SendMessageResult> {
    const body: MetaSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: { body: text },
    }

    if (replyToId) {
      body.context = { message_id: replyToId }
    }

    const response = await this.request<MetaSendMessageResponse>(
      'POST',
      `/${instanceId || this.phoneNumberId}/messages`,
      body
    )

    return {
      messageId: response.messages[0].id,
      timestamp: new Date(),
      status: 'sent',
    }
  }

  async sendMediaMessage(
    instanceId: string,
    payload: SendMessagePayload
  ): Promise<SendMessageResult> {
    const mediaType = payload.mediaType || 'document'
    const body: MetaSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(payload.to),
      type: mediaType,
      [mediaType]: {
        link: payload.mediaUrl,
        caption: payload.caption,
        filename: payload.fileName,
      },
    }

    if (payload.replyToId) {
      body.context = { message_id: payload.replyToId }
    }

    const response = await this.request<MetaSendMessageResponse>(
      'POST',
      `/${instanceId || this.phoneNumberId}/messages`,
      body
    )

    return {
      messageId: response.messages[0].id,
      timestamp: new Date(),
      status: 'sent',
    }
  }

  async sendTemplateMessage(
    instanceId: string,
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<SendMessageResult> {
    const components: MetaTemplateComponent[] = []

    // Converte params para o formato de componentes da Meta
    const bodyParams = Object.values(params).map((value) => ({
      type: 'text' as const,
      text: value,
    }))

    if (bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams,
      })
    }

    const body: MetaSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components,
      },
    }

    const response = await this.request<MetaSendMessageResponse>(
      'POST',
      `/${instanceId || this.phoneNumberId}/messages`,
      body
    )

    return {
      messageId: response.messages[0].id,
      timestamp: new Date(),
      status: 'sent',
    }
  }

  async sendReaction(
    instanceId: string,
    to: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    await this.request('POST', `/${instanceId || this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji,
      },
    })
  }

  async removeReaction(instanceId: string, to: string, messageId: string): Promise<void> {
    // Meta usa emoji vazio para remover reação
    await this.sendReaction(instanceId, to, messageId, '')
  }

  // === Groups ===
  // Meta WhatsApp Cloud API não suporta grupos (apenas mensagens 1:1)

  async listGroups(_instanceId: string): Promise<ProviderGroup[]> {
    throw new NotImplementedException('Meta WhatsApp Cloud API não suporta grupos.')
  }

  async getGroup(_instanceId: string, _groupId: string): Promise<ProviderGroup> {
    throw new NotImplementedException('Meta WhatsApp Cloud API não suporta grupos.')
  }

  async createGroup(_instanceId: string, _payload: CreateGroupPayload): Promise<ProviderGroup> {
    throw new NotImplementedException('Meta WhatsApp Cloud API não suporta grupos.')
  }

  async addGroupParticipants(
    _instanceId: string,
    _groupId: string,
    _participants: string[]
  ): Promise<void> {
    throw new NotImplementedException('Meta WhatsApp Cloud API não suporta grupos.')
  }

  async removeGroupParticipants(
    _instanceId: string,
    _groupId: string,
    _participants: string[]
  ): Promise<void> {
    throw new NotImplementedException('Meta WhatsApp Cloud API não suporta grupos.')
  }

  async leaveGroup(_instanceId: string, _groupId: string): Promise<void> {
    throw new NotImplementedException('Meta WhatsApp Cloud API não suporta grupos.')
  }

  // === Webhooks ===

  async listWebhooks(_instanceId: string): Promise<WebhookConfig[]> {
    // Meta configura webhooks via Facebook Developer Console
    // Não há API para listar webhooks configurados
    return []
  }

  async createWebhook(_instanceId: string, _payload: CreateWebhookPayload): Promise<WebhookConfig> {
    throw new NotImplementedException(
      'Meta webhooks devem ser configurados no Facebook Developer Console.'
    )
  }

  async deleteWebhook(_instanceId: string, _webhookId: string): Promise<void> {
    throw new NotImplementedException(
      'Meta webhooks devem ser gerenciados no Facebook Developer Console.'
    )
  }

  validateWebhookSignature(payload: string, signature: string, _secret: string): boolean {
    // Meta usa X-Hub-Signature-256 header
    const expectedSignature = createHmac('sha256', this.appSecret).update(payload).digest('hex')
    return signature === `sha256=${expectedSignature}`
  }

  // === Utilities ===

  async verifyNumber(_instanceId: string, _phoneNumber: string): Promise<boolean> {
    // Meta não tem endpoint público para verificar números
    // Retorna true pois a validação ocorre no envio
    return true
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Meta espera número sem +, apenas dígitos
    let cleaned = phoneNumber.replace(/\D/g, '')
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
        const errorData = error.response?.data?.error || {}
        const message = errorData.message || error.message
        const code = errorData.code?.toString() || 'UNKNOWN_ERROR'
        const statusCode = error.response?.status

        this.logger.error(`Meta API error: ${statusCode} - ${message}`, {
          path,
          method,
          code,
          fbtrace_id: errorData.fbtrace_id,
        })

        throw new WhatsAppProviderError(message, code, statusCode, WhatsAppProvider.META)
      }
      throw error
    }
  }

  private mapInstance(phoneNumber: MetaPhoneNumber): ProviderInstance {
    return {
      id: phoneNumber.id,
      name: phoneNumber.display_phone_number,
      status: phoneNumber.quality_rating === 'GREEN'
        ? ConnectionStatus.CONNECTED
        : ConnectionStatus.DISCONNECTED,
      phoneNumber: phoneNumber.display_phone_number,
      createdAt: new Date(),
      metadata: {
        verified_name: phoneNumber.verified_name,
        quality_rating: phoneNumber.quality_rating,
        platform_type: phoneNumber.platform_type,
      },
    }
  }
}

// === Meta API Types ===

interface MetaPhoneNumber {
  id: string
  display_phone_number: string
  verified_name: string
  quality_rating: 'GREEN' | 'YELLOW' | 'RED'
  platform_type: string
}

interface MetaPhoneNumbersResponse {
  data: MetaPhoneNumber[]
}

interface MetaSendMessageRequest {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: string
  text?: { body: string }
  image?: { link?: string; caption?: string }
  video?: { link?: string; caption?: string }
  audio?: { link?: string }
  document?: { link?: string; caption?: string; filename?: string }
  template?: {
    name: string
    language: { code: string }
    components?: MetaTemplateComponent[]
  }
  reaction?: {
    message_id: string
    emoji: string
  }
  context?: { message_id: string }
  [key: string]: unknown
}

interface MetaTemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters?: Array<{
    type: 'text' | 'image' | 'video' | 'document'
    text?: string
    image?: { link: string }
    video?: { link: string }
    document?: { link: string }
  }>
  sub_type?: string
  index?: number
}

interface MetaSendMessageResponse {
  messaging_product: string
  contacts: Array<{ wa_id: string }>
  messages: Array<{ id: string }>
}
