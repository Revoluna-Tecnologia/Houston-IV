import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RolesGuard } from '../roles.guard'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, MIN_ROLE_KEY } from '../../decorators/roles.decorator'
import { AppRole, AuthenticatedUser } from '../../types/auth.types'

describe('RolesGuard', () => {
  let guard: RolesGuard
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

    guard = new RolesGuard(reflector)
    mockRequest = {}
    mockContext = createMockContext(mockRequest)
  })

  describe('canActivate - no requirements', () => {
    it('should allow access when no roles are required', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should allow access when roles array is empty and no minRole', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([]) // ROLES_KEY
        .mockReturnValueOnce(undefined) // MIN_ROLE_KEY

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })
  })

  describe('canActivate - user validation', () => {
    it('should throw ForbiddenException when user is not authenticated', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.ADMINISTRADOR]) // ROLES_KEY
        .mockReturnValueOnce(undefined) // MIN_ROLE_KEY
      mockRequest.user = undefined
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException('Usuário não autenticado')
      )
    })

    it('should throw ForbiddenException when user has no roles', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.ADMINISTRADOR])
        .mockReturnValueOnce(undefined)
      mockRequest.user = createAuthenticatedUser({ roles: [] })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException('Usuário sem roles atribuídos')
      )
    })
  })

  describe('canActivate - @RequireRoles', () => {
    it('should allow access for exact role match', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.GESTOR])
        .mockReturnValueOnce(undefined)
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.GESTOR] })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should allow access when user has any of the required roles', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.GESTOR, AppRole.COORDENADOR])
        .mockReturnValueOnce(undefined)
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.COORDENADOR] })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should deny access when user has none of the required roles', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.ADMINISTRADOR, AppRole.MODERADOR])
        .mockReturnValueOnce(undefined)
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.ESCALISTA] })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(
        /Roles requeridos: administrador ou moderador/
      )
    })

    it('should include required roles in error message', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.GESTOR, AppRole.COORDENADOR])
        .mockReturnValueOnce(undefined)
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.ESCALISTA] })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(
        /Roles requeridos: gestor ou coordenador/
      )
    })
  })

  describe('canActivate - @RequireMinRole (hierarchy)', () => {
    it('should allow access for exact minimum role', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(undefined) // ROLES_KEY
        .mockReturnValueOnce(AppRole.GESTOR) // MIN_ROLE_KEY
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.GESTOR] })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should allow access for higher role in hierarchy', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(AppRole.GESTOR) // Requires level 2
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.ADMINISTRADOR] }) // Level 4
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should deny access for lower role than required', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(AppRole.GESTOR) // Requires level 2
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.ESCALISTA] }) // Level 0
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(
        new ForbiddenException('Role mínimo requerido: gestor')
      )
    })

    it('should use highest role when user has multiple roles', () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(AppRole.MODERADOR) // Requires level 3
      mockRequest.user = createAuthenticatedUser({
        roles: [AppRole.ESCALISTA, AppRole.MODERADOR], // Levels 0 and 3
      })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })

    it('should respect hierarchy: administrador > moderador > gestor > coordenador > escalista', () => {
      // Test that administrador (level 4) can access moderador-required endpoint
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(AppRole.MODERADOR)
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.ADMINISTRADOR] })
      mockContext = createMockContext(mockRequest)

      expect(guard.canActivate(mockContext)).toBe(true)

      // Test that coordenador (level 1) cannot access gestor-required endpoint
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(AppRole.GESTOR)
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.COORDENADOR] })
      mockContext = createMockContext(mockRequest)

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
    })
  })

  describe('canActivate - reflector calls', () => {
    it('should use reflector with correct keys', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined)

      guard.canActivate(mockContext)

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.anything())
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(MIN_ROLE_KEY, expect.anything())
    })

    it('should prioritize minRole over roles list', () => {
      // When both are set, minRole should take precedence
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce([AppRole.ADMINISTRADOR]) // ROLES_KEY - would fail
        .mockReturnValueOnce(AppRole.ESCALISTA) // MIN_ROLE_KEY - should pass
      mockRequest.user = createAuthenticatedUser({ roles: [AppRole.ESCALISTA] })
      mockContext = createMockContext(mockRequest)

      const result = guard.canActivate(mockContext)

      expect(result).toBe(true)
    })
  })
})
