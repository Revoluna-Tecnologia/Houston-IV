/**
 * Types para o modulo de comunicacao
 * Espelha os tipos da API NestJS
 */

// ============================================================
// Enums
// ============================================================

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
  SHIFT_OFFER = 'shift_offer',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum ParticipantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhatsAppInstanceStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  OFFLINE = 'offline',
}

export enum ShiftOfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// ============================================================
// Interfaces - Entities
// ============================================================

export interface Participant {
  id: string;
  conversationId: string;
  userId?: string;
  medicoId?: string;
  phoneNumber: string;
  role: ParticipantRole;
  isMuted: boolean;
  unreadCount: number;
  joinedAt: string;
  leftAt?: string;
  lastReadAt?: string;
  // Relations
  user?: {
    id: string;
    name: string;
    email: string;
  };
  medico?: {
    id: string;
    nome: string;
    telefone?: string;
  };
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  createdById: string;
  grupoId: string;
  zapsterGroupId?: string;
  isArchived: boolean;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  unreadCount?: number;
  // Relations
  participants?: Participant[];
}

export interface MessageMetadata {
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  thumbnail?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  shiftOfferId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  senderPhone: string;
  content?: string;
  messageType: MessageType;
  replyToId?: string;
  metadata?: MessageMetadata;
  status: MessageStatus;
  whatsappMessageId?: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  deletedAt?: string;
  // Relations
  replyTo?: Message;
  sender?: {
    id: string;
    name: string;
  };
}

export interface Contact {
  id: string;
  ownerId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  linkedUserId?: string;
  linkedMedicoId?: string;
  linkedMedicoName?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppInstance {
  id: string;
  grupoId: string;
  provider: 'zapster' | 'twilio' | 'meta';
  providerInstanceId: string;
  instanceName: string;
  status: WhatsAppInstanceStatus;
  phoneNumber?: string;
  metadata?: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftOffer {
  id: string;
  conversationId: string;
  messageId?: string;
  vagaId: string;
  senderUserId: string;
  recipientMedicoId: string;
  status: ShiftOfferStatus;
  respondedAt?: string;
  expiresAt: string;
  createdAt: string;
  // Relations
  vaga?: {
    id: string;
    data: string;
    horaInicio: string;
    horaFim: string;
    valor: number;
    hospital?: {
      nome: string;
    };
    setor?: {
      nome: string;
    };
  };
  recipientMedico?: {
    id: string;
    nome: string;
    telefone?: string;
  };
}

// ============================================================
// DTOs - Create/Update
// ============================================================

export interface CreateConversationDto {
  type: ConversationType;
  name?: string;
  participantPhones: string[];
  grupoId?: string;
}

export interface UpdateConversationDto {
  name?: string;
}

export interface AddParticipantDto {
  phoneNumber: string;
  role?: ParticipantRole;
}

export interface SendMessageDto {
  conversationId: string;
  content?: string;
  messageType: MessageType;
  replyToId?: string;
  metadata?: MessageMetadata;
}

export interface CreateContactDto {
  name: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  linkedUserId?: string;
  linkedMedicoId?: string;
  isFavorite?: boolean;
  notes?: string;
}

export interface UpdateContactDto {
  name?: string;
  email?: string;
  avatarUrl?: string;
  linkedMedicoId?: string;
  isFavorite?: boolean;
  isBlocked?: boolean;
  notes?: string;
}

export interface CreateWhatsAppInstanceDto {
  instanceName: string;
  grupoId?: string;
}

export interface CreateShiftOfferDto {
  conversationId: string;
  vagaId: string;
  recipientMedicoId: string;
  expiresInHours?: number;
}

export interface RespondShiftOfferDto {
  action: 'accept' | 'reject';
}

// ============================================================
// DTOs - Query
// ============================================================

export interface ConversationQueryDto {
  type?: ConversationType;
  isArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MessageQueryDto {
  cursor?: string;
  limit?: number;
}

export interface ContactQueryDto {
  search?: string;
  favoritesOnly?: boolean;
  blockedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface ContactListResponse {
  data: Contact[];
  total: number;
}

export interface ShiftOfferQueryDto {
  status?: ShiftOfferStatus;
  page?: number;
  limit?: number;
}

// ============================================================
// Response Types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

export interface QRCodeResponse {
  qr: string;
  expiresAt: string;
}

export interface PairingCodeResponse {
  code: string;
  expiresAt: string;
}

export interface ConnectionStatusResponse {
  status: WhatsAppInstanceStatus;
  phoneNumber?: string;
  isConnected: boolean;
}

// ============================================================
// WebSocket Events
// ============================================================

export interface WebSocketMessageNewEvent {
  message: Message;
  conversationId: string;
}

export interface WebSocketMessageStatusEvent {
  messageId: string;
  status: MessageStatus;
  conversationId: string;
}

export interface WebSocketTypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface WebSocketConversationUpdateEvent {
  conversationId: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

// ============================================================
// UI State Types
// ============================================================

export interface ConversationFilters {
  type?: ConversationType;
  isArchived?: boolean;
  search?: string;
}

export interface TypingState {
  [conversationId: string]: {
    userId: string;
    userName: string;
    timestamp: number;
  }[];
}

export interface OptimisticMessage extends Message {
  isOptimistic: true;
  localId: string;
}
