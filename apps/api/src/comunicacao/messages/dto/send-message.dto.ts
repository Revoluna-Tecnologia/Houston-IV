import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsObject,
  ValidateNested,
  ValidateIf,
} from 'class-validator'
import { Type } from 'class-transformer'
import { MessageType } from '../../types'

export class MessageMetadataDto {
  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  @IsString()
  @IsOptional()
  fileName?: string

  @ApiPropertyOptional({ description: 'Tamanho do arquivo em bytes' })
  @IsOptional()
  fileSize?: number

  @ApiPropertyOptional({ description: 'URL do arquivo' })
  @IsString()
  @IsOptional()
  fileUrl?: string

  @ApiPropertyOptional({ description: 'MIME type do arquivo' })
  @IsString()
  @IsOptional()
  mimeType?: string

  @ApiPropertyOptional({ description: 'URL da thumbnail' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string

  @ApiPropertyOptional({ description: 'Duração em segundos (áudio/vídeo)' })
  @IsOptional()
  duration?: number

  @ApiPropertyOptional({ description: 'ID da vaga (para shift_offer)' })
  @IsUUID()
  @IsOptional()
  vagaId?: string

  @ApiPropertyOptional({ description: 'ID da oferta de plantão' })
  @IsUUID()
  @IsOptional()
  shiftOfferId?: string
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID da conversa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  conversationId!: string

  @ApiPropertyOptional({
    description: 'Conteúdo da mensagem (obrigatório para text)',
    example: 'Olá, tudo bem?',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.messageType === 'text' || !o.messageType)
  content?: string

  @ApiPropertyOptional({
    enum: MessageType,
    description: 'Tipo da mensagem',
    default: 'text',
  })
  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType = MessageType.text

  @ApiPropertyOptional({
    description: 'ID da mensagem sendo respondida',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4')
  @IsOptional()
  replyToId?: string

  @ApiPropertyOptional({
    type: MessageMetadataDto,
    description: 'Metadados da mensagem (arquivo, mídia, etc)',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetadataDto)
  metadata?: MessageMetadataDto

  @ApiPropertyOptional({
    description: 'Se true, não envia para WhatsApp (apenas salva local)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  skipWhatsApp?: boolean = false
}
