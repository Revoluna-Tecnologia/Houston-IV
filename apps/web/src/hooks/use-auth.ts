'use client'

import { useSession, signIn, signOut, signUp } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { useRouter } from '@/i18n/navigation'
import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { User } from '../services/types'
import { UserRole } from '../services/types'

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: { email: string; password: string; name: string }) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithMicrosoft: () => Promise<void>
  loginWithMagicLink: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()
  const t = useTranslations('Hooks.auth')

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn.email({
      email,
      password,
      callbackURL: '/',
    })

    if (result.error) {
      throw new Error(result.error.message || t('loginError'))
    }

    // Refetch session to update auth state before redirecting
    await refetch()

    router.replace('/')
  }, [router, refetch, t])

  const logout = useCallback(async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace('/auth/login')
        },
      },
    })
  }, [router])

  const register = useCallback(async (data: { email: string; password: string; name: string }) => {
    const result = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      callbackURL: '/',
    })

    if (result.error) {
      throw new Error(result.error.message || t('signupError'))
    }

    router.replace('/')
  }, [router, t])

  const loginWithGoogle = useCallback(async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
  }, [])

  const loginWithMicrosoft = useCallback(async () => {
    await signIn.social({
      provider: 'microsoft',
      callbackURL: '/',
    })
  }, [])

  const loginWithMagicLink = useCallback(async (email: string) => {
    await authClient.signIn.magicLink({
      email,
      callbackURL: '/',
    })
  }, [])

  const refreshUser = useCallback(async () => {
    await refetch()
  }, [refetch])

  const user = useMemo((): User | null => {
    if (!session?.user) {
      return null
    }

    const sessionUser = session.user
    const role = (sessionUser.role as string) || 'escalista'

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: role as UserRole,
      grupoIds: (sessionUser.grupoIds as string[]) || [],
      ativo: true,
      createdAt: sessionUser.createdAt ? new Date(sessionUser.createdAt) : new Date(),
      updatedAt: sessionUser.updatedAt ? new Date(sessionUser.updatedAt) : new Date(),
    }
  }, [session?.user])

  return {
    user,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    login,
    logout,
    register,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithMagicLink,
    refreshUser,
  }
}
