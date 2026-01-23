import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../types/auth.types'

/**
 * Guard que verifica se o usuário tem as permissões requeridas
 * Deve ser usado após o AuthGuard
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      AppPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()])

    // Se não há permissões requeridas, permite acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as AuthenticatedUser | undefined

    if (!user) {
      this.logger.warn('PermissionsGuard executado sem usuário autenticado')
      throw new ForbiddenException('Usuário não autenticado')
    }

    if (!user.permissions || user.permissions.length === 0) {
      this.logger.warn(`Usuário ${user.email} não possui permissões`)
      throw new ForbiddenException('Usuário sem permissões atribuídas')
    }

    // Verificar se o usuário tem todas as permissões requeridas
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission)
    )

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (p) => !user.permissions.includes(p)
      )
      this.logger.warn(
        `Usuário ${user.email} sem permissões: ${missingPermissions.join(', ')}`
      )
      throw new ForbiddenException(
        `Permissões insuficientes. Requer: ${requiredPermissions.join(', ')}`
      )
    }

    return true
  }
}
