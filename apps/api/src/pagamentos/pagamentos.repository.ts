import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Pagamento, Prisma } from "@prisma/client";
import type {
  CreatePagamentoDto,
  UpdatePagamentoDto,
  PagamentoQueryDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class PagamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePagamentoDto): Promise<Pagamento> {
    return this.prisma.pagamento.create({ data });
  }

  async findAll(query: PagamentoQueryDto): Promise<PaginatedResult<Pagamento>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.pagamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.pagamento.count({ where }),
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

  async findById(id: string): Promise<Pagamento | null> {
    return this.prisma.pagamento.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByVagaAndMedico(
    vagaId: string,
    medicoId: string,
  ): Promise<Pagamento | null> {
    return this.prisma.pagamento.findFirst({
      where: { vagaId, medicoId, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: UpdatePagamentoDto): Promise<Pagamento> {
    return this.prisma.pagamento.update({ where: { id }, data });
  }

  async updateMany(
    ids: string[],
    data: Partial<UpdatePagamentoDto>,
  ): Promise<number> {
    const result = await this.prisma.pagamento.updateMany({
      where: { id: { in: ids } },
      data,
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pagamento.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  async sumByMedico(medicoId: string): Promise<number> {
    const result = await this.prisma.pagamento.aggregate({
      where: { medicoId, ...this.prisma.notDeleted() },
      _sum: { valor: true },
    });
    return result._sum.valor?.toNumber() ?? 0;
  }

  async sumByPeriod(dataInicio: Date, dataFim: Date): Promise<number> {
    const result = await this.prisma.pagamento.aggregate({
      where: {
        createdAt: { gte: dataInicio, lte: dataFim },
        ...this.prisma.notDeleted(),
      },
      _sum: { valor: true },
    });
    return result._sum.valor?.toNumber() ?? 0;
  }

  private buildWhereClause(
    query: PagamentoQueryDto,
  ): Prisma.PagamentoWhereInput {
    const where: Prisma.PagamentoWhereInput = {
      ...this.prisma.notDeleted(),
    };

    if (query.vagaId) where.vagaId = query.vagaId;
    if (query.medicoId) where.medicoId = query.medicoId;
    if (query.status) where.status = query.status;

    if (query.dataInicio || query.dataFim) {
      where.createdAt = {};
      if (query.dataInicio) where.createdAt.gte = new Date(query.dataInicio);
      if (query.dataFim) where.createdAt.lte = new Date(query.dataFim);
    }

    return where;
  }
}
