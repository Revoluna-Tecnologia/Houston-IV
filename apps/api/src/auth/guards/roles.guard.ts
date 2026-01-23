import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, MIN_ROLE_KEY } from '../decorators/roles.decorator'
import {
  AppRole,
  AuthenticatedUser,
  ROLE_HIERARCHY,
} from '../types/auth.types'

/**
 * Guard que verifica se o usuário tem os roles requeridos
 * Suporta verificação por lista de roles ou por role mínimo (hierarquia)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    )

    const minRole = this.reflector.getAllAndOverride<AppRole>(MIN_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // Se não há roles requeridos, permite acesso
    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      minRole === undefined
    ) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as AuthenticatedUser | undefined

    if (!user) {
      this.logger.warn('RolesGuard executado sem usuário autenticado')
      throw new ForbiddenException('Usuário não autenticado')
    }

    if (!user.roles || user.roles.length === 0) {
      this.logger.warn(`Usuário ${user.email} não possui roles`)
      throw new ForbiddenException('Usuário sem roles atribuídos')
    }

    // Verificação por role mínimo (hierarquia)
    if (minRole !== undefined) {
      const minLevel = ROLE_HIERARCHY[minRole]
      const hasMinLevel = user.roles.some(
        (role) => ROLE_HIERARCHY[role] >= minLevel
      )

      if (!hasMinLevel) {
        this.logger.warn(
          `Usuário ${user.email} com role insuficiente. Mínimo: ${minRole}`
        )
        throw new ForbiddenException(`Role mínimo requerido: ${minRole}`)
      }

      return true
    }

    // Verificação por lista de roles (qualquer um serve)
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => user.roles.includes(role))

      if (!hasRole) {
        this.logger.warn(
          `Usuário ${user.email} sem roles requeridos: ${requiredRoles.join(', ')}`
        )
        throw new ForbiddenException(
          `Roles requeridos: ${requiredRoles.join(' ou ')}`
        )
      }
    }

    return true
  }
}
