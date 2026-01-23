import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { PermissionsService } from '../services/permissions.service'
import { AuthenticatedUser } from '../types/auth.types'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Guard de autenticação que verifica a sessão do Better Auth
 * e popula o usuário com roles e permissões
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()

    // Better Auth popula session via middleware
    const session = request.session
    const sessionUser = session?.user

    if (!sessionUser?.id) {
      this.logger.warn('Tentativa de acesso sem sessão válida')
      throw new UnauthorizedException('Sessão inválida ou expirada')
    }

    try {
      // Buscar roles e permissões do usuário
      const userPermissions = await this.permissionsService.getUserPermissions(
        sessionUser.id
      )

      // Montar objeto do usuário autenticado
      const authenticatedUser: AuthenticatedUser = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        roles: userPermissions.roles,
        permissions: userPermissions.permissions,
        grupoIds: userPermissions.grupoIds,
        hospitalIds: userPermissions.hospitalIds,
        setorIds: userPermissions.setorIds,
      }

      // Anexar usuário à requisição
      request.user = authenticatedUser

      this.logger.debug(
        `Usuário ${sessionUser.email} autenticado com ${userPermissions.roles.length} roles`
      )

      return true
    } catch (error) {
      this.logger.error(
        `Erro ao autenticar usuário ${sessionUser.id}`,
        error instanceof Error ? error.stack : undefined
      )
      throw new UnauthorizedException('Erro ao validar sessão')
    }
  }
}
