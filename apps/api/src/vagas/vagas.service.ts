import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { VagasRepository } from './vagas.repository'
import type { Vaga, VagaStatus } from '@prisma/client'
import type {
  CreateVagaDto,
  UpdateVagaDto,
  VagaQueryDto,
  VagaResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

const VALID_TRANSITIONS: Record<VagaStatus, VagaStatus[]> = {
  aberta: ['anunciada', 'fechada', 'cancelada'],
  anunciada: ['fechada', 'cancelada'],
  fechada: [],
  cancelada: [],
}

@Injectable()
export class VagasService {
  constructor(private readonly repository: VagasRepository) {}

  async create(dto: CreateVagaDto): Promise<VagaResponseDto> {
    const conflict = await this.repository.findConflicting(
      dto.hospitalId,
      dto.setorId,
      new Date(dto.data),
      dto.horaInicio,
      dto.horaFim
    )
    if (conflict) {
      throw new ConflictException('Ja existe uma vaga neste horario para o mesmo hospital e setor')
    }
    const vaga = await this.repository.create(dto)
    return this.toResponseDto(vaga)
  }

  async findAll(query: VagaQueryDto): Promise<PaginatedResult<VagaResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((v) => this.toResponseDto(v)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<VagaResponseDto> {
    const vaga = await this.repository.findById(id)
    if (!vaga) {
      throw new NotFoundException('Vaga nao encontrada')
    }
    return this.toResponseDto(vaga)
  }

  async update(id: string, dto: UpdateVagaDto): Promise<VagaResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Vaga nao encontrada')
    }

    if (dto.status) {
      this.validateStatusTransition(existing.status, dto.status)
    }

    if (dto.data || dto.horaInicio || dto.horaFim) {
      const data = dto.data ? new Date(dto.data) : existing.data
      const horaInicio = dto.horaInicio ?? existing.horaInicio
      const horaFim = dto.horaFim ?? existing.horaFim
      const conflict = await this.repository.findConflicting(
        existing.hospitalId,
        existing.setorId,
        data,
        horaInicio,
        horaFim,
        id
      )
      if (conflict) {
        throw new ConflictException('Ja existe uma vaga neste horario para o mesmo hospital e setor')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (dto.data) updateData.data = new Date(dto.data)
    if (dto.horaInicio) updateData.horaInicio = dto.horaInicio
    if (dto.horaFim) updateData.horaFim = dto.horaFim
    if (dto.valor !== undefined) updateData.valor = dto.valor
    if (dto.observacoes !== undefined) updateData.observacoes = dto.observacoes
    if (dto.status) updateData.status = dto.status

    const vaga = await this.repository.update(id, updateData)
    return this.toResponseDto(vaga)
  }

  async updateStatus(id: string, status: VagaStatus): Promise<VagaResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Vaga nao encontrada')
    }
    this.validateStatusTransition(existing.status, status)
    const vaga = await this.repository.update(id, { status })
    return this.toResponseDto(vaga)
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Vaga nao encontrada')
    }
    await this.repository.delete(id)
  }

  private validateStatusTransition(current: VagaStatus, next: VagaStatus): void {
    const allowed = VALID_TRANSITIONS[current]
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transicao de status invalida: ${current} -> ${next}`
      )
    }
  }

  private toResponseDto(vaga: Vaga): VagaResponseDto {
    return {
      id: vaga.id,
      data: vaga.data,
      horaInicio: vaga.horaInicio,
      horaFim: vaga.horaFim,
      valor: Number(vaga.valor),
      observacoes: vaga.observacoes,
      status: vaga.status,
      hospitalId: vaga.hospitalId,
      setorId: vaga.setorId,
      especialidadeId: vaga.especialidadeId,
      createdAt: vaga.createdAt,
      updatedAt: vaga.updatedAt,
    }
  }
}
