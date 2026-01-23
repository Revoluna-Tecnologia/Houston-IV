import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthenticatedUser } from '../types/auth.types'

/**
 * Decorator para extrair o usuário autenticado da requisição
 *
 * @example
 * // Obter usuário completo
 * @Get()
 * findAll(@CurrentUser() user: AuthenticatedUser) {}
 *
 * @example
 * // Obter apenas um campo específico
 * @Get()
 * findAll(@CurrentUser('id') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] | undefined => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as AuthenticatedUser | undefined

    if (!user) {
      return undefined
    }

    return data ? user[data] : user
  }
)
