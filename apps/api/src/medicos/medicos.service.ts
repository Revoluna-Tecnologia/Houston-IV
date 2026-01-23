import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { MedicosRepository } from './medicos.repository'
import type { Medico } from '@prisma/client'
import type {
  CreateMedicoDto,
  UpdateMedicoDto,
  MedicoQueryDto,
  MedicoResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

@Injectable()
export class MedicosService {
  constructor(private readonly repository: MedicosRepository) {}

  async create(dto: CreateMedicoDto): Promise<MedicoResponseDto> {
    await this.validateUniqueness(dto)
    const medico = await this.repository.create(dto)
    return this.toResponseDto(medico)
  }

  async findAll(query: MedicoQueryDto): Promise<PaginatedResult<MedicoResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((m) => this.toResponseDto(m)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<MedicoResponseDto> {
    const medico = await this.repository.findById(id)
    if (!medico) {
      throw new NotFoundException('Medico nao encontrado')
    }
    return this.toResponseDto(medico)
  }

  async update(id: string, dto: UpdateMedicoDto): Promise<MedicoResponseDto> {
    await this.findOne(id)
    await this.validateUniquenessOnUpdate(id, dto)
    const medico = await this.repository.update(id, dto)
    return this.toResponseDto(medico)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.repository.delete(id)
  }

  private async validateUniqueness(dto: CreateMedicoDto): Promise<void> {
    const existingCrm = await this.repository.findByCrmAndUf(dto.crm, dto.crmUf)
    if (existingCrm) {
      throw new ConflictException('Medico com este CRM e UF ja existe')
    }

    if (dto.cpf) {
      const existingCpf = await this.repository.findByCpf(dto.cpf)
      if (existingCpf) {
        throw new ConflictException('Medico com este CPF ja existe')
      }
    }

    if (dto.email) {
      const existingEmail = await this.repository.findByEmail(dto.email)
      if (existingEmail) {
        throw new ConflictException('Medico com este email ja existe')
      }
    }
  }

  private async validateUniquenessOnUpdate(id: string, dto: UpdateMedicoDto): Promise<void> {
    if (dto.crm && dto.crmUf) {
      const existingCrm = await this.repository.findByCrmAndUfExcludingId(dto.crm, dto.crmUf, id)
      if (existingCrm) {
        throw new ConflictException('Medico com este CRM e UF ja existe')
      }
    }

    if (dto.cpf) {
      const existingCpf = await this.repository.findByCpf(dto.cpf)
      if (existingCpf && existingCpf.id !== id) {
        throw new ConflictException('Medico com este CPF ja existe')
      }
    }

    if (dto.email) {
      const existingEmail = await this.repository.findByEmail(dto.email)
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Medico com este email ja existe')
      }
    }
  }

  private toResponseDto(medico: Medico): MedicoResponseDto {
    return {
      id: medico.id,
      nome: medico.nome,
      crm: medico.crm,
      crmUf: medico.crmUf,
      cpf: medico.cpf,
      email: medico.email,
      telefone: medico.telefone,
      especialidadeId: medico.especialidadeId,
      ativo: medico.ativo,
      createdAt: medico.createdAt,
      updatedAt: medico.updatedAt,
    }
  }
}
