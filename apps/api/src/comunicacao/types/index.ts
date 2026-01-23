/**
 * Tipos compartilhados do módulo de Comunicação
 * Seguindo Clean Code e SRP
 */

import {
  ConversationType,
  MessageType,
  MessageStatus,
  ParticipantRole,
  ShiftOfferStatus,
} from '@prisma/client'

// Re-exportar enums do Prisma para uso nos DTOs
export {
  ConversationType,
  MessageType,
  MessageStatus,
  ParticipantRole,
  ShiftOfferStatus,
}

// Metadados de mensagem (armazenados em JSON)
export interface MessageMetadata {
  // Arquivos/Mídia
  fileName?: string
  fileSize?: number
  fileUrl?: string
  mimeType?: string
  thumbnailUrl?: string
  duration?: number // Para áudio/vídeo

  // Oferta de plantão
  shiftOfferId?: string
  vagaId?: string

  // Contato compartilhado
  contactName?: string
  contactPhone?: string

  // Localização
  latitude?: number
  longitude?: number
  locationName?: string

  // WhatsApp específico
  whatsappId?: string
  senderName?: string
  profilePicture?: string

  // Reações
  reactions?: MessageReaction[]
}

export interface MessageReaction {
  emoji: string
  userId: string
  createdAt: Date
}

// Preview de mensagem para lista de conversas
export interface MessagePreview {
  content: string
  type: MessageType
  timestamp: Date
}

// Resultado paginado genérico
export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Opções de paginação
export interface PaginationOptions {
  page?: number
  limit?: number
}

// Filtros de conversa
export interface ConversationFilters extends PaginationOptions {
  type?: ConversationType
  isArchived?: boolean
  search?: string
  grupoId?: string
}

// Filtros de mensagem
export interface MessageFilters extends PaginationOptions {
  messageType?: MessageType
  startDate?: Date
  endDate?: Date
  search?: string
}

// Evento de typing
export interface TypingEvent {
  conversationId: string
  userId: string
  userName: string
  isTyping: boolean
}

// Evento de nova mensagem (WebSocket)
export interface NewMessageEvent {
  conversationId: string
  message: {
    id: string
    content?: string
    messageType: MessageType
    senderId?: string
    senderPhone: string
    createdAt: Date
    metadata?: MessageMetadata
  }
}

// Evento de status de mensagem (WebSocket)
export interface MessageStatusEvent {
  conversationId: string
  messageId: string
  status: MessageStatus
  timestamp: Date
}

// Evento de mensagem deletada (WebSocket)
export interface MessageDeletedEvent {
  conversationId: string
  messageId: string
}

// Evento de atualização de conversa (WebSocket)
export interface ConversationUpdateEvent {
  conversationId: string
  lastMessageAt?: Date
  lastMessagePreview?: string
  unreadCount?: number
}
