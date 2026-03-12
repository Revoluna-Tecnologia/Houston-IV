import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { TicketComment, Prisma } from "../../generated/prisma/client";
import type { CreateCommentDto } from "./dto";

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ticketId: string,
    data: CreateCommentDto,
    authorId: string,
    authorName: string,
  ): Promise<TicketComment> {
    return this.prisma.ticketComment.create({
      data: {
        content: data.content,
        isInternal: data.isInternal ?? false,
        ticketId,
        authorId,
        authorName,
      },
    });
  }

  async findByTicketId(
    ticketId: string,
    includeInternal: boolean = true,
  ): Promise<TicketComment[]> {
    const where: Prisma.TicketCommentWhereInput = { ticketId };
    if (!includeInternal) {
      where.isInternal = false;
    }
    return this.prisma.ticketComment.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string): Promise<TicketComment | null> {
    return this.prisma.ticketComment.findUnique({ where: { id } });
  }

  async update(id: string, content: string): Promise<TicketComment> {
    return this.prisma.ticketComment.update({
      where: { id },
      data: { content },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticketComment.delete({ where: { id } });
  }

  async countByTicketId(ticketId: string): Promise<number> {
    return this.prisma.ticketComment.count({ where: { ticketId } });
  }
}
