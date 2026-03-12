import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Vaga, Prisma } from "../generated/prisma/client";
import type { CreateVagaDto, VagaQueryDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class VagasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVagaDto): Promise<Vaga> {
    return this.prisma.vaga.create({
      data: {
        data: new Date(data.data),
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        valor: data.valor,
        observacoes: data.observacoes,
        hospitalId: data.hospitalId,
        setorId: data.setorId,
        especialidadeId: data.especialidadeId,
      },
    });
  }

  async findAll(query: VagaQueryDto): Promise<PaginatedResult<Vaga>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.vaga.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.vaga.count({ where }),
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

  async findById(id: string): Promise<Vaga | null> {
    return this.prisma.vaga.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findConflicting(
    hospitalId: string,
    setorId: string,
    data: Date,
    horaInicio: string,
    horaFim: string,
    excludeId?: string,
  ): Promise<Vaga | null> {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.vaga.findFirst({
      where: {
        hospitalId,
        setorId,
        data: { gte: startOfDay, lte: endOfDay },
        NOT: excludeId ? { id: excludeId } : undefined,
        OR: [{ horaInicio: { lt: horaFim }, horaFim: { gt: horaInicio } }],
        ...this.prisma.notDeleted(),
      },
    });
  }

  async update(id: string, data: Prisma.VagaUpdateInput): Promise<Vaga> {
    return this.prisma.vaga.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vaga.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(query: VagaQueryDto): Prisma.VagaWhereInput {
    const where: Prisma.VagaWhereInput = {
      ...this.prisma.notDeleted(),
    };
    if (query.status) where.status = query.status;
    if (query.hospitalId) where.hospitalId = query.hospitalId;
    if (query.setorId) where.setorId = query.setorId;
    if (query.especialidadeId) where.especialidadeId = query.especialidadeId;
    if (query.dataInicio || query.dataFim) {
      where.data = {};
      if (query.dataInicio) where.data.gte = new Date(query.dataInicio);
      if (query.dataFim) where.data.lte = new Date(query.dataFim);
    }
    return where;
  }
}
