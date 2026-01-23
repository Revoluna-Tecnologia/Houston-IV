import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from '../../prisma/prisma.module'
import { PermissionsService } from '../services/permissions.service'
import { AuthGuard } from '../guards/auth.guard'
import { PermissionsGuard } from '../guards/permissions.guard'
import { RolesGuard } from '../guards/roles.guard'

/**
 * Módulo RBAC (Role-Based Access Control)
 * Fornece autenticação e autorização baseada em roles e permissões
 * Inclui Rate Limiting via ThrottlerGuard
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PermissionsService,
    // Guards globais (ordem importa!)
    // 1. ThrottlerGuard - Rate limiting primeiro
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. AuthGuard - Autenticação
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // 3. RolesGuard - Verificação de roles
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 4. PermissionsGuard - Verificação de permissões
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [PermissionsService],
})
export class RbacModule {}
