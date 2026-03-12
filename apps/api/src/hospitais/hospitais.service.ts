import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { HospitaisRepository } from "./hospitais.repository";
import type { Hospital } from "../generated/prisma/client";
import type {
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalQueryDto,
  HospitalResponseDto,
} from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class HospitaisService {
  constructor(private readonly repository: HospitaisRepository) {}

  async create(dto: CreateHospitalDto): Promise<HospitalResponseDto> {
    if (dto.cnpj) {
      const exists = await this.repository.findByCnpj(dto.cnpj);
      if (exists) {
        throw new ConflictException("Hospital com este CNPJ ja existe");
      }
    }
    const hospital = await this.repository.create(dto);
    return this.toResponseDto(hospital);
  }

  async findAll(
    query: HospitalQueryDto,
  ): Promise<PaginatedResult<HospitalResponseDto>> {
    const result = await this.repository.findAll(query);
    return {
      data: result.data.map((h) => this.toResponseDto(h)),
      meta: result.meta,
    };
  }

  async findOne(id: string): Promise<HospitalResponseDto> {
    const hospital = await this.repository.findById(id);
    if (!hospital) {
      throw new NotFoundException("Hospital nao encontrado");
    }
    return this.toResponseDto(hospital);
  }

  async update(
    id: string,
    dto: UpdateHospitalDto,
  ): Promise<HospitalResponseDto> {
    await this.findOne(id);
    if (dto.cnpj) {
      const exists = await this.repository.findByCnpjExcludingId(dto.cnpj, id);
      if (exists) {
        throw new ConflictException("Hospital com este CNPJ ja existe");
      }
    }
    const hospital = await this.repository.update(id, dto);
    return this.toResponseDto(hospital);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private toResponseDto(hospital: Hospital): HospitalResponseDto {
    return {
      id: hospital.id,
      nome: hospital.nome,
      cnpj: hospital.cnpj,
      endereco: hospital.endereco,
      cidade: hospital.cidade,
      estado: hospital.estado,
      cep: hospital.cep,
      telefone: hospital.telefone,
      email: hospital.email,
      ativo: hospital.ativo,
      grupoId: hospital.grupoId,
      createdAt: hospital.createdAt,
      updatedAt: hospital.updatedAt,
    };
  }
}
