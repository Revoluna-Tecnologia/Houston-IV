import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Candidatura, Prisma } from "@prisma/client";
import type { CreateCandidaturaDto, CandidaturaQueryDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class CandidaturasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCandidaturaDto): Promise<Candidatura> {
    return this.prisma.candidatura.create({ data });
  }

  async findAll(
    query: CandidaturaQueryDto,
  ): Promise<PaginatedResult<Candidatura>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.candidatura.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.candidatura.count({ where }),
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

  async findById(id: string): Promise<Candidatura | null> {
    return this.prisma.candidatura.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByVagaAndMedico(
    vagaId: string,
    medicoId: string,
  ): Promise<Candidatura | null> {
    return this.prisma.candidatura.findFirst({
      where: { vagaId, medicoId, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: Partial<Candidatura>): Promise<Candidatura> {
    return this.prisma.candidatura.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.candidatura.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(
    query: CandidaturaQueryDto,
  ): Prisma.CandidaturaWhereInput {
    const where: Prisma.CandidaturaWhereInput = {
      ...this.prisma.notDeleted(),
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.vagaId) {
      where.vagaId = query.vagaId;
    }

    if (query.medicoId) {
      where.medicoId = query.medicoId;
    }

    return where;
  }
}
