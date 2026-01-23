/**
 * Webhooks Service
 * Processa eventos recebidos dos providers de WhatsApp
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MessageType, MessageStatus, ConversationType, ParticipantRole } from '@prisma/client'
import {
  ZapsterWebhookPayloadDto,
  TwilioWebhookPayloadDto,
  MetaWebhookPayloadDto,
  MessageReceivedDto,
  MessageStatusDto,
  ConnectionUpdateDto,
} from './dto'
import { MessagesRepository } from '../../comunicacao/messages/messages.repository'
import { ConversationsRepository } from '../../comunicacao/conversations/conversations.repository'
import { ParticipantsRepository } from '../../comunicacao/conversations/participants.repository'
import { InstancesRepository } from '../instances/instances.repository'
import { MessagesGateway } from '../../comunicacao/messages/messages.gateway'
import { WhatsAppInstanceStatus } from '@prisma/client'
import { WhatsAppProvider, WebhookEvent } from '../types'

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly messagesRepository: MessagesRepository,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly instancesRepository: InstancesRepository,
    private readonly messagesGateway: MessagesGateway
  ) {}

  /**
   * Processa webhook do Zapster
   */
  async processZapsterWebhook(payload: ZapsterWebhookPayloadDto): Promise<void> {
    this.logger.debug(`Processing Zapster webhook: ${payload.event}`)

    switch (payload.event) {
      case WebhookEvent.MESSAGE_RECEIVED:
        await this.handleMessageReceived(
          payload.instanceId,
          payload.data as MessageReceivedDto,
          WhatsAppProvider.ZAPSTER
        )
        break

      case WebhookEvent.MESSAGE_SENT:
      case WebhookEvent.MESSAGE_DELIVERED:
      case WebhookEvent.MESSAGE_READ:
      case WebhookEvent.MESSAGE_FAILED:
        await this.handleMessageStatus(
          payload.data as MessageStatusDto,
          payload.event
        )
        break

      case WebhookEvent.CONNECTION_UPDATE:
        await this.handleConnectionUpdate(
          payload.instanceId,
          payload.data as ConnectionUpdateDto
        )
        break

      default:
        this.logger.warn(`Unknown Zapster event: ${payload.event}`)
    }
  }

  /**
   * Processa webhook do Twilio
   */
  async processTwilioWebhook(payload: TwilioWebhookPayloadDto): Promise<void> {
    this.logger.debug(`Processing Twilio webhook: ${payload.SmsStatus}`)

    // Twilio envia status updates
    if (['queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'undelivered'].includes(payload.SmsStatus)) {
      await this.handleMessageStatus(
        {
          messageId: payload.MessageSid,
          status: payload.SmsStatus,
          error: payload.ErrorMessage,
        },
        this.mapTwilioStatus(payload.SmsStatus)
      )
    }

    // Twilio também pode enviar mensagens recebidas
    if (payload.From && payload.Body) {
      await this.handleMessageReceived(
        '',
        {
          messageId: payload.MessageSid,
          from: payload.From.replace('whatsapp:', ''),
          to: payload.To.replace('whatsapp:', ''),
          content: payload.Body,
          messageType: payload.MediaUrl0 ? 'media' : 'text',
          mediaUrl: payload.MediaUrl0,
          mimeType: payload.MediaContentType0,
          isGroup: false,
        },
        WhatsAppProvider.TWILIO
      )
    }
  }

  /**
   * Processa webhook da Meta
   */
  async processMetaWebhook(payload: MetaWebhookPayloadDto): Promise<void> {
    this.logger.debug(`Processing Meta webhook: ${payload.object}`)

    if (payload.object !== 'whatsapp_business_account') {
      this.logger.warn(`Unknown Meta object: ${payload.object}`)
      return
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue

        const value = change.value
        const phoneNumberId = value.metadata?.phone_number_id || ''

        // Processar mensagens recebidas
        if (value.messages) {
          for (const message of value.messages) {
            const contact = value.contacts?.find((c) => c.wa_id === message.from)

            await this.handleMessageReceived(
              phoneNumberId,
              {
                messageId: message.id,
                from: message.from,
                content: message.text?.body,
                messageType: message.type,
                senderName: contact?.profile?.name,
                quotedMessageId: message.context?.message_id,
                timestamp: message.timestamp,
                isGroup: false,
              },
              WhatsAppProvider.META
            )
          }
        }

        // Processar status de mensagens
        if (value.statuses) {
          for (const status of value.statuses) {
            await this.handleMessageStatus(
              {
                messageId: status.id,
                status: status.status,
                error: status.errors?.[0]?.title,
              },
              this.mapMetaStatus(status.status)
            )
          }
        }
      }
    }
  }

  /**
   * Processa mensagem recebida
   */
  private async handleMessageReceived(
    instanceId: string,
    data: MessageReceivedDto,
    _provider: WhatsAppProvider
  ): Promise<void> {
    this.logger.debug(`Message received from ${data.from}: ${data.content || data.text || data.body}`)

    const senderPhone = this.normalizePhone(data.from)
    const content = data.content || data.text || data.body
    const senderName = data.senderName || data.pushName

    // Buscar instância pelo ID do provider
    let instance = null
    if (instanceId) {
      instance = await this.instancesRepository.findByProviderInstanceId(instanceId)
    }

    const isGroup = data.isGroup || (data.groupId ? true : false)

    // Buscar conversa existente
    let conversation = isGroup && data.groupId
      ? await this.conversationsRepository.findByZapsterGroupId(data.groupId)
      : await this.conversationsRepository.findDirectByParticipantPhone(senderPhone)

    if (!conversation) {
      // Criar nova conversa
      const newConversation = await this.conversationsRepository.create({
        type: isGroup ? ConversationType.group : ConversationType.direct,
        createdById: 'system',
        grupoId: instance?.grupoId || '',
        zapsterGroupId: data.groupId,
      })

      // Adicionar participante
      await this.participantsRepository.create({
        conversationId: newConversation.id,
        phoneNumber: senderPhone,
        role: ParticipantRole.member,
      })

      conversation = await this.conversationsRepository.findById(newConversation.id)
    }

    if (!conversation) {
      this.logger.error(`Failed to find or create conversation for phone ${senderPhone}`)
      return
    }

    // Salvar mensagem
    const message = await this.messagesRepository.create({
      conversationId: conversation.id,
      senderPhone,
      content: content || undefined,
      messageType: this.mapMessageType(data.messageType),
      status: MessageStatus.delivered,
      whatsappMessageId: data.messageId,
      replyToId: data.quotedMessageId
        ? (await this.messagesRepository.findByWhatsappId(data.quotedMessageId))?.id
        : undefined,
      metadata: {
        senderName,
        profilePicture: data.profilePicture,
        fileUrl: data.mediaUrl,
        mimeType: data.mimeType,
        fileName: data.fileName,
      },
    })

    // Atualizar conversa
    await this.conversationsRepository.update(conversation.id, {
      lastMessageAt: new Date(),
      lastMessagePreview: this.generatePreview(content, data.messageType),
    })

    // Incrementar unread_count para outros participantes
    await this.participantsRepository.incrementUnreadExcept(conversation.id, senderPhone)

    // Notificar via WebSocket
    this.messagesGateway.emitNewMessage(conversation.id, message)
  }

  /**
   * Processa atualização de status de mensagem
   */
  private async handleMessageStatus(
    data: MessageStatusDto,
    event: string
  ): Promise<void> {
    this.logger.debug(`Message status update: ${data.messageId} -> ${data.status}`)

    const message = await this.messagesRepository.findByWhatsappId(data.messageId)
    if (!message) {
      this.logger.warn(`Message not found for WhatsApp ID: ${data.messageId}`)
      return
    }

    const status = this.mapStatusFromEvent(event, data.status)

    const updateData: { status: MessageStatus; deliveredAt?: Date; readAt?: Date } = { status }

    if (status === MessageStatus.delivered && !message.deliveredAt) {
      updateData.deliveredAt = new Date()
    }
    if (status === MessageStatus.read && !message.readAt) {
      updateData.readAt = new Date()
    }

    await this.messagesRepository.update(message.id, updateData)

    this.messagesGateway.emitMessageStatusUpdate(message.conversationId, message.id, status)
  }

  /**
   * Processa atualização de conexão
   */
  private async handleConnectionUpdate(
    instanceId: string,
    data: ConnectionUpdateDto
  ): Promise<void> {
    this.logger.debug(`Connection update for ${instanceId}: ${data.status}`)

    const instance = await this.instancesRepository.findByProviderInstanceId(instanceId)
    if (!instance) {
      this.logger.warn(`Instance not found: ${instanceId}`)
      return
    }

    const status = this.mapConnectionStatus(data.status)
    await this.instancesRepository.updateStatus(instance.id, status, data.phoneNumber)

    this.logger.log(`Instance ${instance.id} status updated to ${status}`)
  }

  // === Helper Methods ===

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    return cleaned
  }

  private mapMessageType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.text,
      image: MessageType.image,
      video: MessageType.video,
      audio: MessageType.audio,
      document: MessageType.document,
      file: MessageType.file,
      sticker: MessageType.sticker,
      location: MessageType.location,
      contact: MessageType.contact,
      interactive: MessageType.interactive,
      template: MessageType.template,
    }
    return typeMap[type.toLowerCase()] || MessageType.text
  }

  private mapStatusFromEvent(event: string, status: string): MessageStatus {
    const eventMap: Record<string, MessageStatus> = {
      [WebhookEvent.MESSAGE_SENT]: MessageStatus.sent,
      [WebhookEvent.MESSAGE_DELIVERED]: MessageStatus.delivered,
      [WebhookEvent.MESSAGE_READ]: MessageStatus.read,
      [WebhookEvent.MESSAGE_FAILED]: MessageStatus.failed,
    }

    const statusMap: Record<string, MessageStatus> = {
      sent: MessageStatus.sent,
      delivered: MessageStatus.delivered,
      read: MessageStatus.read,
      failed: MessageStatus.failed,
    }

    return eventMap[event] || statusMap[status.toLowerCase()] || MessageStatus.sent
  }

  private mapConnectionStatus(status: string): WhatsAppInstanceStatus {
    const statusMap: Record<string, WhatsAppInstanceStatus> = {
      connected: WhatsAppInstanceStatus.connected,
      disconnected: WhatsAppInstanceStatus.disconnected,
      connecting: WhatsAppInstanceStatus.connecting,
      offline: WhatsAppInstanceStatus.offline,
    }
    return statusMap[status.toLowerCase()] || WhatsAppInstanceStatus.offline
  }

  private mapTwilioStatus(status: string): string {
    const statusMap: Record<string, string> = {
      queued: WebhookEvent.MESSAGE_SENT,
      sending: WebhookEvent.MESSAGE_SENT,
      sent: WebhookEvent.MESSAGE_SENT,
      delivered: WebhookEvent.MESSAGE_DELIVERED,
      read: WebhookEvent.MESSAGE_READ,
      failed: WebhookEvent.MESSAGE_FAILED,
      undelivered: WebhookEvent.MESSAGE_FAILED,
    }
    return statusMap[status] || WebhookEvent.MESSAGE_SENT
  }

  private mapMetaStatus(status: string): string {
    const statusMap: Record<string, string> = {
      sent: WebhookEvent.MESSAGE_SENT,
      delivered: WebhookEvent.MESSAGE_DELIVERED,
      read: WebhookEvent.MESSAGE_READ,
      failed: WebhookEvent.MESSAGE_FAILED,
    }
    return statusMap[status] || WebhookEvent.MESSAGE_SENT
  }

  private generatePreview(content: string | undefined, type: string): string {
    if (content) {
      return content.substring(0, 100)
    }

    const typeLabels: Record<string, string> = {
      image: 'Imagem',
      video: 'Video',
      audio: 'Audio',
      document: 'Documento',
      file: 'Arquivo',
      sticker: 'Sticker',
      location: 'Localizacao',
      contact: 'Contato',
    }

    return typeLabels[type.toLowerCase()] || ''
  }
}
