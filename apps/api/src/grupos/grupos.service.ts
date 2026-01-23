import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { GruposRepository } from './grupos.repository'
import type { Grupo } from '@prisma/client'
import type {
  CreateGrupoDto,
  UpdateGrupoDto,
  GrupoQueryDto,
  GrupoResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

@Injectable()
export class GruposService {
  constructor(private readonly repository: GruposRepository) {}

  async create(dto: CreateGrupoDto): Promise<GrupoResponseDto> {
    const exists = await this.repository.findByNome(dto.nome)
    if (exists) {
      throw new ConflictException('Grupo com este nome ja existe')
    }
    const grupo = await this.repository.create(dto)
    return this.toResponseDto(grupo)
  }

  async findAll(query: GrupoQueryDto): Promise<PaginatedResult<GrupoResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((g) => this.toResponseDto(g)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<GrupoResponseDto> {
    const grupo = await this.repository.findById(id)
    if (!grupo) {
      throw new NotFoundException('Grupo nao encontrado')
    }
    return this.toResponseDto(grupo)
  }

  async update(id: string, dto: UpdateGrupoDto): Promise<GrupoResponseDto> {
    await this.findOne(id)
    if (dto.nome) {
      const exists = await this.repository.findByNomeExcludingId(dto.nome, id)
      if (exists) {
        throw new ConflictException('Grupo com este nome ja existe')
      }
    }
    const grupo = await this.repository.update(id, dto)
    return this.toResponseDto(grupo)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.repository.delete(id)
  }

  private toResponseDto(grupo: Grupo): GrupoResponseDto {
    return {
      id: grupo.id,
      nome: grupo.nome,
      descricao: grupo.descricao,
      ativo: grupo.ativo,
      createdAt: grupo.createdAt,
      updatedAt: grupo.updatedAt,
    }
  }
}
