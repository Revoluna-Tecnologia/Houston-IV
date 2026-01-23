/**
 * WhatsApp Module Types
 * Tipos compartilhados para integração com provedores de WhatsApp
 */

// === Enums ===

export enum WhatsAppProvider {
  ZAPSTER = 'zapster',
  TWILIO = 'twilio',
  META = 'meta',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  OFFLINE = 'offline',
}

export enum WebhookEvent {
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_DELIVERED = 'message.delivered',
  MESSAGE_READ = 'message.read',
  MESSAGE_FAILED = 'message.failed',
  CONNECTION_UPDATE = 'connection.update',
  GROUP_UPDATE = 'group.update',
}

// === Instance Types ===

export interface ProviderInstance {
  id: string
  name: string
  status: ConnectionStatus
  phoneNumber?: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface QRCodeResponse {
  qr: string
  expiresAt?: Date
}

export interface PairingCodeResponse {
  code: string
  expiresAt?: Date
}

// === Message Types ===

export interface SendMessagePayload {
  to: string
  content?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
  caption?: string
  fileName?: string
  mimeType?: string
  replyToId?: string
  templateName?: string
  templateParams?: Record<string, string>
}

export interface SendMessageResult {
  messageId: string
  timestamp: Date
  status: 'sent' | 'queued' | 'failed'
}

export interface MessagePayload {
  messageId: string
  from: string
  to: string
  content?: string
  mediaUrl?: string
  mediaType?: string
  mimeType?: string
  fileName?: string
  timestamp: Date
  isGroup: boolean
  groupId?: string
  senderName?: string
  profilePicture?: string
  quotedMessageId?: string
}

// === Group Types ===

export interface ProviderGroup {
  id: string
  name: string
  description?: string
  participants: string[]
  admins: string[]
  createdAt?: Date
  pictureUrl?: string
}

export interface CreateGroupPayload {
  name: string
  participants: string[]
  description?: string
}

// === Webhook Types ===

export interface WebhookPayload {
  event: WebhookEvent
  instanceId: string
  timestamp: Date
  data: Record<string, unknown>
}

export interface MessageReceivedPayload {
  messageId: string
  from: string
  to: string
  content?: string
  messageType: string
  mediaUrl?: string
  mimeType?: string
  fileName?: string
  isGroup: boolean
  groupId?: string
  senderName?: string
  profilePicture?: string
  quotedMessageId?: string
  timestamp: Date
}

export interface MessageStatusPayload {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
  error?: string
}

export interface ConnectionUpdatePayload {
  status: ConnectionStatus
  phoneNumber?: string
  error?: string
}

// === Webhook Configuration ===

export interface WebhookConfig {
  id: string
  url: string
  events: WebhookEvent[]
  name: string
  active: boolean
  secret?: string
  createdAt: Date
}

export interface CreateWebhookPayload {
  url: string
  events: WebhookEvent[]
  name: string
  secret?: string
}

// === Provider Configuration ===

export interface ProviderConfig {
  apiKey: string
  apiUrl: string
  webhookSecret?: string
  timeout?: number
}

// === Error Types ===

export class WhatsAppProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly provider?: WhatsAppProvider
  ) {
    super(message)
    this.name = 'WhatsAppProviderError'
  }
}
