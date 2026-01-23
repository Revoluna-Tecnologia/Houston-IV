import type { User, UserRole } from '@prisma/client'
import { randomUUID } from 'crypto'

interface CreateUserFixtureParams {
  id?: string
  email?: string
  emailVerified?: boolean
  name?: string
  image?: string | null
  role?: UserRole
  grupoIds?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export const createUserFixture = (params?: CreateUserFixtureParams): User => ({
  id: params?.id ?? randomUUID(),
  email: params?.email ?? 'user@example.com',
  emailVerified: params?.emailVerified ?? false,
  name: params?.name ?? 'Test User',
  image: params?.image ?? null,
  role: params?.role ?? 'escalista',
  grupoIds: params?.grupoIds ?? [],
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
})

export const createAdminUserFixture = (params?: CreateUserFixtureParams): User =>
  createUserFixture({ ...params, role: 'administrador' })

export const createModeradorUserFixture = (params?: CreateUserFixtureParams): User =>
  createUserFixture({ ...params, role: 'moderador' })

export const createGestorUserFixture = (params?: CreateUserFixtureParams): User =>
  createUserFixture({ ...params, role: 'gestor' })
