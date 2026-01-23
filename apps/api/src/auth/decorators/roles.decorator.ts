import { SetMetadata } from '@nestjs/common'
import { AppRole } from '../types/auth.types'

export const ROLES_KEY = 'roles'

/**
 * Decorator para definir roles mínimas requeridas em um endpoint
 * Verifica se o usuário tem pelo menos um dos roles especificados
 *
 * @example
 * // Requer role específico
 * @RequireRoles(AppRole.ADMINISTRADOR)
 * @Delete(':id')
 * remove() {}
 *
 * @example
 * // Requer qualquer um dos roles listados
 * @RequireRoles(AppRole.GESTOR, AppRole.COORDENADOR)
 * @Get()
 * findAll() {}
 */
export const RequireRoles = (...roles: AppRole[]) =>
  SetMetadata(ROLES_KEY, roles)

export const MIN_ROLE_KEY = 'minRole'

/**
 * Decorator para definir role mínimo baseado na hierarquia
 * Aceita o role especificado e todos os superiores
 *
 * @example
 * // Aceita gestor, moderador e administrador
 * @RequireMinRole(AppRole.GESTOR)
 * @Post()
 * create() {}
 */
export const RequireMinRole = (role: AppRole) =>
  SetMetadata(MIN_ROLE_KEY, role)
