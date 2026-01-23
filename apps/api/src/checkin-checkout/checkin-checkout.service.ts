import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { CheckinCheckoutRepository } from './checkin-checkout.repository'
import type { CheckinCheckout } from '@prisma/client'
import type {
  CreateCheckinCheckoutDto,
  UpdateCheckinCheckoutDto,
  CheckinCheckoutQueryDto,
  CheckinCheckoutResponseDto,
} from './dto'
import type { PaginatedResult } from '../common'

@Injectable()
export class CheckinCheckoutService {
  constructor(private readonly repository: CheckinCheckoutRepository) {}

  async create(dto: CreateCheckinCheckoutDto): Promise<CheckinCheckoutResponseDto> {
    const exists = await this.repository.findByVagaAndMedico(dto.vagaId, dto.medicoId)
    if (exists) {
      throw new ConflictException('Registro de checkin/checkout ja existe para esta vaga e medico')
    }
    const record = await this.repository.create(dto)
    return this.toResponseDto(record)
  }

  async findAll(query: CheckinCheckoutQueryDto): Promise<PaginatedResult<CheckinCheckoutResponseDto>> {
    const result = await this.repository.findAll(query)
    return {
      data: result.data.map((r) => this.toResponseDto(r)),
      meta: result.meta,
    }
  }

  async findOne(id: string): Promise<CheckinCheckoutResponseDto> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new NotFoundException('Registro de checkin/checkout nao encontrado')
    }
    return this.toResponseDto(record)
  }

  async update(id: string, dto: UpdateCheckinCheckoutDto): Promise<CheckinCheckoutResponseDto> {
    await this.findOne(id)
    const record = await this.repository.update(id, dto)
    return this.toResponseDto(record)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.repository.delete(id)
  }

  async checkin(id: string): Promise<CheckinCheckoutResponseDto> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new NotFoundException('Registro de checkin/checkout nao encontrado')
    }
    if (record.checkinAt) {
      throw new BadRequestException('Checkin ja foi registrado')
    }
    const updated = await this.repository.updateCheckin(id, new Date())
    return this.toResponseDto(updated)
  }

  async checkout(id: string): Promise<CheckinCheckoutResponseDto> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new NotFoundException('Registro de checkin/checkout nao encontrado')
    }
    if (!record.checkinAt) {
      throw new BadRequestException('Checkin deve ser registrado antes do checkout')
    }
    if (record.checkoutAt) {
      throw new BadRequestException('Checkout ja foi registrado')
    }
    const updated = await this.repository.updateCheckout(id, new Date())
    return this.toResponseDto(updated)
  }

  private toResponseDto(record: CheckinCheckout): CheckinCheckoutResponseDto {
    return {
      id: record.id,
      vagaId: record.vagaId,
      medicoId: record.medicoId,
      checkinAt: record.checkinAt,
      checkoutAt: record.checkoutAt,
      observacoes: record.observacoes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
