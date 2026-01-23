export type UserRoleType =
  | 'administrador'
  | 'moderador'
  | 'gestor'
  | 'coordenador'
  | 'escalista'

export const USER_ROLES: readonly UserRoleType[] = [
  'administrador',
  'moderador',
  'gestor',
  'coordenador',
  'escalista',
] as const

export const ADMIN_ROLES: readonly UserRoleType[] = [
  'administrador',
  'moderador',
] as const
