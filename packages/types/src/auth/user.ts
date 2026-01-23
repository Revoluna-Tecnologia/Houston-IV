import type { UserRoleType } from './roles'

export interface User {
  id: string
  email: string
  nome: string
  role: UserRoleType
  grupoIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface JwtPayload {
  sub: string
  email: string
  userRole: UserRoleType
  permissions: string[]
  roles: string[]
  grupoIds: string[]
  iat?: number
  exp?: number
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nome: string
  role?: UserRoleType
  grupoIds?: string[]
}
