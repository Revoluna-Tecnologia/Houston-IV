import { SetMetadata } from '@nestjs/common'
import { IS_PUBLIC_KEY } from '../guards/auth.guard'

/**
 * Decorator para marcar rotas como públicas (não requerem autenticação)
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
