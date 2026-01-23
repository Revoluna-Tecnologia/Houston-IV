import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { EspecialidadesRepository } from './especialidades.repository'
import type { Especialidade } from '@prisma/client'
import type {
  CreateEspecialidadeDto,
  UpdateEspecialidadeDto,
  EspecialidadeQueryDto,
  EspecialidadeResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

@Injectable()
export class EspecialidadesService {
  constructor(private readonly repository: EspecialidadesRepository) {}

  async create(dto: CreateEspecialidadeDto): Promise<EspecialidadeResponseDto> {
    const exists = await this.repository.findByNome(dto.nome)
    if (exists) {
      throw new ConflictException('Especialidade com este nome ja existe')
    }
    const especialidade = await this.repository.create(dto)
    return this.toResponseDto(especialidade)
  }

  async findAll(query: EspecialidadeQueryDto): Promise<PaginatedResult<EspecialidadeResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((e) => this.toResponseDto(e)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<EspecialidadeResponseDto> {
    const especialidade = await this.repository.findById(id)
    if (!especialidade) {
      throw new NotFoundException('Especialidade nao encontrada')
    }
    return this.toResponseDto(especialidade)
  }

  async update(id: string, dto: UpdateEspecialidadeDto): Promise<EspecialidadeResponseDto> {
    await this.findOne(id)
    if (dto.nome) {
      const exists = await this.repository.findByNomeExcludingId(dto.nome, id)
      if (exists) {
        throw new ConflictException('Especialidade com este nome ja existe')
      }
    }
    const especialidade = await this.repository.update(id, dto)
    return this.toResponseDto(especialidade)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.repository.delete(id)
  }

  private toResponseDto(especialidade: Especialidade): EspecialidadeResponseDto {
    return {
      id: especialidade.id,
      nome: especialidade.nome,
      sigla: especialidade.sigla,
      cor: especialidade.cor,
      ativo: especialidade.ativo,
      createdAt: especialidade.createdAt,
      updatedAt: especialidade.updatedAt,
    }
  }
}
