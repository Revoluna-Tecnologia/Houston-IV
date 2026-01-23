/**
 * Twilio Provider
 * Implementação do IWhatsAppProvider para Twilio WhatsApp Business API
 * Provider alternativo para empresas com conta Twilio
 */

import { Injectable, Logger, NotImplementedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { createHmac, timingSafeEqual } from 'crypto'
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
export class TwilioProvider implements IWhatsAppProvider {
  readonly providerName = 'twilio'
  private readonly logger = new Logger(TwilioProvider.name)
  private readonly apiUrl: string
  private readonly accountSid: string
  private readonly authToken: string
  private readonly phoneNumberSid: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '')
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '')
    this.phoneNumberSid = this.configService.get<string>('TWILIO_PHONE_NUMBER_SID', '')
    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`
  }

  private get headers(): Record<string, string> {
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')
    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }

  // === Instance Management ===
  // Twilio não usa instâncias como Zapster, usa números de telefone verificados

  async listInstances(): Promise<ProviderInstance[]> {
    // Twilio retorna os números de telefone como "instâncias"
    const response = await this.request<TwilioPhoneNumbersResponse>(
      'GET',
      '/IncomingPhoneNumbers.json'
    )
    return response.incoming_phone_numbers
      .filter((n) => n.capabilities.mms) // Filtra números com capacidade de WhatsApp
      .map(this.mapInstance.bind(this))
  }

  async getInstance(instanceId: string): Promise<ProviderInstance> {
    const response = await this.request<TwilioPhoneNumber>(
      'GET',
      `/IncomingPhoneNumbers/${instanceId}.json`
    )
    return this.mapInstance(response)
  }

  async createInstance(_name: string): Promise<ProviderInstance> {
    throw new NotImplementedException(
      'Twilio não suporta criação de instâncias via API. Configure números no console Twilio.'
    )
  }

  async deleteInstance(_instanceId: string): Promise<void> {
    throw new NotImplementedException(
      'Twilio não suporta deleção de instâncias via API. Gerencie números no console Twilio.'
    )
  }

  async getConnectionStatus(_instanceId: string): Promise<ConnectionStatus> {
    // Twilio está sempre conectado se as credenciais estão configuradas
    return this.accountSid && this.authToken
      ? ConnectionStatus.CONNECTED
      : ConnectionStatus.DISCONNECTED
  }

  async getQRCode(_instanceId: string): Promise<QRCodeResponse> {
    throw new NotImplementedException('Twilio não usa QR Code para conexão.')
  }

  async getPairingCode(_instanceId: string, _phoneNumber: string): Promise<PairingCodeResponse> {
    throw new NotImplementedException('Twilio não usa código de pareamento.')
  }

  async powerOn(_instanceId: string): Promise<void> {
    // Twilio está sempre ligado
    this.logger.log('Twilio instances are always on')
  }

  async powerOff(_instanceId: string): Promise<void> {
    throw new NotImplementedException('Twilio não suporta desligar instâncias.')
  }

  async disconnect(_instanceId: string): Promise<void> {
    throw new NotImplementedException('Twilio não suporta desconexão.')
  }

  // === Messaging ===

  async sendTextMessage(
    _instanceId: string,
    to: string,
    text: string,
    _replyToId?: string
  ): Promise<SendMessageResult> {
    const from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER')
    if (!from) {
      throw new WhatsAppProviderError(
        'TWILIO_WHATSAPP_NUMBER não configurado',
        'CONFIG_ERROR',
        500,
        WhatsAppProvider.TWILIO
      )
    }

    const response = await this.request<TwilioMessage>('POST', '/Messages.json', {
      From: `whatsapp:${from}`,
      To: `whatsapp:${this.formatPhoneNumber(to)}`,
      Body: text,
    })

    return {
      messageId: response.sid,
      timestamp: new Date(response.date_created),
      status: this.mapMessageStatus(response.status),
    }
  }

  async sendMediaMessage(
    _instanceId: string,
    payload: SendMessagePayload
  ): Promise<SendMessageResult> {
    const from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER')
    if (!from) {
      throw new WhatsAppProviderError(
        'TWILIO_WHATSAPP_NUMBER não configurado',
        'CONFIG_ERROR',
        500,
        WhatsAppProvider.TWILIO
      )
    }

    const body: Record<string, string> = {
      From: `whatsapp:${from}`,
      To: `whatsapp:${this.formatPhoneNumber(payload.to)}`,
    }

    if (payload.mediaUrl) {
      body.MediaUrl = payload.mediaUrl
    }
    if (payload.caption || payload.content) {
      body.Body = payload.caption || payload.content || ''
    }

    const response = await this.request<TwilioMessage>('POST', '/Messages.json', body)

    return {
      messageId: response.sid,
      timestamp: new Date(response.date_created),
      status: this.mapMessageStatus(response.status),
    }
  }

  async sendTemplateMessage(
    _instanceId: string,
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<SendMessageResult> {
    const from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER')
    if (!from) {
      throw new WhatsAppProviderError(
        'TWILIO_WHATSAPP_NUMBER não configurado',
        'CONFIG_ERROR',
        500,
        WhatsAppProvider.TWILIO
      )
    }

    // Twilio usa ContentSid para templates
    const contentSid = this.configService.get<string>(`TWILIO_TEMPLATE_${templateName.toUpperCase()}`)
    if (!contentSid) {
      throw new WhatsAppProviderError(
        `Template ${templateName} não configurado`,
        'TEMPLATE_NOT_FOUND',
        404,
        WhatsAppProvider.TWILIO
      )
    }

    const response = await this.request<TwilioMessage>('POST', '/Messages.json', {
      From: `whatsapp:${from}`,
      To: `whatsapp:${this.formatPhoneNumber(to)}`,
      ContentSid: contentSid,
      ContentVariables: JSON.stringify(params),
    })

    return {
      messageId: response.sid,
      timestamp: new Date(response.date_created),
      status: this.mapMessageStatus(response.status),
    }
  }

  async sendReaction(
    _instanceId: string,
    _to: string,
    _messageId: string,
    _emoji: string
  ): Promise<void> {
    throw new NotImplementedException('Twilio não suporta reações.')
  }

  async removeReaction(_instanceId: string, _to: string, _messageId: string): Promise<void> {
    throw new NotImplementedException('Twilio não suporta reações.')
  }

  // === Groups ===
  // Twilio WhatsApp Business API não suporta grupos

  async listGroups(_instanceId: string): Promise<ProviderGroup[]> {
    throw new NotImplementedException('Twilio WhatsApp Business API não suporta grupos.')
  }

  async getGroup(_instanceId: string, _groupId: string): Promise<ProviderGroup> {
    throw new NotImplementedException('Twilio WhatsApp Business API não suporta grupos.')
  }

  async createGroup(_instanceId: string, _payload: CreateGroupPayload): Promise<ProviderGroup> {
    throw new NotImplementedException('Twilio WhatsApp Business API não suporta grupos.')
  }

  async addGroupParticipants(
    _instanceId: string,
    _groupId: string,
    _participants: string[]
  ): Promise<void> {
    throw new NotImplementedException('Twilio WhatsApp Business API não suporta grupos.')
  }

  async removeGroupParticipants(
    _instanceId: string,
    _groupId: string,
    _participants: string[]
  ): Promise<void> {
    throw new NotImplementedException('Twilio WhatsApp Business API não suporta grupos.')
  }

  async leaveGroup(_instanceId: string, _groupId: string): Promise<void> {
    throw new NotImplementedException('Twilio WhatsApp Business API não suporta grupos.')
  }

  // === Webhooks ===

  async listWebhooks(_instanceId: string): Promise<WebhookConfig[]> {
    // Twilio configura webhooks diretamente no número de telefone
    const response = await this.request<TwilioPhoneNumber>(
      'GET',
      `/IncomingPhoneNumbers/${this.phoneNumberSid}.json`
    )

    const webhooks: WebhookConfig[] = []
    if (response.sms_url) {
      webhooks.push({
        id: 'sms_webhook',
        url: response.sms_url,
        events: [WebhookEvent.MESSAGE_RECEIVED],
        name: 'SMS/WhatsApp Webhook',
        active: true,
        createdAt: new Date(),
      })
    }
    return webhooks
  }

  async createWebhook(_instanceId: string, payload: CreateWebhookPayload): Promise<WebhookConfig> {
    // Atualiza o webhook URL no número de telefone
    await this.request('POST', `/IncomingPhoneNumbers/${this.phoneNumberSid}.json`, {
      SmsUrl: payload.url,
      SmsMethod: 'POST',
    })

    return {
      id: 'sms_webhook',
      url: payload.url,
      events: payload.events,
      name: payload.name,
      active: true,
      createdAt: new Date(),
    }
  }

  async deleteWebhook(_instanceId: string, _webhookId: string): Promise<void> {
    // Remove o webhook URL do número
    await this.request('POST', `/IncomingPhoneNumbers/${this.phoneNumberSid}.json`, {
      SmsUrl: '',
    })
  }

  validateWebhookSignature(payload: string, signature: string, _secret: string): boolean {
    // Twilio usa X-Twilio-Signature header
    const url = this.configService.get<string>('TWILIO_WEBHOOK_URL', '')
    const expectedSignature = createHmac('sha1', this.authToken)
      .update(url + payload)
      .digest('base64')

    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    } catch {
      return false
    }
  }

  // === Utilities ===

  async verifyNumber(_instanceId: string, phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.request<TwilioLookupResponse>(
        'GET',
        `https://lookups.twilio.com/v2/PhoneNumbers/${this.formatPhoneNumber(phoneNumber)}`
      )
      return response.valid
    } catch {
      return false
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '')
    if (!cleaned.startsWith('+')) {
      if (!cleaned.startsWith('55')) {
        cleaned = '55' + cleaned
      }
      cleaned = '+' + cleaned
    }
    return cleaned
  }

  // === Private Methods ===

  private async request<T>(
    method: string,
    path: string,
    data?: Record<string, string>
  ): Promise<T> {
    try {
      const url = path.startsWith('http') ? path : `${this.apiUrl}${path}`

      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url,
          headers: this.headers,
          data: data ? new URLSearchParams(data).toString() : undefined,
        })
      )
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message
        const code = error.response?.data?.code?.toString() || 'UNKNOWN_ERROR'
        const statusCode = error.response?.status

        this.logger.error(`Twilio API error: ${statusCode} - ${message}`, {
          path,
          method,
          code,
        })

        throw new WhatsAppProviderError(message, code, statusCode, WhatsAppProvider.TWILIO)
      }
      throw error
    }
  }

  private mapInstance(phoneNumber: TwilioPhoneNumber): ProviderInstance {
    return {
      id: phoneNumber.sid,
      name: phoneNumber.friendly_name,
      status: ConnectionStatus.CONNECTED,
      phoneNumber: phoneNumber.phone_number,
      createdAt: new Date(phoneNumber.date_created),
      metadata: {
        capabilities: phoneNumber.capabilities,
      },
    }
  }

  private mapMessageStatus(status: string): 'sent' | 'queued' | 'failed' {
    const statusMap: Record<string, 'sent' | 'queued' | 'failed'> = {
      queued: 'queued',
      sending: 'queued',
      sent: 'sent',
      delivered: 'sent',
      read: 'sent',
      failed: 'failed',
      undelivered: 'failed',
    }
    return statusMap[status] || 'queued'
  }
}

// === Twilio API Types ===

interface TwilioPhoneNumber {
  sid: string
  friendly_name: string
  phone_number: string
  date_created: string
  capabilities: {
    mms: boolean
    sms: boolean
    voice: boolean
  }
  sms_url?: string
}

interface TwilioPhoneNumbersResponse {
  incoming_phone_numbers: TwilioPhoneNumber[]
}

interface TwilioMessage {
  sid: string
  status: string
  date_created: string
}

interface TwilioLookupResponse {
  valid: boolean
  phone_number: string
}
