import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Medico, Prisma } from "../generated/prisma/client";
import type { CreateMedicoDto, UpdateMedicoDto, MedicoQueryDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class MedicosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMedicoDto): Promise<Medico> {
    return this.prisma.medico.create({ data });
  }

  async findAll(query: MedicoQueryDto): Promise<PaginatedResult<Medico>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.medico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.medico.count({ where }),
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

  async findById(id: string): Promise<Medico | null> {
    return this.prisma.medico.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByCrmAndUf(crm: string, crmUf: string): Promise<Medico | null> {
    return this.prisma.medico.findFirst({
      where: { crm, crmUf, ...this.prisma.notDeleted() },
    });
  }

  async findByCrmAndUfExcludingId(
    crm: string,
    crmUf: string,
    id: string,
  ): Promise<Medico | null> {
    return this.prisma.medico.findFirst({
      where: { crm, crmUf, NOT: { id }, ...this.prisma.notDeleted() },
    });
  }

  async findByCpf(cpf: string): Promise<Medico | null> {
    return this.prisma.medico.findFirst({
      where: { cpf, ...this.prisma.notDeleted() },
    });
  }

  async findByEmail(email: string): Promise<Medico | null> {
    return this.prisma.medico.findFirst({
      where: { email, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: UpdateMedicoDto): Promise<Medico> {
    return this.prisma.medico.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.medico.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(query: MedicoQueryDto): Prisma.MedicoWhereInput {
    const where: Prisma.MedicoWhereInput = {
      ...this.prisma.notDeleted(),
    };
    if (query.ativo !== undefined) where.ativo = query.ativo;
    if (query.especialidadeId) where.especialidadeId = query.especialidadeId;
    if (query.crmUf) where.crmUf = query.crmUf;
    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: "insensitive" } },
        { crm: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return where;
  }
}
