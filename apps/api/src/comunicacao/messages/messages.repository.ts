import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ChatMessage,
  MessageType,
  MessageStatus,
  Prisma,
} from "../../generated/prisma/client";
import { PaginatedResult, MessageMetadata } from "../types";

// Tipo para mensagem com reply incluído
export type MessageWithReply = ChatMessage & {
  replyTo?: {
    id: string;
    content: string | null;
    messageType: MessageType;
    senderPhone: string;
  } | null;
};

// Dados para criar mensagem
export interface CreateMessageData {
  conversationId: string;
  senderId?: string;
  senderPhone: string;
  content?: string;
  messageType?: MessageType;
  replyToId?: string;
  metadata?: MessageMetadata;
  status?: MessageStatus;
  whatsappMessageId?: string;
}

// Filtros de busca internos do repository (com campos obrigatórios)
export interface RepositoryMessageFilters {
  conversationId: string;
  messageType?: MessageType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page: number;
  limit: number;
  cursor?: string;
}

/**
 * Repository de Mensagens
 * Responsabilidade única: Acesso a dados de mensagens no banco
 */
@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova mensagem
   */
  async create(data: CreateMessageData): Promise<MessageWithReply> {
    return this.prisma.chatMessage.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderPhone: data.senderPhone,
        content: data.content,
        messageType: data.messageType || MessageType.text,
        replyToId: data.replyToId,
        metadata: data.metadata ? (data.metadata as Prisma.JsonObject) : {},
        status: data.status || MessageStatus.sending,
        whatsappMessageId: data.whatsappMessageId,
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            senderPhone: true,
          },
        },
      },
    });
  }

  /**
   * Busca mensagem por ID
   */
  async findById(id: string): Promise<MessageWithReply | null> {
    return this.prisma.chatMessage.findUnique({
      where: { id },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            senderPhone: true,
          },
        },
      },
    });
  }

  /**
   * Busca mensagem por whatsappMessageId
   */
  async findByWhatsappId(
    whatsappMessageId: string,
  ): Promise<MessageWithReply | null> {
    return this.prisma.chatMessage.findFirst({
      where: { whatsappMessageId },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            senderPhone: true,
          },
        },
      },
    });
  }

  /**
   * Lista mensagens de uma conversa com paginação
   */
  async findByConversation(
    filters: RepositoryMessageFilters,
  ): Promise<PaginatedResult<MessageWithReply>> {
    const {
      conversationId,
      messageType,
      startDate,
      endDate,
      search,
      page,
      limit,
      cursor,
    } = filters;

    // Construir where clause
    const where: Prisma.ChatMessageWhereInput = {
      conversationId,
      deletedAt: null,
    };

    if (messageType) {
      where.messageType = messageType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    // Se usar cursor, filtrar a partir dele
    if (cursor) {
      where.id = { lt: cursor };
    }

    const skip = cursor ? 0 : (page - 1) * limit;

    // Buscar total e dados em paralelo
    const [total, data] = await Promise.all([
      this.prisma.chatMessage.count({ where }),
      this.prisma.chatMessage.findMany({
        where,
        include: {
          replyTo: {
            select: {
              id: true,
              content: true,
              messageType: true,
              senderPhone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const lastMessage = data[data.length - 1];

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: cursor ? data.length === limit : page < totalPages,
        hasPrev: page > 1,
        ...(cursor && lastMessage ? { cursor: lastMessage.id } : {}),
      },
    };
  }

  /**
   * Atualiza uma mensagem
   */
  async update(
    id: string,
    data: Partial<
      Pick<
        ChatMessage,
        "status" | "whatsappMessageId" | "deliveredAt" | "readAt" | "deletedAt"
      >
    >,
  ): Promise<ChatMessage> {
    return this.prisma.chatMessage.update({
      where: { id },
      data,
    });
  }

  /**
   * Atualiza status da mensagem
   */
  async updateStatus(id: string, status: MessageStatus): Promise<void> {
    const updateData: Prisma.ChatMessageUpdateInput = { status };

    if (status === MessageStatus.delivered) {
      updateData.deliveredAt = new Date();
    } else if (status === MessageStatus.read) {
      updateData.readAt = new Date();
    }

    await this.prisma.chatMessage.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete de mensagem
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.chatMessage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Marca todas as mensagens como lidas
   */
  async markAllAsRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: MessageStatus.read },
        deletedAt: null,
      },
      data: {
        status: MessageStatus.read,
        readAt: new Date(),
      },
    });
  }

  /**
   * Conta mensagens não lidas de uma conversa
   */
  async countUnread(conversationId: string, userId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: MessageStatus.read },
        deletedAt: null,
      },
    });
  }
}
