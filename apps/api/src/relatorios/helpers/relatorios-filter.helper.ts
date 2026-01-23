import type { RelatorioFiltrosDto } from '../dto'

type WhereClause = Record<string, unknown>
type NestedWhere = Record<string, unknown>

export function buildVagaFilterWhere(filtros: RelatorioFiltrosDto): WhereClause {
  const where: WhereClause = {}

  if (filtros.medicoId) {
    where.medicoId = filtros.medicoId
  }

  const vagaWhere = buildNestedVagaWhere(filtros)
  if (Object.keys(vagaWhere).length > 0) {
    where.vaga = vagaWhere
  }

  return where
}

export function buildGradeFilterWhere(filtros: RelatorioFiltrosDto): WhereClause {
  const where: WhereClause = {}

  if (filtros.hospitalId) where.hospitalId = filtros.hospitalId
  if (filtros.setorId) where.setorId = filtros.setorId
  if (filtros.dataInicio) where.dataInicio = { gte: new Date(filtros.dataInicio) }
  if (filtros.dataFim) where.dataFim = { lte: new Date(filtros.dataFim) }

  return where
}

function buildNestedVagaWhere(filtros: RelatorioFiltrosDto): NestedWhere {
  const vagaWhere: NestedWhere = {}

  if (filtros.dataInicio || filtros.dataFim) {
    vagaWhere.data = buildDateRange(filtros.dataInicio, filtros.dataFim)
  }

  if (filtros.hospitalId) {
    vagaWhere.hospitalId = filtros.hospitalId
  }

  if (filtros.setorId) {
    vagaWhere.setorId = filtros.setorId
  }

  return vagaWhere
}

function buildDateRange(dataInicio?: string, dataFim?: string): NestedWhere {
  const range: NestedWhere = {}

  if (dataInicio) {
    range.gte = new Date(dataInicio)
  }

  if (dataFim) {
    range.lte = new Date(dataFim)
  }

  return range
}
