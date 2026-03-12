import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { CandidaturasRepository } from "./candidaturas.repository";
import { PrismaService } from "../prisma/prisma.service";
import type { Candidatura } from "../generated/prisma/client";
import type {
  CreateCandidaturaDto,
  CandidaturaQueryDto,
  CandidaturaResponseDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class CandidaturasService {
  constructor(
    private readonly repository: CandidaturasRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCandidaturaDto): Promise<CandidaturaResponseDto> {
    const vaga = await this.prisma.vaga.findUnique({
      where: { id: dto.vagaId },
    });
    if (!vaga) {
      throw new NotFoundException("Vaga nao encontrada");
    }

    if (vaga.status !== "aberta" && vaga.status !== "anunciada") {
      throw new BadRequestException(
        "Candidatura so pode ser feita em vagas abertas ou anunciadas",
      );
    }

    const existing = await this.repository.findByVagaAndMedico(
      dto.vagaId,
      dto.medicoId,
    );
    if (existing) {
      throw new ConflictException(
        "Candidatura ja existe para esta vaga e medico",
      );
    }

    const candidatura = await this.repository.create(dto);
    return this.toResponseDto(candidatura);
  }

  async findAll(
    query: CandidaturaQueryDto,
  ): Promise<PaginatedResult<CandidaturaResponseDto>> {
    const result = await this.repository.findAll(query);
    return {
      data: result.data.map((c) => this.toResponseDto(c)),
      meta: result.meta,
    };
  }

  async findOne(id: string): Promise<CandidaturaResponseDto> {
    const candidatura = await this.repository.findById(id);
    if (!candidatura) {
      throw new NotFoundException("Candidatura nao encontrada");
    }
    return this.toResponseDto(candidatura);
  }

  async approve(id: string): Promise<CandidaturaResponseDto> {
    const candidatura = await this.repository.findById(id);
    if (!candidatura) {
      throw new NotFoundException("Candidatura nao encontrada");
    }

    if (candidatura.status !== "pendente") {
      throw new BadRequestException(
        "Apenas candidaturas pendentes podem ser aprovadas",
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.candidatura.update({
        where: { id },
        data: { status: "aprovada" },
      }),
      this.prisma.vaga.update({
        where: { id: candidatura.vagaId },
        data: { status: "fechada" },
      }),
    ]);

    return this.toResponseDto(updated);
  }

  async reject(id: string): Promise<CandidaturaResponseDto> {
    const candidatura = await this.repository.findById(id);
    if (!candidatura) {
      throw new NotFoundException("Candidatura nao encontrada");
    }

    if (candidatura.status !== "pendente") {
      throw new BadRequestException(
        "Apenas candidaturas pendentes podem ser rejeitadas",
      );
    }

    const updated = await this.repository.update(id, { status: "rejeitada" });
    return this.toResponseDto(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private toResponseDto(candidatura: Candidatura): CandidaturaResponseDto {
    return {
      id: candidatura.id,
      vagaId: candidatura.vagaId,
      medicoId: candidatura.medicoId,
      status: candidatura.status,
      createdAt: candidatura.createdAt,
      updatedAt: candidatura.updatedAt,
    };
  }
}
