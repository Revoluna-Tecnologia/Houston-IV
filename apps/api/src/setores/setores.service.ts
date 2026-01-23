import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { SetoresRepository } from './setores.repository'
import type { Setor } from '@prisma/client'
import type {
  CreateSetorDto,
  UpdateSetorDto,
  SetorQueryDto,
  SetorResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

@Injectable()
export class SetoresService {
  constructor(private readonly repository: SetoresRepository) {}

  async create(dto: CreateSetorDto): Promise<SetorResponseDto> {
    const exists = await this.repository.findByNomeAndHospital(dto.nome, dto.hospitalId)
    if (exists) {
      throw new ConflictException('Setor com este nome ja existe neste hospital')
    }
    const setor = await this.repository.create(dto)
    return this.toResponseDto(setor)
  }

  async findAll(query: SetorQueryDto): Promise<PaginatedResult<SetorResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((s) => this.toResponseDto(s)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<SetorResponseDto> {
    const setor = await this.repository.findById(id)
    if (!setor) {
      throw new NotFoundException('Setor nao encontrado')
    }
    return this.toResponseDto(setor)
  }

  async update(id: string, dto: UpdateSetorDto): Promise<SetorResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Setor nao encontrado')
    }
    if (dto.nome) {
      const exists = await this.repository.findByNomeAndHospitalExcludingId(
        dto.nome,
        existing.hospitalId,
        id
      )
      if (exists) {
        throw new ConflictException('Setor com este nome ja existe neste hospital')
      }
    }
    const setor = await this.repository.update(id, dto)
    return this.toResponseDto(setor)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.repository.delete(id)
  }

  private toResponseDto(setor: Setor): SetorResponseDto {
    return {
      id: setor.id,
      nome: setor.nome,
      descricao: setor.descricao,
      ativo: setor.ativo,
      hospitalId: setor.hospitalId,
      createdAt: setor.createdAt,
      updatedAt: setor.updatedAt,
    }
  }
}
