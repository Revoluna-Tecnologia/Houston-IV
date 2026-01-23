import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { GradesRepository } from './grades.repository'
import type { Grade, TimeSlot, GradeStatus } from '@prisma/client'
import type {
  CreateGradeDto,
  UpdateGradeDto,
  GradeQueryDto,
  GradeResponseDto,
  CreateTimeSlotDto,
  TimeSlotResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'
import { VagasRepository } from '../vagas/vagas.repository'

type GradeWithTimeSlots = Grade & { timeSlots?: TimeSlot[] }

@Injectable()
export class GradesService {
  constructor(
    private readonly repository: GradesRepository,
    private readonly vagasRepository: VagasRepository
  ) {}

  async create(dto: CreateGradeDto): Promise<GradeResponseDto> {
    this.validateDateRange(dto.dataInicio, dto.dataFim)
    const grade = await this.repository.create(dto)
    return this.toResponseDto(grade)
  }

  async findAll(query: GradeQueryDto): Promise<PaginatedResult<GradeResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((g) => this.toResponseDto(g)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<GradeResponseDto> {
    const grade = await this.repository.findById(id)
    if (!grade) {
      throw new NotFoundException('Grade nao encontrada')
    }
    return this.toResponseDto(grade)
  }

  async update(id: string, dto: UpdateGradeDto): Promise<GradeResponseDto> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Grade nao encontrada')
    }

    if (dto.dataInicio || dto.dataFim) {
      const dataInicio = dto.dataInicio ?? existing.dataInicio.toISOString()
      const dataFim = dto.dataFim ?? existing.dataFim.toISOString()
      this.validateDateRange(dataInicio, dataFim)
    }

    const updateData: Record<string, unknown> = {}
    if (dto.nome) updateData.nome = dto.nome
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao
    if (dto.dataInicio) updateData.dataInicio = new Date(dto.dataInicio)
    if (dto.dataFim) updateData.dataFim = new Date(dto.dataFim)
    if (dto.hospitalId) updateData.hospitalId = dto.hospitalId
    if (dto.setorId) updateData.setorId = dto.setorId
    if (dto.status) updateData.status = dto.status

    const grade = await this.repository.update(id, updateData)
    return this.toResponseDto(grade)
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Grade nao encontrada')
    }
    await this.repository.delete(id)
  }

  async addTimeSlots(id: string, timeSlots: CreateTimeSlotDto[]): Promise<TimeSlotResponseDto[]> {
    const grade = await this.repository.findById(id)
    if (!grade) {
      throw new NotFoundException('Grade nao encontrada')
    }
    const created = await this.repository.addTimeSlots(id, timeSlots)
    return created.map((slot) => this.toTimeSlotResponseDto(slot))
  }

  async publish(id: string): Promise<GradeResponseDto> {
    const grade = await this.repository.findById(id)
    if (!grade) {
      throw new NotFoundException('Grade nao encontrada')
    }
    if (grade.status !== 'rascunho') {
      throw new BadRequestException('Apenas grades em rascunho podem ser publicadas')
    }
    const updated = await this.repository.update(id, { status: 'publicada' as GradeStatus })
    return this.toResponseDto(updated)
  }

  async generateVagas(id: string, especialidadeId: string, valor: number): Promise<number> {
    const grade = await this.repository.findById(id) as GradeWithTimeSlots | null
    if (!grade) {
      throw new NotFoundException('Grade nao encontrada')
    }
    if (grade.status !== 'publicada') {
      throw new BadRequestException('Apenas grades publicadas podem gerar vagas')
    }

    const timeSlots = await this.repository.getTimeSlots(id)
    let count = 0

    for (const slot of timeSlots) {
      await this.vagasRepository.create({
        data: slot.data.toISOString().split('T')[0],
        horaInicio: slot.horaInicio,
        horaFim: slot.horaFim,
        valor,
        hospitalId: grade.hospitalId,
        setorId: grade.setorId,
        especialidadeId,
      })
      count++
    }

    return count
  }

  private validateDateRange(dataInicio: string, dataFim: string): void {
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    if (inicio >= fim) {
      throw new BadRequestException('dataInicio deve ser anterior a dataFim')
    }
  }

  private toResponseDto(grade: GradeWithTimeSlots): GradeResponseDto {
    const response: GradeResponseDto = {
      id: grade.id,
      nome: grade.nome,
      descricao: grade.descricao,
      dataInicio: grade.dataInicio,
      dataFim: grade.dataFim,
      hospitalId: grade.hospitalId,
      setorId: grade.setorId,
      status: grade.status,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
    }
    if (grade.timeSlots) {
      response.timeSlots = grade.timeSlots.map((slot) => this.toTimeSlotResponseDto(slot))
    }
    return response
  }

  private toTimeSlotResponseDto(slot: TimeSlot): TimeSlotResponseDto {
    return {
      id: slot.id,
      data: slot.data,
      horaInicio: slot.horaInicio,
      horaFim: slot.horaFim,
      medicoId: slot.medicoId,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }
  }
}
