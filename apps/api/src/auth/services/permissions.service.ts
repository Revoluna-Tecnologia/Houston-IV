import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  AppRole,
  AppPermission,
  AuthenticatedUser,
  UserRoleRecord,
  RolePermissionRecord,
  ROLE_HIERARCHY,
} from '../types/auth.types'

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca roles e permissões de um usuário
   */
  async getUserPermissions(userId: string): Promise<{
    roles: AppRole[]
    permissions: AppPermission[]
    grupoIds: string[]
    hospitalIds: string[]
    setorIds: string[]
  }> {
    try {
      // Buscar roles do usuário
      const userRoles = await this.prisma.$queryRaw<UserRoleRecord[]>`
        SELECT role, grupo_ids, hospital_ids, setor_ids
        FROM houston.user_roles
        WHERE user_id = ${userId}::uuid
      `

      if (!userRoles.length) {
        this.logger.warn(`Usuário ${userId} não possui roles atribuídos`)
        return {
          roles: [],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }
      }

      const roles = userRoles.map((r) => r.role as AppRole)

      // Buscar permissões baseadas nas roles
      const rolePermissions = await this.prisma.$queryRaw<
        RolePermissionRecord[]
      >`
        SELECT DISTINCT permission
        FROM houston.role_permissions
        WHERE role = ANY(${roles}::houston.app_role[])
      `

      const permissions = rolePermissions.map((p) => p.permission as AppPermission)

      // Agregar IDs de grupos, hospitais e setores
      const grupoIds = [
        ...new Set(userRoles.flatMap((r) => r.grupo_ids || [])),
      ]
      const hospitalIds = [
        ...new Set(userRoles.flatMap((r) => r.hospital_ids || [])),
      ]
      const setorIds = [
        ...new Set(userRoles.flatMap((r) => r.setor_ids || [])),
      ]

      this.logger.debug(
        `Usuário ${userId}: ${roles.length} roles, ${permissions.length} permissões`
      )

      return {
        roles,
        permissions,
        grupoIds,
        hospitalIds,
        setorIds,
      }
    } catch (error) {
      this.logger.error(`Erro ao buscar permissões do usuário ${userId}`, error)
      throw error
    }
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  hasPermission(user: AuthenticatedUser, permission: AppPermission): boolean {
    return user.permissions.includes(permission)
  }

  /**
   * Verifica se o usuário tem todas as permissões listadas
   */
  hasAllPermissions(
    user: AuthenticatedUser,
    permissions: AppPermission[]
  ): boolean {
    return permissions.every((p) => user.permissions.includes(p))
  }

  /**
   * Verifica se o usuário tem pelo menos uma das permissões listadas
   */
  hasAnyPermission(
    user: AuthenticatedUser,
    permissions: AppPermission[]
  ): boolean {
    return permissions.some((p) => user.permissions.includes(p))
  }

  /**
   * Verifica se o usuário tem um role específico
   */
  hasRole(user: AuthenticatedUser, role: AppRole): boolean {
    return user.roles.includes(role)
  }

  /**
   * Verifica se o usuário tem um role de nível igual ou superior
   */
  hasRoleLevel(user: AuthenticatedUser, minRole: AppRole): boolean {
    const minLevel = ROLE_HIERARCHY[minRole]
    return user.roles.some((role) => ROLE_HIERARCHY[role] >= minLevel)
  }

  /**
   * Verifica se o usuário pode gerenciar outro role (hierarquia)
   */
  canManageRole(user: AuthenticatedUser, targetRole: AppRole): boolean {
    const userMaxLevel = Math.max(
      ...user.roles.map((r) => ROLE_HIERARCHY[r])
    )
    return userMaxLevel > ROLE_HIERARCHY[targetRole]
  }

  /**
   * Verifica se o usuário tem acesso a um grupo específico
   */
  hasAccessToGrupo(user: AuthenticatedUser, grupoId: string): boolean {
    // Administradores têm acesso a tudo
    if (user.roles.includes(AppRole.ADMINISTRADOR)) {
      return true
    }
    return user.grupoIds.includes(grupoId)
  }

  /**
   * Verifica se o usuário tem acesso a um hospital específico
   */
  hasAccessToHospital(user: AuthenticatedUser, hospitalId: string): boolean {
    // Administradores têm acesso a tudo
    if (user.roles.includes(AppRole.ADMINISTRADOR)) {
      return true
    }
    return user.hospitalIds.includes(hospitalId)
  }

  /**
   * Verifica se o usuário tem acesso a um setor específico
   */
  hasAccessToSetor(user: AuthenticatedUser, setorId: string): boolean {
    // Administradores têm acesso a tudo
    if (user.roles.includes(AppRole.ADMINISTRADOR)) {
      return true
    }
    return user.setorIds.includes(setorId)
  }
}
