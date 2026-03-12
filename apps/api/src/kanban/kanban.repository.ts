import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  KanbanCard,
  KanbanTag,
  KanbanTimeline,
  Prisma,
  KanbanTimelineType,
} from "../generated/prisma/client";
import type { CreateCardDto, KanbanQueryDto } from "./dto";

type CardWithRelations = KanbanCard & {
  tags: { tag: KanbanTag }[];
  links: { id: string; title: string; url: string }[];
  timeline: KanbanTimeline[];
};

@Injectable()
export class KanbanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCard(
    data: CreateCardDto,
    createdById: string,
  ): Promise<KanbanCard> {
    return this.prisma.kanbanCard.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        tab: data.tab,
        assigneeId: data.assigneeId,
        grupoId: data.grupoId,
        createdById,
      },
    });
  }

  async findAllCards(query: KanbanQueryDto): Promise<CardWithRelations[]> {
    const where = this.buildWhereClause(query);
    return this.prisma.kanbanCard.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        links: true,
        timeline: { orderBy: { createdAt: "desc" }, take: 10 },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findCardById(id: string): Promise<CardWithRelations | null> {
    return this.prisma.kanbanCard.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        links: true,
        timeline: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async updateCard(
    id: string,
    data: Prisma.KanbanCardUpdateInput,
  ): Promise<KanbanCard> {
    return this.prisma.kanbanCard.update({ where: { id }, data });
  }

  async softDeleteCard(id: string): Promise<void> {
    await this.prisma.kanbanCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDeleteCard(id: string): Promise<void> {
    await this.prisma.kanbanCard.delete({ where: { id } });
  }

  async addTimeline(
    cardId: string,
    type: KanbanTimelineType,
    authorId: string,
    content?: string,
    metadata?: Record<string, unknown>,
  ): Promise<KanbanTimeline> {
    return this.prisma.kanbanTimeline.create({
      data: {
        cardId,
        type,
        authorId,
        content,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findOrCreateTag(
    grupoId: string,
    name: string,
    createdBy: string,
    color?: string,
  ): Promise<KanbanTag> {
    const existing = await this.prisma.kanbanTag.findUnique({
      where: { grupoId_name: { grupoId, name } },
    });
    if (existing) return existing;

    return this.prisma.kanbanTag.create({
      data: { name, color: color ?? "#3B82F6", grupoId, createdBy },
    });
  }

  async addTagToCard(cardId: string, tagId: string): Promise<void> {
    await this.prisma.kanbanCardTag.upsert({
      where: { cardId_tagId: { cardId, tagId } },
      create: { cardId, tagId },
      update: {},
    });
  }

  async removeTagFromCard(cardId: string, tagId: string): Promise<void> {
    await this.prisma.kanbanCardTag.delete({
      where: { cardId_tagId: { cardId, tagId } },
    });
  }

  async findTagsByGrupo(grupoId: string): Promise<KanbanTag[]> {
    return this.prisma.kanbanTag.findMany({
      where: { grupoId },
      orderBy: { name: "asc" },
    });
  }

  async addLink(
    cardId: string,
    title: string,
    url: string,
    createdBy: string,
  ): Promise<{ id: string; title: string; url: string }> {
    return this.prisma.kanbanLink.create({
      data: { cardId, title, url, createdBy },
    });
  }

  async removeLink(linkId: string): Promise<void> {
    await this.prisma.kanbanLink.delete({ where: { id: linkId } });
  }

  async countByStatus(
    grupoId: string,
    tab?: string,
  ): Promise<Record<string, number>> {
    const where: Prisma.KanbanCardWhereInput = { grupoId, deletedAt: null };
    if (tab) where.tab = tab as "projetos" | "financeiro";

    const counts = await this.prisma.kanbanCard.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    });
    return counts.reduce(
      (acc, { status, _count }) => ({ ...acc, [status]: _count.status }),
      {},
    );
  }

  private buildWhereClause(query: KanbanQueryDto): Prisma.KanbanCardWhereInput {
    const where: Prisma.KanbanCardWhereInput = {};

    if (query.tab) where.tab = query.tab;
    if (query.status) where.status = query.status;
    if (query.grupoId) where.grupoId = query.grupoId;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (!query.includeDeleted) where.deletedAt = null;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}
