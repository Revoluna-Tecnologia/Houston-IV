import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PermissionsService } from '../services/permissions.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'
import {
  AppRole,
  AppPermission,
  AuthenticatedUser,
  ROLE_HIERARCHY,
} from '../types/auth.types'

describe('Auth Module (Integration)', () => {
  let module: TestingModule
  let permissionsService: PermissionsService
  let prisma: PrismaService
  let testUserId: string
  let testGrupoId: string
  let testHospitalId: string
  let testSetorId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [PermissionsService],
    }).compile()

    permissionsService = module.get<PermissionsService>(PermissionsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up in correct order (respecting foreign keys)
    await prisma.$executeRaw`DELETE FROM houston.user_roles`
    await prisma.setor.deleteMany()
    await prisma.hospital.deleteMany()
    await prisma.grupo.deleteMany()
    await prisma.user.deleteMany()

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: 'Grupo de Teste' },
    })
    testGrupoId = grupo.id

    // Create test hospital
    const hospital = await prisma.hospital.create({
      data: {
        nome: 'Hospital de Teste',
        grupoId: testGrupoId,
      },
    })
    testHospitalId = hospital.id

    // Create test setor
    const setor = await prisma.setor.create({
      data: {
        nome: 'Setor de Teste',
        hospitalId: testHospitalId,
      },
    })
    testSetorId = setor.id

    // Create test user via Better Auth schema
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
      },
    })
    testUserId = user.id
  })

  describe('PermissionsService', () => {
    describe('getUserPermissions', () => {
      it('should return empty permissions when user has no roles', async () => {
        const result = await permissionsService.getUserPermissions(testUserId)

        expect(result.roles).toEqual([])
        expect(result.permissions).toEqual([])
        expect(result.grupoIds).toEqual([])
        expect(result.hospitalIds).toEqual([])
        expect(result.setorIds).toEqual([])
      })

      it('should return roles and permissions for administrador', async () => {
        // Assign administrador role
        await prisma.$executeRaw`
          INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
          VALUES (${testUserId}::uuid, 'administrador', ARRAY[]::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[])
        `

        const result = await permissionsService.getUserPermissions(testUserId)

        expect(result.roles).toContain(AppRole.ADMINISTRADOR)
        expect(result.permissions.length).toBeGreaterThan(0)
        // Administrador should have all permissions
        expect(result.permissions).toContain(AppPermission.VAGAS_SELECT)
        expect(result.permissions).toContain(AppPermission.VAGAS_INSERT)
        expect(result.permissions).toContain(AppPermission.VAGAS_UPDATE)
        expect(result.permissions).toContain(AppPermission.VAGAS_DELETE)
      })

      it('should return correct scope for escalista', async () => {
        // Assign escalista role with specific scope
        await prisma.$executeRaw`
          INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
          VALUES (
            ${testUserId}::uuid,
            'escalista',
            ARRAY[${testGrupoId}]::uuid[],
            ARRAY[${testHospitalId}]::uuid[],
            ARRAY[${testSetorId}]::uuid[]
          )
        `

        const result = await permissionsService.getUserPermissions(testUserId)

        expect(result.roles).toContain(AppRole.ESCALISTA)
        expect(result.grupoIds).toContain(testGrupoId)
        expect(result.hospitalIds).toContain(testHospitalId)
        expect(result.setorIds).toContain(testSetorId)
      })

      it('should aggregate permissions from multiple roles', async () => {
        // Assign multiple roles
        await prisma.$executeRaw`
          INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
          VALUES
            (${testUserId}::uuid, 'escalista', ARRAY[${testGrupoId}]::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[]),
            (${testUserId}::uuid, 'coordenador', ARRAY[${testGrupoId}]::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[])
        `

        const result = await permissionsService.getUserPermissions(testUserId)

        expect(result.roles).toContain(AppRole.ESCALISTA)
        expect(result.roles).toContain(AppRole.COORDENADOR)
        expect(result.roles).toHaveLength(2)
      })
    })

    describe('hasPermission', () => {
      it('should return true when user has the permission', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR],
          permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasPermission(user, AppPermission.VAGAS_SELECT)).toBe(true)
      })

      it('should return false when user does not have the permission', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [AppPermission.VAGAS_SELECT],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasPermission(user, AppPermission.VAGAS_DELETE)).toBe(false)
      })
    })

    describe('hasAllPermissions', () => {
      it('should return true when user has all permissions', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR],
          permissions: [
            AppPermission.VAGAS_SELECT,
            AppPermission.VAGAS_INSERT,
            AppPermission.VAGAS_UPDATE,
          ],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(
          permissionsService.hasAllPermissions(user, [
            AppPermission.VAGAS_SELECT,
            AppPermission.VAGAS_INSERT,
          ])
        ).toBe(true)
      })

      it('should return false when user is missing one permission', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.COORDENADOR],
          permissions: [AppPermission.VAGAS_SELECT],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(
          permissionsService.hasAllPermissions(user, [
            AppPermission.VAGAS_SELECT,
            AppPermission.VAGAS_DELETE,
          ])
        ).toBe(false)
      })
    })

    describe('hasAnyPermission', () => {
      it('should return true when user has at least one permission', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [AppPermission.VAGAS_SELECT],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(
          permissionsService.hasAnyPermission(user, [
            AppPermission.VAGAS_SELECT,
            AppPermission.VAGAS_DELETE,
          ])
        ).toBe(true)
      })

      it('should return false when user has none of the permissions', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [AppPermission.COMUNICACAO_SELECT],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(
          permissionsService.hasAnyPermission(user, [
            AppPermission.VAGAS_DELETE,
            AppPermission.GRUPOS_DELETE,
          ])
        ).toBe(false)
      })
    })

    describe('hasRole', () => {
      it('should return true when user has the role', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR, AppRole.GESTOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasRole(user, AppRole.ADMINISTRADOR)).toBe(true)
        expect(permissionsService.hasRole(user, AppRole.GESTOR)).toBe(true)
      })

      it('should return false when user does not have the role', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasRole(user, AppRole.ADMINISTRADOR)).toBe(false)
      })
    })

    describe('hasRoleLevel', () => {
      it('should return true when user has role at or above min level', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.GESTOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        // Gestor (level 2) should satisfy minRole of Coordenador (level 1)
        expect(permissionsService.hasRoleLevel(user, AppRole.COORDENADOR)).toBe(true)
        expect(permissionsService.hasRoleLevel(user, AppRole.ESCALISTA)).toBe(true)
        expect(permissionsService.hasRoleLevel(user, AppRole.GESTOR)).toBe(true)
      })

      it('should return false when user role is below min level', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        // Escalista (level 0) should not satisfy minRole of Coordenador (level 1)
        expect(permissionsService.hasRoleLevel(user, AppRole.COORDENADOR)).toBe(false)
        expect(permissionsService.hasRoleLevel(user, AppRole.ADMINISTRADOR)).toBe(false)
      })
    })

    describe('canManageRole', () => {
      it('should return true when user can manage lower role', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.canManageRole(user, AppRole.GESTOR)).toBe(true)
        expect(permissionsService.canManageRole(user, AppRole.COORDENADOR)).toBe(true)
        expect(permissionsService.canManageRole(user, AppRole.ESCALISTA)).toBe(true)
      })

      it('should return false when user cannot manage equal or higher role', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.GESTOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.canManageRole(user, AppRole.ADMINISTRADOR)).toBe(false)
        expect(permissionsService.canManageRole(user, AppRole.MODERADOR)).toBe(false)
        expect(permissionsService.canManageRole(user, AppRole.GESTOR)).toBe(false)
      })
    })

    describe('hasAccessToGrupo', () => {
      it('should return true for administrador regardless of grupoIds', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToGrupo(user, testGrupoId)).toBe(true)
        expect(permissionsService.hasAccessToGrupo(user, 'any-grupo-id')).toBe(true)
      })

      it('should return true when user has access to specific grupo', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.GESTOR],
          permissions: [],
          grupoIds: [testGrupoId],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToGrupo(user, testGrupoId)).toBe(true)
      })

      it('should return false when user does not have access to grupo', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.GESTOR],
          permissions: [],
          grupoIds: ['other-grupo-id'],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToGrupo(user, testGrupoId)).toBe(false)
      })
    })

    describe('hasAccessToHospital', () => {
      it('should return true for administrador regardless of hospitalIds', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToHospital(user, testHospitalId)).toBe(true)
      })

      it('should return true when user has access to specific hospital', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.COORDENADOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [testHospitalId],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToHospital(user, testHospitalId)).toBe(true)
      })

      it('should return false when user does not have access to hospital', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.COORDENADOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: ['other-hospital-id'],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToHospital(user, testHospitalId)).toBe(false)
      })
    })

    describe('hasAccessToSetor', () => {
      it('should return true for administrador regardless of setorIds', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ADMINISTRADOR],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [],
        }

        expect(permissionsService.hasAccessToSetor(user, testSetorId)).toBe(true)
      })

      it('should return true when user has access to specific setor', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: [testSetorId],
        }

        expect(permissionsService.hasAccessToSetor(user, testSetorId)).toBe(true)
      })

      it('should return false when user does not have access to setor', () => {
        const user: AuthenticatedUser = {
          id: testUserId,
          email: 'test@example.com',
          roles: [AppRole.ESCALISTA],
          permissions: [],
          grupoIds: [],
          hospitalIds: [],
          setorIds: ['other-setor-id'],
        }

        expect(permissionsService.hasAccessToSetor(user, testSetorId)).toBe(false)
      })
    })
  })

  describe('RBAC Hierarchy', () => {
    it('should have correct role hierarchy values', () => {
      expect(ROLE_HIERARCHY[AppRole.ADMINISTRADOR]).toBe(4)
      expect(ROLE_HIERARCHY[AppRole.MODERADOR]).toBe(3)
      expect(ROLE_HIERARCHY[AppRole.GESTOR]).toBe(2)
      expect(ROLE_HIERARCHY[AppRole.COORDENADOR]).toBe(1)
      expect(ROLE_HIERARCHY[AppRole.ESCALISTA]).toBe(0)
    })

    it('should correctly order roles by hierarchy', () => {
      const roles = Object.keys(ROLE_HIERARCHY) as AppRole[]
      const sorted = roles.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])

      expect(sorted[0]).toBe(AppRole.ADMINISTRADOR)
      expect(sorted[1]).toBe(AppRole.MODERADOR)
      expect(sorted[2]).toBe(AppRole.GESTOR)
      expect(sorted[3]).toBe(AppRole.COORDENADOR)
      expect(sorted[4]).toBe(AppRole.ESCALISTA)
    })
  })
})
