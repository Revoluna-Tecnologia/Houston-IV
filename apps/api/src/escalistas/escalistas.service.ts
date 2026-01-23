import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { EscalistasRepository } from './escalistas.repository'
import type { Escalista, EscalistaStatus } from '@prisma/client'
import type {
  CreateEscalistaDto,
  UpdateEscalistaDto,
  EscalistaQueryDto,
  EscalistaResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

const VALID_STATUS_TRANSITIONS: Record<EscalistaStatus, EscalistaStatus[]> = {
  pendente: ['ativo', 'inativo'],
  ativo: ['inativo'],
  inativo: [],
}

@Injectable()
export class EscalistasService {
  constructor(private readonly repository: EscalistasRepository) {}

  async create(dto: CreateEscalistaDto): Promise<EscalistaResponseDto> {
    const medicoExists = await this.repository.medicoExists(dto.medicoId)
    if (!medicoExists) {
      throw new NotFoundException('Medico nao encontrado')
    }

    const grupoExists = await this.repository.grupoExists(dto.grupoId)
    if (!grupoExists) {
      throw new NotFoundException('Grupo nao encontrado')
    }

    const exists = await this.repository.findByMedicoAndGrupo(dto.medicoId, dto.grupoId)
    if (exists) {
      throw new ConflictException('Escalista ja existe para este medico e grupo')
    }

    const escalista = await this.repository.create(dto)
    return this.toResponseDto(escalista)
  }

  async findAll(query: EscalistaQueryDto): Promise<PaginatedResult<EscalistaResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((e) => this.toResponseDto(e)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<EscalistaResponseDto> {
    const escalista = await this.repository.findById(id)
    if (!escalista) {
      throw new NotFoundException('Escalista nao encontrado')
    }
    return this.toResponseDto(escalista)
  }

  async update(id: string, dto: UpdateEscalistaDto): Promise<EscalistaResponseDto> {
    const escalista = await this.repository.findById(id)
    if (!escalista) {
      throw new NotFoundException('Escalista nao encontrado')
    }

    this.validateStatusTransition(escalista.status, dto.status)

    const updated = await this.repository.update(id, dto)
    return this.toResponseDto(updated)
  }

  async remove(id: string): Promise<void> {
    const escalista = await this.repository.findById(id)
    if (!escalista) {
      throw new NotFoundException('Escalista nao encontrado')
    }
    await this.repository.delete(id)
  }

  private validateStatusTransition(currentStatus: EscalistaStatus, newStatus: EscalistaStatus): void {
    if (currentStatus === newStatus) {
      return
    }

    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transicao de status invalida: ${currentStatus} -> ${newStatus}`
      )
    }
  }

  private toResponseDto(escalista: Escalista): EscalistaResponseDto {
    return {
      id: escalista.id,
      medicoId: escalista.medicoId,
      grupoId: escalista.grupoId,
      status: escalista.status,
      createdAt: escalista.createdAt,
      updatedAt: escalista.updatedAt,
    }
  }
}
