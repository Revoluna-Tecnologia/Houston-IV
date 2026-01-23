'use client'

import { useSession, signIn, signOut, signUp } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { User } from '../services/types'
import { UserRole } from '../services/types'

// #region agent log
const debugLog = (location: string, message: string, data: object, hypothesisId: string) => {
  fetch('http://127.0.0.1:7242/ingest/41fda97e-756c-42b1-9a82-abbcc64dfe44',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

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

  const login = useCallback(async (email: string, password: string) => {
    // #region agent log
    debugLog('use-auth.ts:login:entry', 'Login started', { email }, 'H2');
    // #endregion
    
    const result = await signIn.email({
      email,
      password,
      callbackURL: '/',
    })

    // #region agent log
    debugLog('use-auth.ts:login:afterSignIn', 'signIn.email completed', { hasError: !!result.error, errorMsg: result.error?.message, hasData: !!result.data }, 'H2');
    // #endregion

    if (result.error) {
      throw new Error(result.error.message || 'Erro ao fazer login')
    }

    // #region agent log
    debugLog('use-auth.ts:login:beforeRefetch', 'About to refetch session', {}, 'H2');
    // #endregion
    
    // Refetch session to update auth state before redirecting
    await refetch()
    
    // #region agent log
    debugLog('use-auth.ts:login:afterRefetch', 'Session refetched, about to redirect', {}, 'H3');
    // #endregion
    
    router.replace('/')
    
    // #region agent log
    debugLog('use-auth.ts:login:afterReplace', 'router.replace called', {}, 'H3');
    // #endregion
  }, [router, refetch])

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
      throw new Error(result.error.message || 'Erro ao criar conta')
    }

    router.replace('/')
  }, [router])

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
