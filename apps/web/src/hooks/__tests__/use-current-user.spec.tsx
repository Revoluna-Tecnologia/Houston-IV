import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCurrentUser } from '../use-current-user'
import { useSession } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

vi.mock('../services', () => ({
  UserRole: {
    ADMINISTRADOR: 'administrador',
    MODERADOR: 'moderador',
    GESTOR: 'gestor',
    COORDENADOR: 'coordenador',
    ESCALISTA: 'escalista',
  },
}))

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSession>)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('should return user when session is available', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'administrador',
        grupoIds: ['grupo-1'],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    }

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.id).toBe('user-1')
    expect(result.current.user?.email).toBe('test@example.com')
    expect(result.current.user?.name).toBe('Test User')
    expect(result.current.user?.role).toBe('administrador')
    expect(result.current.user?.grupoIds).toEqual(['grupo-1'])
  })

  it('should return null user when no session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSession>)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should return error when session fetch fails', () => {
    const mockError = { message: 'Session expired' }

    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: mockError,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toBe('Session expired')
  })

  it('should provide refetch function', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: refetchMock,
    } as ReturnType<typeof useSession>)

    const { result } = renderHook(() => useCurrentUser())

    await result.current.refetch()

    expect(refetchMock).toHaveBeenCalled()
  })

  it('should use default role when not provided', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        grupoIds: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    }

    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.user?.role).toBe('escalista')
  })
})
