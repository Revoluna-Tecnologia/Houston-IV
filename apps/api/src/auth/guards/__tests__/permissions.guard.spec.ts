import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionsGuard } from '../permissions.guard'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator'
import { AppPermission, AppRole, AuthenticatedUser } from '../../types/auth.types'

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard
  let reflector: Reflector
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

  const createAuthenticatedUser = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    id: 'user-123',
    email: 'test@test.com',
    name: 'Test User',
    roles: [AppRole.ESCALISTA],
    permissions: [],
    grupoIds: [],
    hospitalIds: [],
    setorIds: [],
    ...overrides,
  })

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector

    guard = new PermissionsGuard(reflector)
    mockRequest = {}
    mockContext = createMockContext(mockRequest)
  })

  describe('canActivate', () => {
    it('should allow access when no permissions are required', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should allow access when permissions array is empty', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([])

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user is not authenticated', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([AppPermission.VAGAS_SELECT])
      mockRequest.user = undefined
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
      expect(() => guard.canActivate(mockContext)).toThrow('Usuário não autenticado')
    })

    it('should throw ForbiddenException when user has no permissions', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([AppPermission.VAGAS_SELECT])
      mockRequest.user = createAuthenticatedUser({ permissions: [] })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
      expect(() => guard.canActivate(mockContext)).toThrow('Usuário sem permissões atribuídas')
    })

    it('should allow access when user has required permission', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([AppPermission.VAGAS_SELECT])
      mockRequest.user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
      })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should deny access when user lacks required permission', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([AppPermission.VAGAS_DELETE])
      mockRequest.user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
      })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
    })

    it('should require ALL permissions when multiple are specified', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([
        AppPermission.VAGAS_SELECT,
        AppPermission.VAGAS_UPDATE,
      ])
      mockRequest.user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT],
      })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
    })

    it('should allow access when user has ALL required permissions', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([
        AppPermission.VAGAS_SELECT,
        AppPermission.VAGAS_UPDATE,
      ])
      mockRequest.user = createAuthenticatedUser({
        permissions: [
          AppPermission.VAGAS_SELECT,
          AppPermission.VAGAS_UPDATE,
          AppPermission.VAGAS_INSERT,
        ],
      })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should include required permissions in error message', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([
        AppPermission.VAGAS_DELETE,
        AppPermission.MEDICOS_DELETE,
      ])
      mockRequest.user = createAuthenticatedUser({
        permissions: [AppPermission.VAGAS_SELECT],
      })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(
        /Permissões insuficientes. Requer: vagas.delete, medicos.delete/
      )
    })

    it('should use reflector with correct key', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined)

      guard.canActivate(mockContext)

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        expect.anything()
      )
    })

    it('should handle user with undefined permissions array', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue([AppPermission.VAGAS_SELECT])
      mockRequest.user = createAuthenticatedUser()
      ;(mockRequest.user as AuthenticatedUser).permissions = undefined as unknown as AppPermission[]
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
    })
  })
})
