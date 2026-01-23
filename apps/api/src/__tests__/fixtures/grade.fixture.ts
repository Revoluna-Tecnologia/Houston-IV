import type { Grade, GradeStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

type GradeOverrides = Partial<Omit<Grade, 'dataInicio' | 'dataFim'>> & {
  dataInicio?: Date | string
  dataFim?: Date | string
}

export const createGradeFixture = (overrides?: GradeOverrides): Grade => {
  const dataInicio = overrides?.dataInicio
    ? typeof overrides.dataInicio === 'string'
      ? new Date(overrides.dataInicio)
      : overrides.dataInicio
    : new Date('2025-01-01')
  const dataFim = overrides?.dataFim
    ? typeof overrides.dataFim === 'string'
      ? new Date(overrides.dataFim)
      : overrides.dataFim
    : new Date('2025-01-31')

  return {
    id: randomUUID(),
    nome: 'Grade Teste',
    descricao: 'Descricao da grade',
    hospitalId: randomUUID(),
    setorId: randomUUID(),
    status: 'rascunho' as GradeStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
    dataInicio,
    dataFim,
  }
}
