import { SetMetadata } from '@nestjs/common'
import { AppPermission } from '../types/auth.types'

export const PERMISSIONS_KEY = 'permissions'

/**
 * Decorator para definir permissões requeridas em um endpoint
 *
 * @example
 * // Requer uma permissão
 * @RequirePermissions(AppPermission.VAGAS_SELECT)
 * @Get()
 * findAll() {}
 *
 * @example
 * // Requer múltiplas permissões (todas são necessárias)
 * @RequirePermissions(AppPermission.VAGAS_SELECT, AppPermission.VAGAS_UPDATE)
 * @Patch(':id')
 * update() {}
 */
export const RequirePermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)
