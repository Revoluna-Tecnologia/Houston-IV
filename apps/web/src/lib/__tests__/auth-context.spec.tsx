import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuthContext } from '../auth-context'
import type { ReactNode } from 'react'

// Mock the auth-client module
vi.mock('../auth-client', () => ({
  useSession: vi.fn(),
  signIn: {
    email: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
}))

import { useSession, signIn, signUp, signOut } from '../auth-client'

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuthContext', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuthContext())
      }).toThrow('useAuthContext must be used within an AuthProvider')
    })
  })

  describe('AuthProvider', () => {
    describe('when session is loading', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: null,
          isPending: true,
          error: null,
        } as ReturnType<typeof useSession>)
      })

      it('should return isLoading true', () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        expect(result.current.isLoading).toBe(true)
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.user).toBeNull()
      })
    })

    describe('when user is not authenticated', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: null,
          isPending: false,
          error: null,
        } as ReturnType<typeof useSession>)
      })

      it('should return user as null', () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isLoading).toBe(false)
      })
    })

    describe('when user is authenticated', () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'administrador',
          grupoIds: ['grupo-1', 'grupo-2'],
        },
      }

      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: mockSession,
          isPending: false,
          error: null,
        } as ReturnType<typeof useSession>)
      })

      it('should return user data', () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        expect(result.current.user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'administrador',
          grupoIds: ['grupo-1', 'grupo-2'],
        })
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isLoading).toBe(false)
      })
    })

    describe('login function', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: null,
          isPending: false,
          error: null,
        } as ReturnType<typeof useSession>)
        vi.mocked(signIn.email).mockResolvedValue(undefined)
      })

      it('should call signIn.email with credentials', async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.login('test@example.com', 'password123')
        })

        expect(signIn.email).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    describe('logout function', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: { user: { id: '1', email: 'test@example.com', name: 'Test' } },
          isPending: false,
          error: null,
        } as ReturnType<typeof useSession>)
        vi.mocked(signOut).mockResolvedValue(undefined)
      })

      it('should call signOut', async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.logout()
        })

        expect(signOut).toHaveBeenCalled()
      })
    })

    describe('register function', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: null,
          isPending: false,
          error: null,
        } as ReturnType<typeof useSession>)
        vi.mocked(signUp.email).mockResolvedValue(undefined)
      })

      it('should call signUp.email with registration data', async () => {
        const { result } = renderHook(() => useAuthContext(), { wrapper })

        await act(async () => {
          await result.current.register({
            email: 'new@example.com',
            password: 'newpassword123',
            name: 'New User',
          })
        })

        expect(signUp.email).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'newpassword123',
          name: 'New User',
        })
      })
    })
  })
})
