import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Ticket, Prisma } from "../generated/prisma/client";
import type { CreateTicketDto, TicketQueryDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTicketDto, createdById: string): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        type: data.type,
        sector: data.sector,
        location: data.location,
        reproductionSteps: data.reproductionSteps,
        screenshots: data.screenshots ?? [],
        tags: data.tags ?? [],
        slaDeadline: data.slaDeadline ? new Date(data.slaDeadline) : null,
        assignedToId: data.assignedToId,
        grupoId: data.grupoId,
        createdById,
      },
    });
  }

  async findAll(query: TicketQueryDto): Promise<PaginatedResult<Ticket>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.ticket.count({ where }),
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

  async findById(id: string): Promise<Ticket | null> {
    return this.prisma.ticket.findUnique({ where: { id } });
  }

  async findByIdWithCounts(
    id: string,
  ): Promise<
    (Ticket & { _count: { comments: number; attachments: number } }) | null
  > {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.TicketUpdateInput): Promise<Ticket> {
    return this.prisma.ticket.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticket.delete({ where: { id } });
  }

  async countByStatus(grupoId?: string): Promise<Record<string, number>> {
    const where: Prisma.TicketWhereInput = grupoId ? { grupoId } : {};
    const counts = await this.prisma.ticket.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    });
    return counts.reduce(
      (acc, { status, _count }) => ({ ...acc, [status]: _count.status }),
      {},
    );
  }

  async countByPriority(grupoId?: string): Promise<Record<string, number>> {
    const where: Prisma.TicketWhereInput = grupoId ? { grupoId } : {};
    const counts = await this.prisma.ticket.groupBy({
      by: ["priority"],
      where,
      _count: { priority: true },
    });
    return counts.reduce(
      (acc, { priority, _count }) => ({ ...acc, [priority]: _count.priority }),
      {},
    );
  }

  async countSlaBreach(
    grupoId?: string,
  ): Promise<{ breached: number; onTrack: number }> {
    const where: Prisma.TicketWhereInput = grupoId ? { grupoId } : {};
    const [breached, onTrack] = await Promise.all([
      this.prisma.ticket.count({ where: { ...where, slaBreach: true } }),
      this.prisma.ticket.count({ where: { ...where, slaBreach: false } }),
    ]);
    return { breached, onTrack };
  }

  private buildWhereClause(query: TicketQueryDto): Prisma.TicketWhereInput {
    const where: Prisma.TicketWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.type) where.type = query.type;
    if (query.sector) where.sector = query.sector;
    if (query.grupoId) where.grupoId = query.grupoId;
    if (query.createdById) where.createdById = query.createdById;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.archived !== undefined) where.archived = query.archived;
    if (query.slaBreach !== undefined) where.slaBreach = query.slaBreach;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}
