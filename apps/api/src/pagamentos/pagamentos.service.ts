import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PagamentosRepository } from "./pagamentos.repository";
import type { Pagamento, PagamentoStatus } from "../generated/prisma/client";
import type {
  CreatePagamentoDto,
  UpdatePagamentoDto,
  PagamentoQueryDto,
  PagamentoResponseDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class PagamentosService {
  private readonly validTransitions: Record<
    PagamentoStatus,
    PagamentoStatus[]
  > = {
    pendente: ["autorizado", "cancelado"],
    autorizado: ["pago", "cancelado"],
    pago: ["cancelado"],
    cancelado: [],
  };

  constructor(private readonly repository: PagamentosRepository) {}

  async create(dto: CreatePagamentoDto): Promise<PagamentoResponseDto> {
    const exists = await this.repository.findByVagaAndMedico(
      dto.vagaId,
      dto.medicoId,
    );
    if (exists) {
      throw new ConflictException(
        "Pagamento para esta vaga e medico ja existe",
      );
    }
    const pagamento = await this.repository.create(dto);
    return this.toResponseDto(pagamento);
  }

  async findAll(
    query: PagamentoQueryDto,
  ): Promise<PaginatedResult<PagamentoResponseDto>> {
    const result = await this.repository.findAll(query);
    return {
      data: result.data.map((p) => this.toResponseDto(p)),
      meta: result.meta,
    };
  }

  async findOne(id: string): Promise<PagamentoResponseDto> {
    const pagamento = await this.repository.findById(id);
    if (!pagamento) {
      throw new NotFoundException("Pagamento nao encontrado");
    }
    return this.toResponseDto(pagamento);
  }

  async update(
    id: string,
    dto: UpdatePagamentoDto,
  ): Promise<PagamentoResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException("Pagamento nao encontrado");
    }
    if (dto.status) {
      this.validateTransition(existing.status, dto.status);
    }
    const pagamento = await this.repository.update(id, dto);
    return this.toResponseDto(pagamento);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  async autorizar(id: string): Promise<PagamentoResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException("Pagamento nao encontrado");
    }
    this.validateTransition(existing.status, "autorizado");
    const pagamento = await this.repository.update(id, {
      status: "autorizado",
      dataAutorizacao: new Date(),
    } as UpdatePagamentoDto & { dataAutorizacao: Date });
    return this.toResponseDto(pagamento);
  }

  async pagar(id: string): Promise<PagamentoResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException("Pagamento nao encontrado");
    }
    this.validateTransition(existing.status, "pago");
    const pagamento = await this.repository.update(id, {
      status: "pago",
      dataPagamento: new Date(),
    } as UpdatePagamentoDto & { dataPagamento: Date });
    return this.toResponseDto(pagamento);
  }

  async bulkAutorizar(
    ids: string[],
  ): Promise<{ success: number; failed: string[] }> {
    const failed: string[] = [];
    let success = 0;

    for (const id of ids) {
      try {
        await this.autorizar(id);
        success++;
      } catch {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  async bulkPagar(
    ids: string[],
  ): Promise<{ success: number; failed: string[] }> {
    const failed: string[] = [];
    let success = 0;

    for (const id of ids) {
      try {
        await this.pagar(id);
        success++;
      } catch {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  async sumByMedico(medicoId: string): Promise<number> {
    return this.repository.sumByMedico(medicoId);
  }

  async sumByPeriod(dataInicio: Date, dataFim: Date): Promise<number> {
    return this.repository.sumByPeriod(dataInicio, dataFim);
  }

  private validateTransition(
    current: PagamentoStatus,
    target: PagamentoStatus,
  ): void {
    const allowed = this.validTransitions[current];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Transicao de status invalida: ${current} -> ${target}`,
      );
    }
  }

  private toResponseDto(pagamento: Pagamento): PagamentoResponseDto {
    return {
      id: pagamento.id,
      vagaId: pagamento.vagaId,
      medicoId: pagamento.medicoId,
      valor: pagamento.valor.toNumber(),
      status: pagamento.status,
      dataAutorizacao: pagamento.dataAutorizacao,
      dataPagamento: pagamento.dataPagamento,
      observacoes: pagamento.observacoes,
      createdAt: pagamento.createdAt,
      updatedAt: pagamento.updatedAt,
    };
  }
}
