import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  Conversation,
  ChatParticipant,
  ConversationType,
  Prisma,
} from '@prisma/client'
import { PaginatedResult } from '../types'

// Tipo para conversa com participantes incluídos
export type ConversationWithParticipants = Conversation & {
  participants: (ChatParticipant & {
    medico?: {
      id: string
      nome: string
      telefone: string | null
    } | null
  })[]
}

// Dados para criar conversa
export interface CreateConversationData {
  type: ConversationType
  name?: string
  createdById: string
  grupoId: string
  zapsterGroupId?: string
}

// Filtros de busca internos do repository (com campos obrigatórios)
export interface RepositoryConversationFilters {
  type?: ConversationType
  isArchived?: boolean
  search?: string
  grupoIds: string[]
  userId: string
  page: number
  limit: number
}

/**
 * Repository de Conversas
 * Responsabilidade única: Acesso a dados de conversas no banco
 */
@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova conversa
   */
  async create(data: CreateConversationData): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: {
        type: data.type,
        name: data.name,
        createdById: data.createdById,
        grupoId: data.grupoId,
        zapsterGroupId: data.zapsterGroupId,
      },
    })
  }

  /**
   * Busca conversa por ID com participantes
   */
  async findById(id: string): Promise<ConversationWithParticipants | null> {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            medico: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Busca conversa por zapsterGroupId
   */
  async findByZapsterGroupId(
    zapsterGroupId: string
  ): Promise<ConversationWithParticipants | null> {
    return this.prisma.conversation.findFirst({
      where: { zapsterGroupId },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            medico: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Busca conversa direta por telefone (entre dois participantes)
   */
  async findDirectByPhone(
    grupoId: string,
    phone1: string,
    phone2: string
  ): Promise<ConversationWithParticipants | null> {
    const normalizedPhone1 = this.normalizePhone(phone1)
    const normalizedPhone2 = this.normalizePhone(phone2)

    return this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        grupoId,
        AND: [
          {
            participants: {
              some: {
                phoneNumber: normalizedPhone1,
                leftAt: null,
              },
            },
          },
          {
            participants: {
              some: {
                phoneNumber: normalizedPhone2,
                leftAt: null,
              },
            },
          },
        ],
      },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            medico: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Busca conversa direta por telefone do participante (para webhooks)
   * Retorna a primeira conversa direta onde o telefone é participante
   */
  async findDirectByParticipantPhone(
    phone: string
  ): Promise<ConversationWithParticipants | null> {
    const normalizedPhone = this.normalizePhone(phone)

    return this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        participants: {
          some: {
            phoneNumber: normalizedPhone,
            leftAt: null,
          },
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            medico: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Lista conversas do usuário com paginação
   */
  async findAll(
    filters: RepositoryConversationFilters
  ): Promise<PaginatedResult<ConversationWithParticipants>> {
    const { type, isArchived, search, grupoIds, userId, page, limit } = filters
    const skip = (page - 1) * limit

    // Construir where clause
    const where: Prisma.ConversationWhereInput = {
      grupoId: { in: grupoIds },
      participants: {
        some: {
          userId,
          leftAt: null,
        },
      },
    }

    if (type) {
      where.type = type
    }

    if (isArchived !== undefined) {
      where.isArchived = isArchived
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          participants: {
            some: {
              phoneNumber: { contains: search },
            },
          },
        },
      ]
    }

    // Buscar total e dados em paralelo
    const [total, data] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        include: {
          participants: {
            where: { leftAt: null },
            include: {
              medico: {
                select: {
                  id: true,
                  nome: true,
                  telefone: true,
                },
              },
            },
          },
        },
        orderBy: [
          { lastMessageAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  /**
   * Atualiza uma conversa
   */
  async update(
    id: string,
    data: Partial<Pick<Conversation, 'name' | 'isArchived' | 'lastMessageAt' | 'lastMessagePreview'>>
  ): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id },
      data,
    })
  }

  /**
   * Deleta uma conversa (soft delete não implementado, usa hard delete)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.conversation.delete({
      where: { id },
    })
  }

  /**
   * Verifica se usuário é participante da conversa
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
    })
    return !!participant
  }

  /**
   * Busca IDs de conversas do usuário
   */
  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        conversationId: true,
      },
    })
    return participants.map((p) => p.conversationId)
  }

  /**
   * Normaliza telefone para formato padrão
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, '')
    if (!normalized.startsWith('55')) {
      normalized = '55' + normalized
    }
    return normalized
  }
}
