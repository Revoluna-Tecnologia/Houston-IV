import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MessageType, MessageStatus } from '../../types'

export class MessageMetadataResponseDto {
  @ApiPropertyOptional()
  fileName?: string

  @ApiPropertyOptional()
  fileSize?: number

  @ApiPropertyOptional()
  fileUrl?: string

  @ApiPropertyOptional()
  mimeType?: string

  @ApiPropertyOptional()
  thumbnailUrl?: string

  @ApiPropertyOptional()
  duration?: number

  @ApiPropertyOptional()
  shiftOfferId?: string

  @ApiPropertyOptional()
  vagaId?: string

  @ApiPropertyOptional()
  senderName?: string

  @ApiPropertyOptional()
  profilePicture?: string
}

export class MessageSenderDto {
  @ApiPropertyOptional()
  id?: string

  @ApiProperty()
  phoneNumber!: string

  @ApiPropertyOptional()
  name?: string

  @ApiPropertyOptional()
  avatarUrl?: string
}

export class MessageResponseDto {
  @ApiProperty({ description: 'ID da mensagem' })
  id!: string

  @ApiProperty({ description: 'ID da conversa' })
  conversationId!: string

  @ApiPropertyOptional({ description: 'ID do remetente' })
  senderId?: string

  @ApiProperty({ description: 'Telefone do remetente' })
  senderPhone!: string

  @ApiPropertyOptional({ description: 'Informações do remetente' })
  sender?: MessageSenderDto

  @ApiPropertyOptional({ description: 'Conteúdo da mensagem' })
  content?: string

  @ApiProperty({ enum: MessageType, description: 'Tipo da mensagem' })
  messageType!: MessageType

  @ApiPropertyOptional({ description: 'ID da mensagem respondida' })
  replyToId?: string

  @ApiPropertyOptional({ description: 'Mensagem respondida (resumo)' })
  replyTo?: {
    id: string
    content?: string
    messageType: MessageType
    senderPhone: string
  }

  @ApiProperty({ description: 'Metadados da mensagem' })
  metadata!: MessageMetadataResponseDto

  @ApiProperty({ enum: MessageStatus, description: 'Status da mensagem' })
  status!: MessageStatus

  @ApiProperty({ description: 'Data de criação' })
  createdAt!: Date

  @ApiPropertyOptional({ description: 'Data de entrega' })
  deliveredAt?: Date

  @ApiPropertyOptional({ description: 'Data de leitura' })
  readAt?: Date

  @ApiProperty({ description: 'Se a mensagem foi enviada pelo usuário atual' })
  isFromMe!: boolean

  @ApiPropertyOptional({ description: 'Se a mensagem foi deletada' })
  isDeleted?: boolean
}

export class MessageListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  data!: MessageResponseDto[]

  @ApiProperty({
    description: 'Metadados de paginação',
  })
  meta!: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    cursor?: string
  }
}
