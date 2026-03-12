import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CheckinCheckout, Prisma } from "@prisma/client";
import type {
  CreateCheckinCheckoutDto,
  UpdateCheckinCheckoutDto,
  CheckinCheckoutQueryDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class CheckinCheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCheckinCheckoutDto): Promise<CheckinCheckout> {
    return this.prisma.checkinCheckout.create({ data });
  }

  async findAll(
    query: CheckinCheckoutQueryDto,
  ): Promise<PaginatedResult<CheckinCheckout>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.checkinCheckout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.checkinCheckout.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<CheckinCheckout | null> {
    return this.prisma.checkinCheckout.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByVagaAndMedico(
    vagaId: string,
    medicoId: string,
  ): Promise<CheckinCheckout | null> {
    return this.prisma.checkinCheckout.findFirst({
      where: { vagaId, medicoId, ...this.prisma.notDeleted() },
    });
  }

  async update(
    id: string,
    data: UpdateCheckinCheckoutDto,
  ): Promise<CheckinCheckout> {
    return this.prisma.checkinCheckout.update({ where: { id }, data });
  }

  async updateCheckin(id: string, checkinAt: Date): Promise<CheckinCheckout> {
    return this.prisma.checkinCheckout.update({
      where: { id },
      data: { checkinAt },
    });
  }

  async updateCheckout(id: string, checkoutAt: Date): Promise<CheckinCheckout> {
    return this.prisma.checkinCheckout.update({
      where: { id },
      data: { checkoutAt },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.checkinCheckout.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(
    query: CheckinCheckoutQueryDto,
  ): Prisma.CheckinCheckoutWhereInput {
    const where: Prisma.CheckinCheckoutWhereInput = {
      ...this.prisma.notDeleted(),
    };

    if (query.vagaId) {
      where.vagaId = query.vagaId;
    }

    if (query.medicoId) {
      where.medicoId = query.medicoId;
    }

    if (query.hasCheckin !== undefined) {
      where.checkinAt = query.hasCheckin ? { not: null } : null;
    }

    if (query.hasCheckout !== undefined) {
      where.checkoutAt = query.hasCheckout ? { not: null } : null;
    }

    if (query.dataInicio || query.dataFim) {
      where.createdAt = {};
      if (query.dataInicio) {
        where.createdAt.gte = new Date(query.dataInicio);
      }
      if (query.dataFim) {
        where.createdAt.lte = new Date(query.dataFim);
      }
    }

    return where;
  }
}
