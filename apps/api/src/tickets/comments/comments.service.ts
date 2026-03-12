import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CommentsRepository } from "./comments.repository";
import type { TicketComment } from "../../generated/prisma/client";
import type { CreateCommentDto, CommentResponseDto } from "./dto";

@Injectable()
export class CommentsService {
  constructor(private readonly repository: CommentsRepository) {}

  async create(
    ticketId: string,
    dto: CreateCommentDto,
    authorId: string,
    authorName: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.repository.create(
      ticketId,
      dto,
      authorId,
      authorName,
    );
    return this.toResponseDto(comment);
  }

  async findByTicketId(
    ticketId: string,
    includeInternal: boolean = true,
  ): Promise<CommentResponseDto[]> {
    const comments = await this.repository.findByTicketId(
      ticketId,
      includeInternal,
    );
    return comments.map((c) => this.toResponseDto(c));
  }

  async update(
    id: string,
    content: string,
    userId: string,
  ): Promise<CommentResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException("Comentario nao encontrado");
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException("Voce nao pode editar este comentario");
    }

    const comment = await this.repository.update(id, content);
    return this.toResponseDto(comment);
  }

  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException("Comentario nao encontrado");
    }

    if (!isAdmin && existing.authorId !== userId) {
      throw new ForbiddenException("Voce nao pode remover este comentario");
    }

    await this.repository.delete(id);
  }

  private toResponseDto(comment: TicketComment): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      isInternal: comment.isInternal,
      ticketId: comment.ticketId,
      authorId: comment.authorId,
      authorName: comment.authorName,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
