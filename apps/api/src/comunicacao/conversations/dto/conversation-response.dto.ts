import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ConversationType, ParticipantRole } from '../../types'

export class ParticipantResponseDto {
  @ApiProperty({ description: 'ID do participante' })
  id!: string

  @ApiProperty({ description: 'Número de telefone' })
  phoneNumber!: string

  @ApiProperty({ enum: ParticipantRole, description: 'Role no grupo' })
  role!: ParticipantRole

  @ApiPropertyOptional({ description: 'Nome do participante' })
  name?: string

  @ApiPropertyOptional({ description: 'URL do avatar' })
  avatarUrl?: string

  @ApiPropertyOptional({ description: 'ID do usuário vinculado' })
  userId?: string

  @ApiPropertyOptional({ description: 'ID do médico vinculado' })
  medicoId?: string

  @ApiProperty({ description: 'Se o participante silenciou a conversa' })
  isMuted!: boolean

  @ApiProperty({ description: 'Quantidade de mensagens não lidas' })
  unreadCount!: number

  @ApiProperty({ description: 'Data de entrada na conversa' })
  joinedAt!: Date

  @ApiPropertyOptional({ description: 'Data de saída da conversa' })
  leftAt?: Date
}

export class ConversationResponseDto {
  @ApiProperty({ description: 'ID da conversa' })
  id!: string

  @ApiProperty({ enum: ConversationType, description: 'Tipo da conversa' })
  type!: ConversationType

  @ApiPropertyOptional({ description: 'Nome da conversa/grupo' })
  name?: string

  @ApiProperty({ description: 'ID do grupo ao qual pertence' })
  grupoId!: string

  @ApiProperty({ description: 'Se a conversa está arquivada' })
  isArchived!: boolean

  @ApiPropertyOptional({ description: 'Data da última mensagem' })
  lastMessageAt?: Date

  @ApiPropertyOptional({ description: 'Preview da última mensagem' })
  lastMessagePreview?: string

  @ApiProperty({ description: 'Data de criação' })
  createdAt!: Date

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt!: Date

  @ApiProperty({
    type: [ParticipantResponseDto],
    description: 'Lista de participantes',
  })
  participants!: ParticipantResponseDto[]

  @ApiPropertyOptional({
    type: ParticipantResponseDto,
    description: 'Outro participante (apenas para conversas diretas)',
  })
  otherParticipant?: ParticipantResponseDto

  @ApiProperty({ description: 'Total de mensagens não lidas para o usuário atual' })
  unreadCount!: number
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationResponseDto] })
  data!: ConversationResponseDto[]

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
  }
}
