import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ChatParticipant, ParticipantRole } from '@prisma/client'

// Tipo de participante com médico e user incluídos
export type ParticipantWithMedico = ChatParticipant & {
  medico?: {
    id: string
    nome: string
    telefone: string | null
  } | null
  user?: {
    id: string
    image: string | null
  } | null
}

// Dados para criar participante
export interface CreateParticipantData {
  conversationId: string
  userId?: string
  medicoId?: string
  phoneNumber: string
  role?: ParticipantRole
}

/**
 * Repository de Participantes
 * Responsabilidade única: Acesso a dados de participantes no banco
 */
@Injectable()
export class ParticipantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adiciona um participante a uma conversa
   */
  async create(data: CreateParticipantData): Promise<ParticipantWithMedico> {
    const normalizedPhone = this.normalizePhone(data.phoneNumber)

    return this.prisma.chatParticipant.create({
      data: {
        conversationId: data.conversationId,
        userId: data.userId,
        medicoId: data.medicoId,
        phoneNumber: normalizedPhone,
        role: data.role || ParticipantRole.member,
      },
      include: {
        medico: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        user: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    })
  }

  /**
   * Adiciona múltiplos participantes em batch
   */
  async createMany(
    participants: CreateParticipantData[]
  ): Promise<ParticipantWithMedico[]> {
    const results: ParticipantWithMedico[] = []

    for (const data of participants) {
      const participant = await this.create(data)
      results.push(participant)
    }

    return results
  }

  /**
   * Busca participante por ID
   */
  async findById(id: string): Promise<ParticipantWithMedico | null> {
    return this.prisma.chatParticipant.findUnique({
      where: { id },
      include: {
        medico: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        user: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    })
  }

  /**
   * Busca participante por conversa e telefone
   */
  async findByConversationAndPhone(
    conversationId: string,
    phoneNumber: string
  ): Promise<ParticipantWithMedico | null> {
    const normalizedPhone = this.normalizePhone(phoneNumber)

    return this.prisma.chatParticipant.findFirst({
      where: {
        conversationId,
        phoneNumber: normalizedPhone,
        leftAt: null,
      },
      include: {
        medico: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        user: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    })
  }

  /**
   * Busca participante por conversa e userId
   */
  async findByConversationAndUser(
    conversationId: string,
    userId: string
  ): Promise<ParticipantWithMedico | null> {
    return this.prisma.chatParticipant.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
      include: {
        medico: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        user: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    })
  }

  /**
   * Lista participantes de uma conversa
   */
  async findByConversation(
    conversationId: string,
    includeLeft = false
  ): Promise<ParticipantWithMedico[]> {
    return this.prisma.chatParticipant.findMany({
      where: {
        conversationId,
        ...(includeLeft ? {} : { leftAt: null }),
      },
      include: {
        medico: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        user: {
          select: {
            id: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })
  }

  /**
   * Atualiza configurações do participante
   */
  async update(
    id: string,
    data: Partial<Pick<ChatParticipant, 'role' | 'isMuted' | 'lastReadAt'>>
  ): Promise<ChatParticipant> {
    return this.prisma.chatParticipant.update({
      where: { id },
      data,
    })
  }

  /**
   * Remove participante (soft delete - marca leftAt)
   */
  async remove(id: string): Promise<void> {
    await this.prisma.chatParticipant.update({
      where: { id },
      data: { leftAt: new Date() },
    })
  }

  /**
   * Zera contador de não lidas do participante
   */
  async resetUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await this.prisma.chatParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    })
  }

  /**
   * Incrementa contador de não lidas para todos exceto o remetente
   */
  async incrementUnreadExcept(
    conversationId: string,
    exceptPhone: string
  ): Promise<void> {
    const normalizedPhone = this.normalizePhone(exceptPhone)

    await this.prisma.chatParticipant.updateMany({
      where: {
        conversationId,
        phoneNumber: { not: normalizedPhone },
        leftAt: null,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    })
  }

  /**
   * Busca unread count do participante
   */
  async getUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
      select: { unreadCount: true },
    })
    return participant?.unreadCount || 0
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
