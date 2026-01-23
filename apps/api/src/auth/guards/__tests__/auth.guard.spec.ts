import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthGuard, IS_PUBLIC_KEY } from '../auth.guard'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../../prisma/prisma.service'
import { PermissionsService } from '../../services/permissions.service'
import { AppRole, AppPermission } from '../../types/auth.types'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let reflector: Reflector
  let prisma: PrismaService
  let permissionsService: PermissionsService
  let mockContext: ExecutionContext
  let mockRequest: Record<string, unknown>

  const createMockContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({} as never),
      switchToWs: () => ({} as never),
      getType: () => 'http',
    }) as unknown as ExecutionContext

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector

    prisma = {} as PrismaService

    permissionsService = {
      getUserPermissions: vi.fn(),
    } as unknown as PermissionsService

    guard = new AuthGuard(reflector, prisma, permissionsService)
    mockRequest = {}
    mockContext = createMockContext(mockRequest)
  })

  describe('canActivate', () => {
    it('should allow access for public routes', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(true)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        expect.anything(),
        expect.anything(),
      ])
    })

    it('should deny access for missing session', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = null
      mockContext = createMockContext(mockRequest)

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should deny access for session without user', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = { user: null }
      mockContext = createMockContext(mockRequest)

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should deny access for session with user without id', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = { user: { email: 'test@test.com' } }
      mockContext = createMockContext(mockRequest)

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should allow access for valid session and populate user', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = {
        user: {
          id: 'user-123',
          email: 'test@test.com',
          name: 'Test User',
        },
      }
      mockContext = createMockContext(mockRequest)

      const mockPermissions = {
        roles: [AppRole.ADMINISTRADOR],
        permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
        grupoIds: ['grupo-1'],
        hospitalIds: ['hospital-1'],
        setorIds: ['setor-1'],
      }
      vi.mocked(permissionsService.getUserPermissions).mockResolvedValue(mockPermissions)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
        roles: [AppRole.ADMINISTRADOR],
        permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
        grupoIds: ['grupo-1'],
        hospitalIds: ['hospital-1'],
        setorIds: ['setor-1'],
      })
    })

    it('should throw UnauthorizedException if permissions service fails', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = {
        user: {
          id: 'user-123',
          email: 'test@test.com',
        },
      }
      mockContext = createMockContext(mockRequest)

      vi.mocked(permissionsService.getUserPermissions).mockRejectedValue(
        new Error('Database error')
      )

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should call permissionsService with correct user id', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = {
        user: {
          id: 'user-abc-123',
          email: 'test@test.com',
        },
      }
      mockContext = createMockContext(mockRequest)

      vi.mocked(permissionsService.getUserPermissions).mockResolvedValue({
        roles: [],
        permissions: [],
        grupoIds: [],
        hospitalIds: [],
        setorIds: [],
      })

      await guard.canActivate(mockContext)

      expect(permissionsService.getUserPermissions).toHaveBeenCalledWith('user-abc-123')
    })

    it('should handle user with multiple roles', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false)
      mockRequest.session = {
        user: {
          id: 'user-123',
          email: 'test@test.com',
        },
      }
      mockContext = createMockContext(mockRequest)

      const mockPermissions = {
        roles: [AppRole.GESTOR, AppRole.COORDENADOR],
        permissions: [AppPermission.VAGAS_SELECT],
        grupoIds: ['grupo-1', 'grupo-2'],
        hospitalIds: [],
        setorIds: [],
      }
      vi.mocked(permissionsService.getUserPermissions).mockResolvedValue(mockPermissions)

      const result = await guard.canActivate(mockContext)

      expect(result).toBe(true)
      expect((mockRequest.user as Record<string, unknown>).roles).toEqual([AppRole.GESTOR, AppRole.COORDENADOR])
    })
  })
})
