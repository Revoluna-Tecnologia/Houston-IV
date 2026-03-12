import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Grade, TimeSlot, Prisma } from "../generated/prisma/client";
import type { CreateGradeDto, GradeQueryDto, CreateTimeSlotDto } from "./dto";
import type { PaginatedResult } from "../common";

@Injectable()
export class GradesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateGradeDto): Promise<Grade> {
    return this.prisma.grade.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        hospitalId: data.hospitalId,
        setorId: data.setorId,
      },
    });
  }

  async findAll(query: GradeQueryDto): Promise<PaginatedResult<Grade>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.grade.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Grade | null> {
    return this.prisma.grade.findFirst({
      where: { id, ...this.prisma.notDeleted() },
      include: { timeSlots: true },
    });
  }

  async findByHospitalAndSetor(
    hospitalId: string,
    setorId: string,
  ): Promise<Grade[]> {
    return this.prisma.grade.findMany({
      where: { hospitalId, setorId, ...this.prisma.notDeleted() },
    });
  }

  async update(id: string, data: Prisma.GradeUpdateInput): Promise<Grade> {
    return this.prisma.grade.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.grade.update({
      where: { id },
      data: this.prisma.softDeleteData(),
    });
  }

  async addTimeSlots(
    gradeId: string,
    timeSlots: CreateTimeSlotDto[],
  ): Promise<TimeSlot[]> {
    const data = timeSlots.map((slot) => ({
      gradeId,
      data: new Date(slot.data),
      horaInicio: slot.horaInicio,
      horaFim: slot.horaFim,
      medicoId: slot.medicoId ?? null,
    }));

    await this.prisma.timeSlot.createMany({ data });
    return this.prisma.timeSlot.findMany({ where: { gradeId } });
  }

  async getTimeSlots(gradeId: string): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({ where: { gradeId } });
  }

  private buildWhereClause(query: GradeQueryDto): Prisma.GradeWhereInput {
    const where: Prisma.GradeWhereInput = {
      ...this.prisma.notDeleted(),
    };
    if (query.hospitalId) where.hospitalId = query.hospitalId;
    if (query.setorId) where.setorId = query.setorId;
    if (query.status)
      where.status = query.status as Prisma.EnumGradeStatusFilter;
    if (query.dataInicio || query.dataFim) {
      where.dataInicio = {};
      if (query.dataInicio) where.dataInicio.gte = new Date(query.dataInicio);
      if (query.dataFim) where.dataInicio.lte = new Date(query.dataFim);
    }
    return where;
  }
}
