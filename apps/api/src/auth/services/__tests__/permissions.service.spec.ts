import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionsService } from '../permissions.service'
import { PrismaService } from '../../../prisma/prisma.service'
import { AppRole, AppPermission, AuthenticatedUser } from '../../types/auth.types'

describe('PermissionsService', () => {
  let service: PermissionsService
  let prisma: PrismaService

  const createAuthenticatedUser = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    id: 'user-123',
    email: 'test@test.com',
    name: 'Test User',
    roles: [AppRole.ESCALISTA],
    permissions: [AppPermission.VAGAS_SELECT],
    grupoIds: [],
    hospitalIds: [],
    setorIds: [],
    ...overrides,
  })

  beforeEach(() => {
    prisma = {
      $queryRaw: vi.fn(),
    } as unknown as PrismaService

    service = new PermissionsService(prisma)
  })

  describe('getUserPermissions', () => {
    it('should return empty arrays when user has no roles', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

      const result = await service.getUserPermissions('user-123')

      expect(result).toEqual({
        roles: [],
        permissions: [],
        grupoIds: [],
        hospitalIds: [],
        setorIds: [],
      })
    })

    it('should return roles and permissions for user', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([
          {
            role: AppRole.GESTOR,
            grupo_ids: ['grupo-1'],
            hospital_ids: ['hospital-1'],
            setor_ids: ['setor-1'],
          },
        ])
        .mockResolvedValueOnce([
          { permission: AppPermission.VAGAS_SELECT },
          { permission: AppPermission.VAGAS_INSERT },
        ])

      const result = await service.getUserPermissions('user-123')

      expect(result.roles).toEqual([AppRole.GESTOR])
      expect(result.permissions).toEqual([
        AppPermission.VAGAS_SELECT,
        AppPermission.VAGAS_INSERT,
      ])
      expect(result.grupoIds).toEqual(['grupo-1'])
      expect(result.hospitalIds).toEqual(['hospital-1'])
      expect(result.setorIds).toEqual(['setor-1'])
    })

    it('should aggregate IDs from multiple roles', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([
          {
            role: AppRole.GESTOR,
            grupo_ids: ['grupo-1', 'grupo-2'],
            hospital_ids: ['hospital-1'],
            setor_ids: [],
          },
          {
            role: AppRole.COORDENADOR,
            grupo_ids: ['grupo-2', 'grupo-3'],
            hospital_ids: ['hospital-2'],
            setor_ids: ['setor-1'],
          },
        ])
        .mockResolvedValueOnce([{ permission: AppPermission.VAGAS_SELECT }])

      const result = await service.getUserPermissions('user-123')

      expect(result.roles).toEqual([AppRole.GESTOR, AppRole.COORDENADOR])
      expect(result.grupoIds).toContain('grupo-1')
      expect(result.grupoIds).toContain('grupo-2')
      expect(result.grupoIds).toContain('grupo-3')
      expect(result.hospitalIds).toContain('hospital-1')
      expect(result.hospitalIds).toContain('hospital-2')
      expect(result.setorIds).toEqual(['setor-1'])
    })

    it('should deduplicate IDs', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([
          {
            role: AppRole.GESTOR,
            grupo_ids: ['grupo-1', 'grupo-1'],
            hospital_ids: [],
            setor_ids: [],
          },
        ])
        .mockResolvedValueOnce([])

      const result = await service.getUserPermissions('user-123')

      expect(result.grupoIds).toEqual(['grupo-1'])
    })

    it('should handle null arrays from database', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([
          {
            role: AppRole.ESCALISTA,
            grupo_ids: null,
            hospital_ids: null,
            setor_ids: null,
          },
        ])
        .mockResolvedValueOnce([{ permission: AppPermission.VAGAS_SELECT }])

      const result = await service.getUserPermissions('user-123')

      expect(result.grupoIds).toEqual([])
      expect(result.hospitalIds).toEqual([])
      expect(result.setorIds).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Database error'))

      await expect(service.getUserPermissions('user-123')).rejects.toThrow('Database error')
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      const user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
      })

      expect(service.hasPermission(user, AppPermission.VAGAS_SELECT)).toBe(true)
    })

    it('should return false when user lacks the permission', () => {
      const user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT],
      })

      expect(service.hasPermission(user, AppPermission.VAGAS_DELETE)).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const user = createAuthenticatedUser({
        permissions: [
          AppPermission.VAGAS_SELECT,
          AppPermission.VAGAS_INSERT,
          AppPermission.VAGAS_UPDATE,
        ],
      })

      expect(
        service.hasAllPermissions(user, [
          AppPermission.VAGAS_SELECT,
          AppPermission.VAGAS_INSERT,
        ])
      ).toBe(true)
    })

    it('should return false when user lacks any permission', () => {
      const user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT],
      })

      expect(
        service.hasAllPermissions(user, [
          AppPermission.VAGAS_SELECT,
          AppPermission.VAGAS_DELETE,
        ])
      ).toBe(false)
    })

    it('should return true for empty permissions array', () => {
      const user = createAuthenticatedUser({ permissions: [] })

      expect(service.hasAllPermissions(user, [])).toBe(true)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT],
      })

      expect(
        service.hasAnyPermission(user, [
          AppPermission.VAGAS_SELECT,
          AppPermission.VAGAS_DELETE,
        ])
      ).toBe(true)
    })

    it('should return false when user has none of the permissions', () => {
      const user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT],
      })

      expect(
        service.hasAnyPermission(user, [
          AppPermission.VAGAS_DELETE,
          AppPermission.MEDICOS_DELETE,
        ])
      ).toBe(false)
    })

    it('should return false for empty permissions array', () => {
      const user = createAuthenticatedUser({ permissions: [AppPermission.VAGAS_SELECT] })

      expect(service.hasAnyPermission(user, [])).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR, AppRole.COORDENADOR],
      })

      expect(service.hasRole(user, AppRole.GESTOR)).toBe(true)
    })

    it('should return false when user lacks the role', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.ESCALISTA],
      })

      expect(service.hasRole(user, AppRole.ADMINISTRADOR)).toBe(false)
    })
  })

  describe('hasRoleLevel', () => {
    it('should return true for exact role level', () => {
      const user = createAuthenticatedUser({ roles: [AppRole.GESTOR] })

      expect(service.hasRoleLevel(user, AppRole.GESTOR)).toBe(true)
    })

    it('should return true for higher role level', () => {
      const user = createAuthenticatedUser({ roles: [AppRole.ADMINISTRADOR] })

      expect(service.hasRoleLevel(user, AppRole.GESTOR)).toBe(true)
    })

    it('should return false for lower role level', () => {
      const user = createAuthenticatedUser({ roles: [AppRole.ESCALISTA] })

      expect(service.hasRoleLevel(user, AppRole.GESTOR)).toBe(false)
    })

    it('should use highest role when user has multiple roles', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.ESCALISTA, AppRole.MODERADOR],
      })

      expect(service.hasRoleLevel(user, AppRole.GESTOR)).toBe(true)
    })
  })

  describe('canManageRole', () => {
    it('should return true when user has higher level than target', () => {
      const user = createAuthenticatedUser({ roles: [AppRole.ADMINISTRADOR] })

      expect(service.canManageRole(user, AppRole.MODERADOR)).toBe(true)
    })

    it('should return false when user has same level as target', () => {
      const user = createAuthenticatedUser({ roles: [AppRole.GESTOR] })

      expect(service.canManageRole(user, AppRole.GESTOR)).toBe(false)
    })

    it('should return false when user has lower level than target', () => {
      const user = createAuthenticatedUser({ roles: [AppRole.ESCALISTA] })

      expect(service.canManageRole(user, AppRole.GESTOR)).toBe(false)
    })
  })

  describe('hasAccessToGrupo', () => {
    it('should return true for administrador regardless of grupoIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.ADMINISTRADOR],
        grupoIds: [],
      })

      expect(service.hasAccessToGrupo(user, 'any-grupo-id')).toBe(true)
    })

    it('should return true when grupo is in user grupoIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR],
        grupoIds: ['grupo-1', 'grupo-2'],
      })

      expect(service.hasAccessToGrupo(user, 'grupo-1')).toBe(true)
    })

    it('should return false when grupo is not in user grupoIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR],
        grupoIds: ['grupo-1'],
      })

      expect(service.hasAccessToGrupo(user, 'grupo-999')).toBe(false)
    })
  })

  describe('hasAccessToHospital', () => {
    it('should return true for administrador regardless of hospitalIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.ADMINISTRADOR],
        hospitalIds: [],
      })

      expect(service.hasAccessToHospital(user, 'any-hospital-id')).toBe(true)
    })

    it('should return true when hospital is in user hospitalIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR],
        hospitalIds: ['hospital-1', 'hospital-2'],
      })

      expect(service.hasAccessToHospital(user, 'hospital-1')).toBe(true)
    })

    it('should return false when hospital is not in user hospitalIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR],
        hospitalIds: ['hospital-1'],
      })

      expect(service.hasAccessToHospital(user, 'hospital-999')).toBe(false)
    })
  })

  describe('hasAccessToSetor', () => {
    it('should return true for administrador regardless of setorIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.ADMINISTRADOR],
        setorIds: [],
      })

      expect(service.hasAccessToSetor(user, 'any-setor-id')).toBe(true)
    })

    it('should return true when setor is in user setorIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR],
        setorIds: ['setor-1', 'setor-2'],
      })

      expect(service.hasAccessToSetor(user, 'setor-1')).toBe(true)
    })

    it('should return false when setor is not in user setorIds', () => {
      const user = createAuthenticatedUser({
        roles: [AppRole.GESTOR],
        setorIds: ['setor-1'],
      })

      expect(service.hasAccessToSetor(user, 'setor-999')).toBe(false)
    })
  })
})
