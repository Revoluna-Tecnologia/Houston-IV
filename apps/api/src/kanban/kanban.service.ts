import { Injectable, NotFoundException } from "@nestjs/common";
import { KanbanRepository } from "./kanban.repository";
import type {
  KanbanCard,
  KanbanTag,
  KanbanTimeline,
} from "../generated/prisma/client";
import type {
  CreateCardDto,
  UpdateCardDto,
  KanbanQueryDto,
  CardResponseDto,
  KanbanTagDto,
} from "./dto";

type CardWithRelations = KanbanCard & {
  tags: { tag: KanbanTag }[];
  links: { id: string; title: string; url: string }[];
  timeline: KanbanTimeline[];
};

@Injectable()
export class KanbanService {
  constructor(private readonly repository: KanbanRepository) {}

  async createCard(
    dto: CreateCardDto,
    createdById: string,
  ): Promise<CardResponseDto> {
    const card = await this.repository.createCard(dto, createdById);
    await this.repository.addTimeline(
      card.id,
      "create",
      createdById,
      "Card criado",
    );
    const fullCard = await this.repository.findCardById(card.id);
    return this.toResponseDto(fullCard!);
  }

  async findAllCards(query: KanbanQueryDto): Promise<CardResponseDto[]> {
    const cards = await this.repository.findAllCards(query);
    return cards.map((c) => this.toResponseDto(c));
  }

  async findCardById(id: string): Promise<CardResponseDto> {
    const card = await this.repository.findCardById(id);
    if (!card) {
      throw new NotFoundException("Card nao encontrado");
    }
    return this.toResponseDto(card);
  }

  async updateCard(
    id: string,
    dto: UpdateCardDto,
    userId: string,
  ): Promise<CardResponseDto> {
    const existing = await this.repository.findCardById(id);
    if (!existing) {
      throw new NotFoundException("Card nao encontrado");
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.tab !== undefined) data.tab = dto.tab;
    if (dto.assigneeId !== undefined) data.assigneeId = dto.assigneeId;

    await this.repository.updateCard(id, data);
    await this.repository.addTimeline(id, "update", userId, "Card atualizado");

    const updated = await this.repository.findCardById(id);
    return this.toResponseDto(updated!);
  }

  async moveCard(
    id: string,
    newStatus: string,
    userId: string,
  ): Promise<CardResponseDto> {
    const existing = await this.repository.findCardById(id);
    if (!existing) {
      throw new NotFoundException("Card nao encontrado");
    }

    const oldStatus = existing.status;
    await this.repository.updateCard(id, { status: newStatus });
    await this.repository.addTimeline(
      id,
      "move",
      userId,
      `Movido de ${oldStatus} para ${newStatus}`,
      {
        from: oldStatus,
        to: newStatus,
      },
    );

    const updated = await this.repository.findCardById(id);
    return this.toResponseDto(updated!);
  }

  async assignCard(
    id: string,
    assigneeId: string | null,
    userId: string,
  ): Promise<CardResponseDto> {
    const existing = await this.repository.findCardById(id);
    if (!existing) {
      throw new NotFoundException("Card nao encontrado");
    }

    await this.repository.updateCard(id, { assigneeId });
    await this.repository.addTimeline(
      id,
      "assign",
      userId,
      assigneeId ? "Card atribuido" : "Atribuicao removida",
      {
        assigneeId,
      },
    );

    const updated = await this.repository.findCardById(id);
    return this.toResponseDto(updated!);
  }

  async deleteCard(id: string, hard: boolean = false): Promise<void> {
    const existing = await this.repository.findCardById(id);
    if (!existing) {
      throw new NotFoundException("Card nao encontrado");
    }

    if (hard) {
      await this.repository.hardDeleteCard(id);
    } else {
      await this.repository.softDeleteCard(id);
    }
  }

  async addTag(
    cardId: string,
    tagName: string,
    grupoId: string,
    userId: string,
    color?: string,
  ): Promise<CardResponseDto> {
    const card = await this.repository.findCardById(cardId);
    if (!card) {
      throw new NotFoundException("Card nao encontrado");
    }

    const tag = await this.repository.findOrCreateTag(
      grupoId,
      tagName,
      userId,
      color,
    );
    await this.repository.addTagToCard(cardId, tag.id);
    await this.repository.addTimeline(
      cardId,
      "tag",
      userId,
      `Tag "${tagName}" adicionada`,
    );

    const updated = await this.repository.findCardById(cardId);
    return this.toResponseDto(updated!);
  }

  async removeTag(
    cardId: string,
    tagId: string,
    userId: string,
  ): Promise<CardResponseDto> {
    const card = await this.repository.findCardById(cardId);
    if (!card) {
      throw new NotFoundException("Card nao encontrado");
    }

    await this.repository.removeTagFromCard(cardId, tagId);
    await this.repository.addTimeline(cardId, "tag", userId, "Tag removida");

    const updated = await this.repository.findCardById(cardId);
    return this.toResponseDto(updated!);
  }

  async getTags(grupoId: string): Promise<KanbanTagDto[]> {
    const tags = await this.repository.findTagsByGrupo(grupoId);
    return tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));
  }

  async addLink(
    cardId: string,
    title: string,
    url: string,
    userId: string,
  ): Promise<CardResponseDto> {
    const card = await this.repository.findCardById(cardId);
    if (!card) {
      throw new NotFoundException("Card nao encontrado");
    }

    await this.repository.addLink(cardId, title, url, userId);
    await this.repository.addTimeline(
      cardId,
      "link",
      userId,
      `Link "${title}" adicionado`,
    );

    const updated = await this.repository.findCardById(cardId);
    return this.toResponseDto(updated!);
  }

  async removeLink(
    cardId: string,
    linkId: string,
    userId: string,
  ): Promise<CardResponseDto> {
    const card = await this.repository.findCardById(cardId);
    if (!card) {
      throw new NotFoundException("Card nao encontrado");
    }

    await this.repository.removeLink(linkId);
    await this.repository.addTimeline(cardId, "link", userId, "Link removido");

    const updated = await this.repository.findCardById(cardId);
    return this.toResponseDto(updated!);
  }

  async addComment(
    cardId: string,
    content: string,
    userId: string,
  ): Promise<CardResponseDto> {
    const card = await this.repository.findCardById(cardId);
    if (!card) {
      throw new NotFoundException("Card nao encontrado");
    }

    await this.repository.addTimeline(cardId, "comment", userId, content);

    const updated = await this.repository.findCardById(cardId);
    return this.toResponseDto(updated!);
  }

  private toResponseDto(card: CardWithRelations): CardResponseDto {
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      status: card.status,
      tab: card.tab,
      assigneeId: card.assigneeId,
      grupoId: card.grupoId,
      createdById: card.createdById,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      deletedAt: card.deletedAt,
      tags: card.tags.map((ct) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        color: ct.tag.color,
      })),
      links: card.links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
      })),
      timeline: card.timeline.map((t) => ({
        id: t.id,
        type: t.type,
        authorId: t.authorId,
        content: t.content,
        metadata: t.metadata as Record<string, unknown> | null,
        createdAt: t.createdAt,
      })),
    };
  }
}
