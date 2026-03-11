import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ConversationsRepository, ConversationWithParticipants } from './conversations.repository'
import { ParticipantsRepository, ParticipantWithMedico } from './participants.repository'
import {
  CreateConversationDto,
  UpdateConversationDto,
  ConversationQueryDto,
  ConversationResponseDto,
  ParticipantResponseDto,
  AddParticipantDto,
} from './dto'
import { PaginatedResult, ConversationType, ParticipantRole } from '../types'
import { AuthenticatedUser } from '../../auth/types/auth.types'
import { PermissionsService } from '../../auth/services/permissions.service'

/**
 * Service de Conversas
 * Responsabilidade única: Lógica de negócio de conversas
 */
@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name)

  constructor(
    private readonly repository: ConversationsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Cria uma nova conversa
   */
  async create(
    dto: CreateConversationDto,
    user: AuthenticatedUser
  ): Promise<ConversationResponseDto> {
    // Validar acesso ao grupo
    if (!this.permissionsService.hasAccessToGrupo(user, dto.grupoId)) {
      throw new ForbiddenException('Sem acesso ao grupo especificado')
    }

    // Validar nome para grupos
    if (dto.type === ConversationType.group && !dto.name) {
      throw new BadRequestException('Nome é obrigatório para grupos')
    }

    // Para conversas diretas, validar que há exatamente 1 destinatário
    if (dto.type === ConversationType.direct && dto.participantPhones.length !== 1) {
      throw new BadRequestException(
        'Conversas diretas devem ter exatamente 1 destinatário'
      )
    }

    // Para conversas diretas, verificar se já existe
    if (dto.type === ConversationType.direct) {
      // Buscar telefone do usuário atual
      const currentUserPhone = await this.getUserPhone(user.id)
      if (currentUserPhone) {
        const existing = await this.repository.findDirectByPhone(
          dto.grupoId,
          currentUserPhone,
          dto.participantPhones[0]
        )
        if (existing) {
          return this.toResponseDto(existing, user.id)
        }
      }
    }

    // Criar conversa
    const conversation = await this.repository.create({
      type: dto.type,
      name: dto.name,
      createdById: user.id,
      grupoId: dto.grupoId,
    })

    // Buscar telefone do criador
    const creatorPhone = await this.getUserPhone(user.id)

    // Adicionar criador como admin
    if (creatorPhone) {
      await this.participantsRepository.create({
        conversationId: conversation.id,
        userId: user.id,
        phoneNumber: creatorPhone,
        role: ParticipantRole.admin,
      })
    }

    // Adicionar participantes
    for (const phone of dto.participantPhones) {
      // Verificar se há médico com esse telefone
      const medico = await this.findMedicoByPhone(phone)

      await this.participantsRepository.create({
        conversationId: conversation.id,
        phoneNumber: phone,
        medicoId: medico?.id,
        role: ParticipantRole.member,
      })
    }

    // Adicionar participantes por medicoId
    if (dto.participantMedicoIds) {
      for (const medicoId of dto.participantMedicoIds) {
        const medico = await this.prisma.medico.findUnique({
          where: { id: medicoId },
          select: { id: true, telefone: true },
        })

        if (medico?.telefone) {
          // Verificar se já não foi adicionado pelo telefone
          const exists = await this.participantsRepository.findByConversationAndPhone(
            conversation.id,
            medico.telefone
          )

          if (!exists) {
            await this.participantsRepository.create({
              conversationId: conversation.id,
              phoneNumber: medico.telefone,
              medicoId: medico.id,
              role: ParticipantRole.member,
            })
          }
        }
      }
    }

    // Buscar conversa completa
    const created = await this.repository.findById(conversation.id)
    if (!created) {
      throw new NotFoundException('Erro ao criar conversa')
    }

    this.logger.log(`Conversa criada: ${conversation.id} por ${user.id}`)

    return this.toResponseDto(created, user.id)
  }

  /**
   * Lista conversas do usuário
   */
  async findAll(
    query: ConversationQueryDto,
    user: AuthenticatedUser
  ): Promise<PaginatedResult<ConversationResponseDto>> {
    const result = await this.repository.findAll({
      type: query.type,
      isArchived: query.isArchived,
      search: query.search,
      grupoIds: user.grupoIds,
      userId: user.id,
      page: query.page || 1,
      limit: query.limit || 20,
    })

    return {
      data: result.data.map((c) => this.toResponseDto(c, user.id)),
      meta: result.meta,
    }
  }

  /**
   * Busca conversa por ID
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<ConversationResponseDto> {
    const conversation = await this.findOneOrFail(id, user)
    return this.toResponseDto(conversation, user.id)
  }

  /**
   * Atualiza uma conversa
   */
  async update(
    id: string,
    dto: UpdateConversationDto,
    user: AuthenticatedUser
  ): Promise<ConversationResponseDto> {
    // Valida que conversa existe e usuário tem acesso
    await this.findOneOrFail(id, user)

    // Verificar se é admin da conversa
    const participant = await this.participantsRepository.findByConversationAndUser(
      id,
      user.id
    )
    if (participant?.role !== ParticipantRole.admin) {
      throw new ForbiddenException('Apenas administradores podem editar a conversa')
    }

    await this.repository.update(id, dto)

    const updated = await this.repository.findById(id)
    if (!updated) {
      throw new NotFoundException('Conversa não encontrada')
    }

    return this.toResponseDto(updated, user.id)
  }

  /**
   * Arquiva/desarquiva uma conversa
   */
  async archive(
    id: string,
    archive: boolean,
    user: AuthenticatedUser
  ): Promise<void> {
    await this.findOneOrFail(id, user)
    await this.repository.update(id, { isArchived: archive })
    this.logger.log(`Conversa ${id} ${archive ? 'arquivada' : 'desarquivada'} por ${user.id}`)
  }

  /**
   * Deleta uma conversa
   */
  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const conversation = await this.findOneOrFail(id, user)

    // Apenas criador ou admin pode deletar
    const participant = await this.participantsRepository.findByConversationAndUser(
      id,
      user.id
    )
    if (
      conversation.createdById !== user.id &&
      participant?.role !== ParticipantRole.admin
    ) {
      throw new ForbiddenException('Sem permissão para deletar esta conversa')
    }

    await this.repository.delete(id)
    this.logger.log(`Conversa ${id} deletada por ${user.id}`)
  }

  /**
   * Adiciona participante a uma conversa
   */
  async addParticipant(
    conversationId: string,
    dto: AddParticipantDto,
    user: AuthenticatedUser
  ): Promise<ParticipantResponseDto> {
    const conversation = await this.findOneOrFail(conversationId, user)

    // Apenas grupos podem ter participantes adicionados
    if (conversation.type === ConversationType.direct) {
      throw new BadRequestException(
        'Não é possível adicionar participantes a conversas diretas'
      )
    }

    // Verificar se usuário é admin
    const userParticipant = await this.participantsRepository.findByConversationAndUser(
      conversationId,
      user.id
    )
    if (userParticipant?.role !== ParticipantRole.admin) {
      throw new ForbiddenException('Apenas administradores podem adicionar participantes')
    }

    // Verificar se já existe
    const existing = await this.participantsRepository.findByConversationAndPhone(
      conversationId,
      dto.phoneNumber
    )
    if (existing) {
      throw new BadRequestException('Participante já existe na conversa')
    }

    const participant = await this.participantsRepository.create({
      conversationId,
      phoneNumber: dto.phoneNumber,
      medicoId: dto.medicoId,
      role: dto.role,
    })

    this.logger.log(
      `Participante ${dto.phoneNumber} adicionado à conversa ${conversationId} por ${user.id}`
    )

    return this.toParticipantDto(participant)
  }

  /**
   * Remove participante de uma conversa
   */
  async removeParticipant(
    conversationId: string,
    participantId: string,
    user: AuthenticatedUser
  ): Promise<void> {
    const conversation = await this.findOneOrFail(conversationId, user)

    if (conversation.type === ConversationType.direct) {
      throw new BadRequestException(
        'Não é possível remover participantes de conversas diretas'
      )
    }

    // Verificar se usuário é admin ou é o próprio participante
    const userParticipant = await this.participantsRepository.findByConversationAndUser(
      conversationId,
      user.id
    )
    const targetParticipant = await this.participantsRepository.findById(participantId)

    if (!targetParticipant) {
      throw new NotFoundException('Participante não encontrado')
    }

    const isAdmin = userParticipant?.role === ParticipantRole.admin
    const isSelf = targetParticipant.userId === user.id

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Sem permissão para remover este participante')
    }

    await this.participantsRepository.remove(participantId)
    this.logger.log(
      `Participante ${participantId} removido da conversa ${conversationId} por ${user.id}`
    )
  }

  /**
   * Verifica se usuário é participante da conversa
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    return this.repository.isParticipant(conversationId, userId)
  }

  /**
   * Busca IDs de conversas do usuário
   */
  async getUserConversationIds(userId: string): Promise<string[]> {
    return this.repository.getUserConversationIds(userId)
  }

  /**
   * Busca conversa ou lança erro
   */
  private async findOneOrFail(
    id: string,
    user: AuthenticatedUser
  ): Promise<ConversationWithParticipants> {
    const conversation = await this.repository.findById(id)

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada')
    }

    // Verificar se usuário é participante
    const isParticipant = conversation.participants.some(
      (p) => p.userId === user.id && !p.leftAt
    )

    if (!isParticipant) {
      throw new ForbiddenException('Sem acesso a esta conversa')
    }

    return conversation
  }

  /**
   * Busca telefone do usuário
   * @param userId - ID do usuário para buscar telefone associado
   */
  private async getUserPhone(userId: string): Promise<string | null> {
    // Busca escalista pelo userId
    const escalista = await this.prisma.escalista.findFirst({
      where: {
        id: userId,
      },
      include: {
        medico: {
          select: { telefone: true },
        },
      },
    })

    if (escalista?.medico?.telefone) {
      return escalista.medico.telefone
    }

    // Se não encontrar, retorna null (o usuário não tem telefone cadastrado)
    return null
  }

  /**
   * Busca médico por telefone
   */
  private async findMedicoByPhone(
    phone: string
  ): Promise<{ id: string } | null> {
    const normalized = this.normalizePhone(phone)

    return this.prisma.medico.findFirst({
      where: {
        telefone: {
          contains: normalized.slice(-9), // Últimos 9 dígitos
        },
      },
      select: { id: true },
    })
  }

  /**
   * Normaliza telefone
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, '')
    if (!normalized.startsWith('55')) {
      normalized = '55' + normalized
    }
    return normalized
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(
    conversation: ConversationWithParticipants,
    currentUserId: string
  ): ConversationResponseDto {
    const participants = conversation.participants
      .filter((p) => !p.leftAt)
      .map((p) => this.toParticipantDto(p))

    const currentParticipant = conversation.participants.find(
      (p) => p.userId === currentUserId
    )

    // Para conversas diretas, identificar o outro participante
    let otherParticipant: ParticipantResponseDto | undefined
    if (conversation.type === ConversationType.direct) {
      const other = conversation.participants.find(
        (p) => p.userId !== currentUserId && !p.leftAt
      )
      if (other) {
        otherParticipant = this.toParticipantDto(other)
      }
    }

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name || undefined,
      grupoId: conversation.grupoId,
      isArchived: conversation.isArchived,
      lastMessageAt: conversation.lastMessageAt || undefined,
      lastMessagePreview: conversation.lastMessagePreview || undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants,
      otherParticipant,
      unreadCount: currentParticipant?.unreadCount || 0,
    }
  }

  /**
   * Converte participante para DTO
   */
  private toParticipantDto(participant: ParticipantWithMedico): ParticipantResponseDto {
    return {
      id: participant.id,
      phoneNumber: participant.phoneNumber,
      role: participant.role,
      name: participant.medico?.nome,
      avatarUrl: participant.user?.image ?? undefined,
      userId: participant.userId || undefined,
      medicoId: participant.medicoId || undefined,
      isMuted: participant.isMuted,
      unreadCount: participant.unreadCount,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt || undefined,
    }
  }
}
