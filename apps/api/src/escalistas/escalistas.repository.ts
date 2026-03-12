import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Escalista, Prisma } from "@prisma/client";
import type {
  CreateEscalistaDto,
  UpdateEscalistaDto,
  EscalistaQueryDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class EscalistasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEscalistaDto): Promise<Escalista> {
    return this.prisma.escalista.create({ data });
  }

  async findAll(query: EscalistaQueryDto): Promise<PaginatedResult<Escalista>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.escalista.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.escalista.count({ where }),
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

  async findById(id: string): Promise<Escalista | null> {
    return this.prisma.escalista.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByMedicoAndGrupo(
    medicoId: string,
    grupoId: string,
  ): Promise<Escalista | null> {
    return this.prisma.escalista.findFirst({
      where: { medicoId, grupoId, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: UpdateEscalistaDto): Promise<Escalista> {
    return this.prisma.escalista.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.escalista.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  async medicoExists(id: string): Promise<boolean> {
    const count = await this.prisma.medico.count({
      where: { id, ...this.prisma.notDeleted() },
    });
    return count > 0;
  }

  async grupoExists(id: string): Promise<boolean> {
    const count = await this.prisma.grupo.count({
      where: { id, ...this.prisma.notDeleted() },
    });
    return count > 0;
  }

  private buildWhereClause(
    query: EscalistaQueryDto,
  ): Prisma.EscalistaWhereInput {
    const where: Prisma.EscalistaWhereInput = {
      ...this.prisma.notDeleted(),
    };
    if (query.status) where.status = query.status;
    if (query.medicoId) where.medicoId = query.medicoId;
    if (query.grupoId) where.grupoId = query.grupoId;
    return where;
  }
}
