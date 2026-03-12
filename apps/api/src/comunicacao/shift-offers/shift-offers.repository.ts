/**
 * ShiftOffers Repository
 * Responsável pelo acesso a dados das ofertas de plantão
 */

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ChatShiftOffer, ShiftOfferStatus, Prisma } from "@prisma/client";
import { ShiftOfferQueryDto } from "./dto";

type Decimal = Prisma.Decimal;

export interface CreateShiftOfferData {
  vagaId: string;
  messageId?: string;
  senderId: string;
  recipientId?: string;
  recipientMedicoId?: string;
  recipientPhone: string;
  expiresAt: Date;
}

export interface ShiftOfferWithRelations extends ChatShiftOffer {
  vaga: {
    id: string;
    data: Date;
    horaInicio: string;
    horaFim: string;
    valor: Decimal;
    hospital: { nome: string };
    setor: { nome: string };
    especialidade: { nome: string };
  };
  recipientMedico: {
    id: string;
    nome: string;
  } | null;
}

@Injectable()
export class ShiftOffersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateShiftOfferData): Promise<ChatShiftOffer> {
    return this.prisma.chatShiftOffer.create({
      data: {
        vagaId: data.vagaId,
        messageId: data.messageId,
        senderId: data.senderId,
        recipientId: data.recipientId,
        recipientMedicoId: data.recipientMedicoId,
        recipientPhone: data.recipientPhone,
        expiresAt: data.expiresAt,
        status: ShiftOfferStatus.pending,
      },
    });
  }

  async findById(id: string): Promise<ShiftOfferWithRelations | null> {
    return this.prisma.chatShiftOffer.findUnique({
      where: { id },
      include: {
        vaga: {
          select: {
            id: true,
            data: true,
            horaInicio: true,
            horaFim: true,
            valor: true,
            hospital: { select: { nome: true } },
            setor: { select: { nome: true } },
            especialidade: { select: { nome: true } },
          },
        },
        recipientMedico: {
          select: { id: true, nome: true },
        },
      },
    });
  }

  async findByMessageId(messageId: string): Promise<ChatShiftOffer | null> {
    return this.prisma.chatShiftOffer.findUnique({
      where: { messageId },
    });
  }

  async findAll(
    userId: string,
    query: ShiftOfferQueryDto,
  ): Promise<{
    data: ShiftOfferWithRelations[];
    total: number;
  }> {
    const {
      status,
      vagaId,
      recipientMedicoId,
      sentByMe,
      receivedByMe,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.ChatShiftOfferWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (vagaId) {
      where.vagaId = vagaId;
    }

    if (recipientMedicoId) {
      where.recipientMedicoId = recipientMedicoId;
    }

    if (sentByMe) {
      where.senderId = userId;
    }

    if (receivedByMe) {
      where.OR = [{ recipientId: userId }, { recipientMedicoId: userId }];
    }

    // Se não especificou filtro, mostrar apenas as do usuário
    if (!sentByMe && !receivedByMe) {
      where.OR = [
        { senderId: userId },
        { recipientId: userId },
        { recipientMedicoId: userId },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.chatShiftOffer.findMany({
        where,
        include: {
          vaga: {
            select: {
              id: true,
              data: true,
              horaInicio: true,
              horaFim: true,
              valor: true,
              hospital: { select: { nome: true } },
              setor: { select: { nome: true } },
              especialidade: { select: { nome: true } },
            },
          },
          recipientMedico: {
            select: { id: true, nome: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatShiftOffer.count({ where }),
    ]);

    return { data, total };
  }

  async updateStatus(
    id: string,
    status: ShiftOfferStatus,
    respondedAt?: Date,
  ): Promise<ChatShiftOffer> {
    return this.prisma.chatShiftOffer.update({
      where: { id },
      data: {
        status,
        respondedAt: respondedAt || new Date(),
      },
    });
  }

  async updateMessageId(
    id: string,
    messageId: string,
  ): Promise<ChatShiftOffer> {
    return this.prisma.chatShiftOffer.update({
      where: { id },
      data: { messageId },
    });
  }

  async expirePendingOffers(): Promise<number> {
    const result = await this.prisma.chatShiftOffer.updateMany({
      where: {
        status: ShiftOfferStatus.pending,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: ShiftOfferStatus.expired,
      },
    });
    return result.count;
  }

  async cancel(id: string): Promise<ChatShiftOffer> {
    return this.prisma.chatShiftOffer.update({
      where: { id },
      data: {
        status: ShiftOfferStatus.cancelled,
      },
    });
  }
}
