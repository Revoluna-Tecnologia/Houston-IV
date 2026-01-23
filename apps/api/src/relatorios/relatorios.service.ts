import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type {
  RelatorioFiltrosDto,
  FolhaPagamentoResponseDto,
  GradesResponseDto,
  ProdutividadeResponseDto,
  FiltrosDisponiveisResponseDto,
} from './dto'
import {
  buildVagaFilterWhere,
  buildGradeFilterWhere,
  calculateHoursBetween,
  formatDateBR,
  extractMonthKey,
  monthKeyToLabel,
} from './helpers'

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async getFolhaPagamento(filtros: RelatorioFiltrosDto): Promise<FolhaPagamentoResponseDto[]> {
    const where = buildVagaFilterWhere(filtros)

    const pagamentos = await this.prisma.pagamento.findMany({
      where,
      include: {
        medico: true,
        vaga: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const grouped = new Map<string, FolhaPagamentoResponseDto>()

    for (const pag of pagamentos) {
      const existing = grouped.get(pag.medicoId)
      const horas = calculateHoursBetween(pag.vaga.horaInicio, pag.vaga.horaFim)
      const valor = Number(pag.valor)

      if (existing) {
        existing.totalVagas += 1
        existing.totalHoras += horas
        existing.valorTotal += valor
        existing.pagamentos.push({
          vagaId: pag.vagaId,
          data: pag.vaga.data,
          valor,
          status: pag.status,
        })
      } else {
        grouped.set(pag.medicoId, {
          medicoId: pag.medicoId,
          medicoNome: pag.medico.nome,
          totalVagas: 1,
          totalHoras: horas,
          valorTotal: valor,
          pagamentos: [{
            vagaId: pag.vagaId,
            data: pag.vaga.data,
            valor,
            status: pag.status,
          }],
        })
      }
    }

    return Array.from(grouped.values())
  }

  async getGrades(filtros: RelatorioFiltrosDto): Promise<GradesResponseDto[]> {
    const where = buildGradeFilterWhere(filtros)

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        hospital: true,
        setor: true,
        timeSlots: true,
      },
      orderBy: { dataInicio: 'desc' },
    })

    return grades.map((grade: { id: string; nome: string; dataInicio: Date; dataFim: Date; hospital: { nome: string }; setor: { nome: string }; timeSlots: { medicoId: string | null }[] }) => {
      const totalSlots = grade.timeSlots.length
      const slotsPreenchidos = grade.timeSlots.filter((s: { medicoId: string | null }) => s.medicoId !== null).length
      const slotsVazios = totalSlots - slotsPreenchidos

      return {
        gradeId: grade.id,
        gradeNome: grade.nome,
        hospital: grade.hospital.nome,
        setor: grade.setor.nome,
        periodo: `${formatDateBR(grade.dataInicio)} - ${formatDateBR(grade.dataFim)}`,
        totalSlots,
        slotsPreenchidos,
        slotsVazios,
      }
    })
  }

  async getProdutividade(filtros: RelatorioFiltrosDto): Promise<ProdutividadeResponseDto[]> {
    const where = buildVagaFilterWhere(filtros)

    const checkins = await this.prisma.checkinCheckout.findMany({
      where,
      include: {
        medico: true,
        vaga: true,
      },
    })

    const grouped = new Map<string, ProdutividadeResponseDto>()

    for (const checkin of checkins) {
      const existing = grouped.get(checkin.medicoId)
      const horas = calculateHoursBetween(checkin.vaga.horaInicio, checkin.vaga.horaFim)
      const valor = Number(checkin.vaga.valor)
      const presente = checkin.checkinAt !== null ? 1 : 0

      if (existing) {
        existing.vagasRealizadas += presente
        existing.horasTrabalhadas += presente ? horas : 0
        existing.valorRecebido += presente ? valor : 0
      } else {
        grouped.set(checkin.medicoId, {
          medicoId: checkin.medicoId,
          medicoNome: checkin.medico.nome,
          vagasRealizadas: presente,
          horasTrabalhadas: presente ? horas : 0,
          taxaPresenca: 0,
          valorRecebido: presente ? valor : 0,
        })
      }
    }

    const result = Array.from(grouped.values())
    const totalByMedico = new Map<string, number>()

    for (const checkin of checkins) {
      totalByMedico.set(checkin.medicoId, (totalByMedico.get(checkin.medicoId) ?? 0) + 1)
    }

    for (const item of result) {
      const total = totalByMedico.get(item.medicoId) ?? 1
      item.taxaPresenca = Math.round((item.vagasRealizadas / total) * 100)
    }

    return result
  }

  async getFiltrosDisponiveis(): Promise<FiltrosDisponiveisResponseDto> {
    const [hospitais, setores, medicos, vagas] = await Promise.all([
      this.prisma.hospital.findMany({
        where: { ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.setor.findMany({
        where: { ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.medico.findMany({
        where: { ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.vaga.findMany({
        select: { data: true },
        orderBy: { data: 'desc' },
      }),
    ])

    const mesesSet = new Set<string>()
    for (const vaga of vagas) {
      mesesSet.add(extractMonthKey(vaga.data))
    }

    const meses = Array.from(mesesSet).map((valor) => ({
      valor,
      label: monthKeyToLabel(valor),
    }))

    return { hospitais, setores, medicos, meses }
  }
}
