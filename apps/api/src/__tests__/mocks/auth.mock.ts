import { vi } from 'vitest'

/**
 * Mock de sessão do Better Auth para testes
 */
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: 'test-session-id',
    userId: 'test-user-id',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

/**
 * Factory para criar sessão mock customizada
 */
export function createMockSession(overrides?: Partial<typeof mockSession>) {
  return {
    ...mockSession,
    ...overrides,
    user: {
      ...mockSession.user,
      ...overrides?.user,
    },
    session: {
      ...mockSession.session,
      ...overrides?.session,
    },
  }
}

/**
 * Mock do AuthGuard para testes
 */
export const mockAuthGuard = {
  canActivate: vi.fn().mockReturnValue(true),
}

/**
 * Mock do PermissionsService para testes
 */
export const mockPermissionsService = {
  getUserPermissions: vi.fn().mockResolvedValue({
    roles: ['administrador'],
    permissions: [
      'vagas.select',
      'vagas.insert',
      'vagas.update',
      'vagas.delete',
      'medicos.select',
      'medicos.insert',
      'medicos.update',
      'medicos.delete',
    ],
    grupoIds: [],
    hospitalIds: [],
    setorIds: [],
  }),
  hasPermission: vi.fn().mockReturnValue(true),
  hasAllPermissions: vi.fn().mockReturnValue(true),
  hasRole: vi.fn().mockReturnValue(true),
}
