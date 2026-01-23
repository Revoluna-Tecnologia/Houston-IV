import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { Especialidade, Prisma } from '@prisma/client'
import type { CreateEspecialidadeDto, UpdateEspecialidadeDto, EspecialidadeQueryDto } from './dto'
import type { PaginatedResult } from '../common'

@Injectable()
export class EspecialidadesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEspecialidadeDto): Promise<Especialidade> {
    return this.prisma.especialidade.create({ data })
  }

  async findAll(query: EspecialidadeQueryDto): Promise<PaginatedResult<Especialidade>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query
    const skip = (page - 1) * limit
    const where = this.buildWhereClause(query)

    const [data, total] = await Promise.all([
      this.prisma.especialidade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.especialidade.count({ where }),
    ])

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
    }
  }

  async findById(id: string): Promise<Especialidade | null> {
    return this.prisma.especialidade.findUnique({ where: { id } })
  }

  async findByNome(nome: string): Promise<Especialidade | null> {
    return this.prisma.especialidade.findFirst({ where: { nome } })
  }

  async findByNomeExcludingId(nome: string, id: string): Promise<Especialidade | null> {
    return this.prisma.especialidade.findFirst({
      where: { nome, NOT: { id } },
    })
  }

  async update(id: string, data: UpdateEspecialidadeDto): Promise<Especialidade> {
    return this.prisma.especialidade.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.especialidade.delete({ where: { id } })
  }

  private buildWhereClause(query: EspecialidadeQueryDto): Prisma.EspecialidadeWhereInput {
    const where: Prisma.EspecialidadeWhereInput = {}

    if (query.ativo !== undefined) {
      where.ativo = query.ativo
    }

    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: 'insensitive' } },
        { sigla: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    return where
  }
}
