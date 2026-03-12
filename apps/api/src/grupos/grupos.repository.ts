import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Grupo, Prisma } from "@prisma/client";
import type { CreateGrupoDto, UpdateGrupoDto, GrupoQueryDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class GruposRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateGrupoDto): Promise<Grupo> {
    return this.prisma.grupo.create({ data });
  }

  async findAll(query: GrupoQueryDto): Promise<PaginatedResult<Grupo>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.grupo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.grupo.count({ where }),
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

  async findById(id: string): Promise<Grupo | null> {
    return this.prisma.grupo.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByNome(nome: string): Promise<Grupo | null> {
    return this.prisma.grupo.findFirst({
      where: { nome, ...this.prisma.notDeleted() },
    });
  }

  async findByNomeExcludingId(nome: string, id: string): Promise<Grupo | null> {
    return this.prisma.grupo.findFirst({
      where: { nome, NOT: { id }, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: UpdateGrupoDto): Promise<Grupo> {
    return this.prisma.grupo.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.grupo.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(query: GrupoQueryDto): Prisma.GrupoWhereInput {
    const where: Prisma.GrupoWhereInput = {
      ...this.prisma.notDeleted(),
    };

    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: "insensitive" } },
        { descricao: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}
