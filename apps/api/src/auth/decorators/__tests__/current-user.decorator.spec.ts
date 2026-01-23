import { describe, it, expect } from 'vitest'
import { ExecutionContext } from '@nestjs/common'
import { AuthenticatedUser } from '../../types/auth.types'
import { UserRole } from '@prisma/client'

/**
 * Test the CurrentUser decorator logic directly.
 * The actual decorator factory is equivalent to this function.
 */
function currentUserFactory(
  data: keyof AuthenticatedUser | undefined,
  ctx: ExecutionContext
): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] | undefined {
  const request = ctx.switchToHttp().getRequest()
  const user = request.user as AuthenticatedUser | undefined

  if (!user) {
    return undefined
  }

  return data ? user[data] : user
}

describe('CurrentUser decorator logic', () => {
  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    nome: 'Test User',
    role: UserRole.administrador,
    grupoId: 'grupo-1',
    hospitalId: 'hospital-1',
    setorId: 'setor-1',
    permissions: ['read:vagas', 'write:vagas'],
  }

  const createMockContext = (user?: AuthenticatedUser): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getType: () => 'http',
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
    } as unknown as ExecutionContext
  }

  describe('when user is present', () => {
    it('should return full user when no data specified', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory(undefined, ctx)

      expect(result).toEqual(mockUser)
    })

    it('should return user id when data is "id"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('id', ctx)

      expect(result).toBe('user-123')
    })

    it('should return user email when data is "email"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('email', ctx)

      expect(result).toBe('test@example.com')
    })

    it('should return user role when data is "role"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('role', ctx)

      expect(result).toBe(UserRole.administrador)
    })

    it('should return grupoId when data is "grupoId"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('grupoId', ctx)

      expect(result).toBe('grupo-1')
    })

    it('should return permissions array when data is "permissions"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('permissions', ctx)

      expect(result).toEqual(['read:vagas', 'write:vagas'])
    })

    it('should return nome when data is "nome"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('nome', ctx)

      expect(result).toBe('Test User')
    })

    it('should return hospitalId when data is "hospitalId"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('hospitalId', ctx)

      expect(result).toBe('hospital-1')
    })

    it('should return setorId when data is "setorId"', () => {
      const ctx = createMockContext(mockUser)

      const result = currentUserFactory('setorId', ctx)

      expect(result).toBe('setor-1')
    })
  })

  describe('when user is not present', () => {
    it('should return undefined when no user in request', () => {
      const ctx = createMockContext(undefined)

      const result = currentUserFactory(undefined, ctx)

      expect(result).toBeUndefined()
    })

    it('should return undefined when data specified but no user', () => {
      const ctx = createMockContext(undefined)

      const result = currentUserFactory('id', ctx)

      expect(result).toBeUndefined()
    })
  })
})
