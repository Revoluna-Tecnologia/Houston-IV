import type { Escalista, EscalistaStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

interface CreateEscalistaFixtureParams {
  id?: string
  medicoId?: string
  grupoId?: string
  status?: EscalistaStatus
  createdAt?: Date
  updatedAt?: Date
}

export const createEscalistaFixture = (params?: CreateEscalistaFixtureParams): Escalista => ({
  id: params?.id ?? randomUUID(),
  medicoId: params?.medicoId ?? randomUUID(),
  grupoId: params?.grupoId ?? randomUUID(),
  status: params?.status ?? 'pendente',
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
})

export const createActiveEscalistaFixture = (params?: CreateEscalistaFixtureParams): Escalista =>
  createEscalistaFixture({ ...params, status: 'ativo' })

export const createInactiveEscalistaFixture = (params?: CreateEscalistaFixtureParams): Escalista =>
  createEscalistaFixture({ ...params, status: 'inativo' })

export const createEscalistaListFixture = (
  count: number,
  grupoId?: string
): Escalista[] =>
  Array.from({ length: count }, () =>
    createEscalistaFixture({ grupoId })
  )
