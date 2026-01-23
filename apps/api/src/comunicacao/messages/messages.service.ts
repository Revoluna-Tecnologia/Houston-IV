import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { MessagesRepository, MessageWithReply } from './messages.repository'
import { MessagesGateway } from './messages.gateway'
import { ConversationsRepository } from '../conversations/conversations.repository'
import { ParticipantsRepository } from '../conversations/participants.repository'
import {
  SendMessageDto,
  MessageQueryDto,
  MessageResponseDto,
} from './dto'
import { PaginatedResult, MessageType, MessageStatus, MessageMetadata } from '../types'
import { AuthenticatedUser } from '../../auth/types/auth.types'

/**
 * Service de Mensagens
 * Responsabilidade única: Lógica de negócio de mensagens
 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name)

  constructor(
    private readonly repository: MessagesRepository,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly gateway: MessagesGateway,
  ) {}

  /**
   * Envia uma nova mensagem
   */
  async send(
    dto: SendMessageDto,
    user: AuthenticatedUser
  ): Promise<MessageResponseDto> {
    // Verificar se conversa existe
    const conversation = await this.conversationsRepository.findById(
      dto.conversationId
    )
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada')
    }

    // Verificar se usuário é participante
    const isParticipant = await this.conversationsRepository.isParticipant(
      dto.conversationId,
      user.id
    )
    if (!isParticipant) {
      throw new ForbiddenException('Usuário não é participante da conversa')
    }

    // Validar conteúdo baseado no tipo
    this.validateMessageContent(dto)

    // Buscar telefone do remetente
    const senderPhone = await this.getSenderPhone(dto.conversationId, user.id)

    // Criar mensagem no banco
    const message = await this.repository.create({
      conversationId: dto.conversationId,
      senderId: user.id,
      senderPhone,
      content: dto.content,
      messageType: dto.messageType,
      replyToId: dto.replyToId,
      metadata: dto.metadata as MessageMetadata,
      status: dto.skipWhatsApp ? MessageStatus.sent : MessageStatus.sending,
    })

    // Atualizar preview da conversa
    await this.conversationsRepository.update(dto.conversationId, {
      lastMessageAt: new Date(),
      lastMessagePreview: this.generatePreview(dto),
    })

    // Incrementar unread para outros participantes
    await this.participantsRepository.incrementUnreadExcept(
      dto.conversationId,
      senderPhone
    )

    // Notificar via WebSocket (optimistic update)
    this.gateway.emitNewMessage(dto.conversationId, message)

    this.logger.log(
      `Mensagem ${message.id} enviada na conversa ${dto.conversationId} por ${user.id}`
    )

    return this.toResponseDto(message, user.id)
  }

  /**
   * Lista mensagens de uma conversa
   */
  async findByConversation(
    conversationId: string,
    query: MessageQueryDto,
    user: AuthenticatedUser
  ): Promise<PaginatedResult<MessageResponseDto>> {
    // Verificar se usuário é participante
    const isParticipant = await this.conversationsRepository.isParticipant(
      conversationId,
      user.id
    )
    if (!isParticipant) {
      throw new ForbiddenException('Usuário não é participante da conversa')
    }

    const result = await this.repository.findByConversation({
      conversationId,
      messageType: query.messageType,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || 50,
      cursor: query.cursor,
    })

    return {
      data: result.data.map((m) => this.toResponseDto(m, user.id)),
      meta: result.meta,
    }
  }

  /**
   * Busca mensagem por ID
   */
  async findOne(
    id: string,
    user: AuthenticatedUser
  ): Promise<MessageResponseDto> {
    const message = await this.repository.findById(id)

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada')
    }

    // Verificar se usuário é participante da conversa
    const isParticipant = await this.conversationsRepository.isParticipant(
      message.conversationId,
      user.id
    )
    if (!isParticipant) {
      throw new ForbiddenException('Sem acesso a esta mensagem')
    }

    return this.toResponseDto(message, user.id)
  }

  /**
   * Marca mensagens como lidas
   */
  async markAsRead(
    conversationId: string,
    user: AuthenticatedUser
  ): Promise<void> {
    // Verificar se usuário é participante
    const isParticipant = await this.conversationsRepository.isParticipant(
      conversationId,
      user.id
    )
    if (!isParticipant) {
      throw new ForbiddenException('Usuário não é participante da conversa')
    }

    // Marcar mensagens como lidas
    await this.repository.markAllAsRead(conversationId, user.id)

    // Zerar unread_count do participante
    await this.participantsRepository.resetUnreadCount(conversationId, user.id)

    this.logger.debug(
      `Mensagens marcadas como lidas: conversa ${conversationId}, usuário ${user.id}`
    )
  }

  /**
   * Deleta uma mensagem (soft delete)
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const message = await this.repository.findById(id)

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada')
    }

    // Apenas o remetente pode deletar
    if (message.senderId !== user.id) {
      throw new ForbiddenException('Apenas o remetente pode deletar a mensagem')
    }

    // Soft delete
    await this.repository.softDelete(id)

    // Notificar via WebSocket
    this.gateway.emitMessageDeleted(message.conversationId, id)

    this.logger.log(`Mensagem ${id} deletada por ${user.id}`)
  }

  /**
   * Atualiza status de mensagem (usado pelo webhook)
   */
  async updateStatus(
    whatsappMessageId: string,
    status: MessageStatus
  ): Promise<void> {
    const message = await this.repository.findByWhatsappId(whatsappMessageId)

    if (!message) {
      this.logger.warn(
        `Mensagem não encontrada para whatsappMessageId: ${whatsappMessageId}`
      )
      return
    }

    await this.repository.updateStatus(message.id, status)

    // Notificar via WebSocket
    this.gateway.emitMessageStatusUpdate(
      message.conversationId,
      message.id,
      status
    )
  }

  /**
   * Valida conteúdo da mensagem baseado no tipo
   */
  private validateMessageContent(dto: SendMessageDto): void {
    const { messageType, content, metadata } = dto

    if (messageType === MessageType.text && !content?.trim()) {
      throw new BadRequestException(
        'Conteúdo é obrigatório para mensagens de texto'
      )
    }

    const mediaTypes: MessageType[] = [
      MessageType.image,
      MessageType.file,
      MessageType.audio,
      MessageType.video,
      MessageType.document,
    ]

    if (messageType && mediaTypes.includes(messageType) && !metadata?.fileUrl) {
      throw new BadRequestException('URL do arquivo é obrigatória')
    }

    if (messageType === MessageType.shift_offer && !metadata?.vagaId) {
      throw new BadRequestException(
        'ID da vaga é obrigatório para ofertas de plantão'
      )
    }
  }

  /**
   * Gera preview da mensagem
   */
  private generatePreview(dto: SendMessageDto): string {
    if (dto.content) {
      return dto.content.substring(0, 100)
    }

    const typeLabels: Record<MessageType, string> = {
      [MessageType.text]: '',
      [MessageType.image]: '📷 Imagem',
      [MessageType.file]: '📎 Arquivo',
      [MessageType.audio]: '🎵 Áudio',
      [MessageType.video]: '🎬 Vídeo',
      [MessageType.document]: '📄 Documento',
      [MessageType.shift_offer]: '📋 Oferta de Plantão',
      [MessageType.shift_response]: '✅ Resposta de Plantão',
      [MessageType.sticker]: '🏷️ Sticker',
      [MessageType.contact]: '👤 Contato',
      [MessageType.location]: '📍 Localização',
      [MessageType.interactive]: '🔘 Interativo',
      [MessageType.template]: '📝 Template',
      [MessageType.system]: '⚙️ Sistema',
    }

    return typeLabels[dto.messageType!] || ''
  }

  /**
   * Busca telefone do remetente
   */
  private async getSenderPhone(
    conversationId: string,
    userId: string
  ): Promise<string> {
    const participant =
      await this.participantsRepository.findByConversationAndUser(
        conversationId,
        userId
      )

    if (!participant) {
      throw new ForbiddenException('Participante não encontrado')
    }

    return participant.phoneNumber
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(
    message: MessageWithReply,
    currentUserId: string
  ): MessageResponseDto {
    const metadata = (message.metadata || {}) as Record<string, unknown>

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId || undefined,
      senderPhone: message.senderPhone,
      content: message.content || undefined,
      messageType: message.messageType,
      replyToId: message.replyToId || undefined,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content || undefined,
            messageType: message.replyTo.messageType,
            senderPhone: message.replyTo.senderPhone,
          }
        : undefined,
      metadata: {
        fileName: metadata.fileName as string | undefined,
        fileSize: metadata.fileSize as number | undefined,
        fileUrl: metadata.fileUrl as string | undefined,
        mimeType: metadata.mimeType as string | undefined,
        thumbnailUrl: metadata.thumbnailUrl as string | undefined,
        duration: metadata.duration as number | undefined,
        shiftOfferId: metadata.shiftOfferId as string | undefined,
        vagaId: metadata.vagaId as string | undefined,
        senderName: metadata.senderName as string | undefined,
        profilePicture: metadata.profilePicture as string | undefined,
      },
      status: message.status,
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt || undefined,
      readAt: message.readAt || undefined,
      isFromMe: message.senderId === currentUserId,
      isDeleted: !!message.deletedAt,
    }
  }
}
