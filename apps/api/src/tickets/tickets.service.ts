import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { TicketsRepository } from './tickets.repository'
import type { Ticket, TicketStatus } from '@prisma/client'
import type {
  CreateTicketDto,
  UpdateTicketDto,
  TicketQueryDto,
  TicketResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_review', 'in_progress', 'resolved', 'closed'],
  in_review: ['in_progress', 'resolved', 'closed', 'open'],
  in_progress: ['resolved', 'closed', 'in_review'],
  resolved: ['closed', 'open'],
  closed: ['open'],
}

@Injectable()
export class TicketsService {
  constructor(private readonly repository: TicketsRepository) {}

  async create(dto: CreateTicketDto, createdById: string): Promise<TicketResponseDto> {
    const ticket = await this.repository.create(dto, createdById)
    return this.toResponseDto(ticket)
  }

  async findAll(query: TicketQueryDto): Promise<PaginatedResult<TicketResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((t) => this.toResponseDto(t)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<TicketResponseDto> {
    const ticket = await this.repository.findByIdWithCounts(id)
    if (!ticket) {
      throw new NotFoundException('Ticket nao encontrado')
    }
    return this.toResponseDtoWithCounts(ticket)
  }

  async update(id: string, dto: UpdateTicketDto, userId: string): Promise<TicketResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Ticket nao encontrado')
    }

    if (dto.status) {
      this.validateStatusTransition(existing.status, dto.status)
    }

    const updateData = this.buildUpdateData(dto, existing)
    const ticket = await this.repository.update(id, updateData)
    return this.toResponseDto(ticket)
  }

  async updateStatus(id: string, status: TicketStatus): Promise<TicketResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Ticket nao encontrado')
    }

    this.validateStatusTransition(existing.status, status)

    const updateData: Record<string, unknown> = { status }
    if (status === 'resolved' && !existing.resolvedAt) {
      updateData.resolvedAt = new Date()
    }
    if (status === 'closed' && !existing.closedAt) {
      updateData.closedAt = new Date()
    }

    const ticket = await this.repository.update(id, updateData)
    return this.toResponseDto(ticket)
  }

  async assign(id: string, assignedToId: string | null): Promise<TicketResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Ticket nao encontrado')
    }

    const ticket = await this.repository.update(id, { assignedToId })
    return this.toResponseDto(ticket)
  }

  async archive(id: string, archived: boolean): Promise<TicketResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Ticket nao encontrado')
    }

    const ticket = await this.repository.update(id, { archived })
    return this.toResponseDto(ticket)
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Ticket nao encontrado')
    }
    await this.repository.delete(id)
  }

  private validateStatusTransition(current: TicketStatus, next: TicketStatus): void {
    const allowed = VALID_TRANSITIONS[current]
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Transicao de status invalida: ${current} -> ${next}`)
    }
  }

  private buildUpdateData(dto: UpdateTicketDto, existing: Ticket): Record<string, unknown> {
    const data: Record<string, unknown> = {}

    if (dto.title !== undefined) data.title = dto.title
    if (dto.description !== undefined) data.description = dto.description
    if (dto.status !== undefined) data.status = dto.status
    if (dto.priority !== undefined) data.priority = dto.priority
    if (dto.category !== undefined) data.category = dto.category
    if (dto.type !== undefined) data.type = dto.type
    if (dto.sector !== undefined) data.sector = dto.sector
    if (dto.location !== undefined) data.location = dto.location
    if (dto.reproductionSteps !== undefined) data.reproductionSteps = dto.reproductionSteps
    if (dto.screenshots !== undefined) data.screenshots = dto.screenshots
    if (dto.tags !== undefined) data.tags = dto.tags
    if (dto.slaDeadline !== undefined) data.slaDeadline = dto.slaDeadline ? new Date(dto.slaDeadline) : null
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId
    if (dto.archived !== undefined) data.archived = dto.archived

    if (dto.status === 'resolved' && !existing.resolvedAt) {
      data.resolvedAt = new Date()
    }
    if (dto.status === 'closed' && !existing.closedAt) {
      data.closedAt = new Date()
    }

    return data
  }

  private toResponseDto(ticket: Ticket): TicketResponseDto {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      type: ticket.type,
      sector: ticket.sector,
      location: ticket.location,
      reproductionSteps: ticket.reproductionSteps,
      screenshots: ticket.screenshots,
      tags: ticket.tags,
      slaDeadline: ticket.slaDeadline,
      slaBreach: ticket.slaBreach,
      archived: ticket.archived,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      createdById: ticket.createdById,
      assignedToId: ticket.assignedToId,
      grupoId: ticket.grupoId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }
  }

  private toResponseDtoWithCounts(
    ticket: Ticket & { _count: { comments: number; attachments: number } }
  ): TicketResponseDto {
    return {
      ...this.toResponseDto(ticket),
      commentsCount: ticket._count.comments,
      attachmentsCount: ticket._count.attachments,
    }
  }
}
