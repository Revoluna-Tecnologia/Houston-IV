import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Setor, Prisma } from "../generated/prisma/client";
import type { CreateSetorDto, UpdateSetorDto, SetorQueryDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class SetoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSetorDto): Promise<Setor> {
    return this.prisma.setor.create({ data });
  }

  async findAll(query: SetorQueryDto): Promise<PaginatedResult<Setor>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.setor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.setor.count({ where }),
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

  async findById(id: string): Promise<Setor | null> {
    return this.prisma.setor.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByNomeAndHospital(
    nome: string,
    hospitalId: string,
  ): Promise<Setor | null> {
    return this.prisma.setor.findFirst({
      where: { nome, hospitalId, ...this.prisma.notDeleted() },
    });
  }

  async findByNomeAndHospitalExcludingId(
    nome: string,
    hospitalId: string,
    id: string,
  ): Promise<Setor | null> {
    return this.prisma.setor.findFirst({
      where: { nome, hospitalId, NOT: { id }, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: UpdateSetorDto): Promise<Setor> {
    return this.prisma.setor.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.setor.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(query: SetorQueryDto): Prisma.SetorWhereInput {
    const where: Prisma.SetorWhereInput = {
      ...this.prisma.notDeleted(),
    };

    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    if (query.hospitalId) {
      where.hospitalId = query.hospitalId;
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
