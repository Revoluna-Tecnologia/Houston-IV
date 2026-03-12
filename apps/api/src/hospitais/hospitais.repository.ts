import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Hospital, Prisma } from "../generated/prisma/client";
import type {
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalQueryDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class HospitaisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateHospitalDto): Promise<Hospital> {
    return this.prisma.hospital.create({ data });
  }

  async findAll(query: HospitalQueryDto): Promise<PaginatedResult<Hospital>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.hospital.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.hospital.count({ where }),
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

  async findById(id: string): Promise<Hospital | null> {
    return this.prisma.hospital.findFirst({
      where: { id, ...this.prisma.notDeleted() },
    });
  }

  async findByCnpj(cnpj: string): Promise<Hospital | null> {
    return this.prisma.hospital.findFirst({
      where: { cnpj, ...this.prisma.notDeleted() },
    });
  }

  async findByCnpjExcludingId(
    cnpj: string,
    id: string,
  ): Promise<Hospital | null> {
    return this.prisma.hospital.findFirst({
      where: { cnpj, NOT: { id }, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: UpdateHospitalDto): Promise<Hospital> {
    return this.prisma.hospital.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.hospital.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  private buildWhereClause(query: HospitalQueryDto): Prisma.HospitalWhereInput {
    const where: Prisma.HospitalWhereInput = {
      ...this.prisma.notDeleted(),
    };

    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    if (query.grupoId) {
      where.grupoId = query.grupoId;
    }

    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: "insensitive" } },
        { cnpj: { contains: query.search, mode: "insensitive" } },
        { cidade: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}
