/**
 * Webhook Payload DTOs
 * DTOs para recebimento de eventos dos providers de WhatsApp
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator'

/**
 * Payload genérico de webhook
 */
export class WebhookPayloadDto {
  @ApiProperty({ description: 'Tipo do evento' })
  @IsString()
  @IsNotEmpty()
  event!: string

  @ApiPropertyOptional({ description: 'ID da instância' })
  @IsString()
  @IsOptional()
  instanceId?: string

  @ApiProperty({ description: 'Dados do evento' })
  @IsObject()
  data!: Record<string, unknown>

  @ApiPropertyOptional({ description: 'Timestamp do evento' })
  @IsString()
  @IsOptional()
  timestamp?: string
}

/**
 * Payload de mensagem recebida
 */
export class MessageReceivedDto {
  @ApiProperty({ description: 'ID da mensagem no provider' })
  @IsString()
  @IsNotEmpty()
  messageId!: string

  @ApiProperty({ description: 'Número do remetente' })
  @IsString()
  @IsNotEmpty()
  from!: string

  @ApiPropertyOptional({ description: 'Número do destinatário' })
  @IsString()
  @IsOptional()
  to?: string

  @ApiPropertyOptional({ description: 'Conteúdo da mensagem' })
  @IsString()
  @IsOptional()
  content?: string

  @ApiPropertyOptional({ description: 'Texto da mensagem (alias para content)' })
  @IsString()
  @IsOptional()
  text?: string

  @ApiPropertyOptional({ description: 'Corpo da mensagem (alias para content)' })
  @IsString()
  @IsOptional()
  body?: string

  @ApiProperty({ description: 'Tipo da mensagem' })
  @IsString()
  @IsNotEmpty()
  messageType!: string

  @ApiPropertyOptional({ description: 'URL da mídia' })
  @IsString()
  @IsOptional()
  mediaUrl?: string

  @ApiPropertyOptional({ description: 'MIME type da mídia' })
  @IsString()
  @IsOptional()
  mimeType?: string

  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  @IsString()
  @IsOptional()
  fileName?: string

  @ApiPropertyOptional({ description: 'É de grupo?' })
  @IsBoolean()
  @IsOptional()
  isGroup?: boolean

  @ApiPropertyOptional({ description: 'ID do grupo' })
  @IsString()
  @IsOptional()
  groupId?: string

  @ApiPropertyOptional({ description: 'Nome do remetente' })
  @IsString()
  @IsOptional()
  senderName?: string

  @ApiPropertyOptional({ description: 'Nome do remetente (alias)' })
  @IsString()
  @IsOptional()
  pushName?: string

  @ApiPropertyOptional({ description: 'Foto do perfil' })
  @IsString()
  @IsOptional()
  profilePicture?: string

  @ApiPropertyOptional({ description: 'ID da mensagem citada' })
  @IsString()
  @IsOptional()
  quotedMessageId?: string

  @ApiPropertyOptional({ description: 'Timestamp' })
  timestamp?: string | number
}

/**
 * Payload de status de mensagem
 */
export class MessageStatusDto {
  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  @IsNotEmpty()
  messageId!: string

  @ApiProperty({ description: 'Novo status' })
  @IsString()
  @IsNotEmpty()
  status!: string

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  @IsString()
  @IsOptional()
  error?: string

  @ApiPropertyOptional({ description: 'Timestamp' })
  timestamp?: string | number
}

/**
 * Payload de atualização de conexão
 */
export class ConnectionUpdateDto {
  @ApiProperty({ description: 'Status da conexão' })
  @IsString()
  @IsNotEmpty()
  status!: string

  @ApiPropertyOptional({ description: 'Número de telefone conectado' })
  @IsString()
  @IsOptional()
  phoneNumber?: string

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  @IsString()
  @IsOptional()
  error?: string
}

/**
 * Payload específico do Zapster
 */
export class ZapsterWebhookPayloadDto {
  @ApiProperty()
  @IsString()
  event!: string

  @ApiProperty()
  @IsString()
  instanceId!: string

  @ApiProperty()
  @IsObject()
  data!: MessageReceivedDto | MessageStatusDto | ConnectionUpdateDto | Record<string, unknown>

  @ApiPropertyOptional()
  timestamp?: string
}

/**
 * Payload específico do Twilio
 */
export class TwilioWebhookPayloadDto {
  @ApiProperty()
  @IsString()
  MessageSid!: string

  @ApiProperty()
  @IsString()
  From!: string

  @ApiProperty()
  @IsString()
  To!: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  Body?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  MediaUrl0?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  MediaContentType0?: string

  @ApiProperty()
  @IsString()
  SmsStatus!: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ErrorCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ErrorMessage?: string
}

/**
 * Payload específico da Meta
 */
export class MetaWebhookPayloadDto {
  @ApiProperty()
  @IsString()
  object!: string

  @ApiProperty()
  entry!: MetaWebhookEntry[]
}

export class MetaWebhookEntry {
  @ApiProperty()
  @IsString()
  id!: string

  @ApiProperty()
  changes!: MetaWebhookChange[]
}

export class MetaWebhookChange {
  @ApiProperty()
  @IsString()
  field!: string

  @ApiProperty()
  value!: MetaWebhookValue
}

export class MetaWebhookValue {
  @ApiProperty()
  @IsString()
  messaging_product!: string

  @ApiPropertyOptional()
  metadata?: {
    display_phone_number: string
    phone_number_id: string
  }

  @ApiPropertyOptional()
  contacts?: Array<{
    wa_id: string
    profile: { name: string }
  }>

  @ApiPropertyOptional()
  messages?: MetaMessage[]

  @ApiPropertyOptional()
  statuses?: MetaStatus[]
}

export class MetaMessage {
  @ApiProperty()
  id!: string

  @ApiProperty()
  from!: string

  @ApiProperty()
  timestamp!: string

  @ApiProperty()
  type!: string

  @ApiPropertyOptional()
  text?: { body: string }

  @ApiPropertyOptional()
  image?: { id: string; mime_type: string; sha256: string; caption?: string }

  @ApiPropertyOptional()
  video?: { id: string; mime_type: string; sha256: string; caption?: string }

  @ApiPropertyOptional()
  audio?: { id: string; mime_type: string; sha256: string }

  @ApiPropertyOptional()
  document?: { id: string; mime_type: string; sha256: string; filename: string; caption?: string }

  @ApiPropertyOptional()
  context?: { message_id: string; from: string }

  @ApiPropertyOptional()
  reaction?: { message_id: string; emoji: string }
}

export class MetaStatus {
  @ApiProperty()
  id!: string

  @ApiProperty()
  status!: string

  @ApiProperty()
  timestamp!: string

  @ApiProperty()
  recipient_id!: string

  @ApiPropertyOptional()
  errors?: Array<{ code: number; title: string }>
}
