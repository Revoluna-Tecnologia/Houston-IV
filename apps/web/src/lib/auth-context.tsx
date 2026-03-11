'use client'

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useSession, signIn, signOut, signUp } from './auth-client'
import type { User } from '@/services/types'
import { UserRole } from '@/services/types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: { email: string; password: string; name: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession()

  const login = async (email: string, password: string) => {
    await signIn.email({ email, password })
  }

  const logout = async () => {
    await signOut()
  }

  const register = async (data: { email: string; password: string; name: string }) => {
    await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    })
  }

  const user = useMemo((): User | null => {
    if (!session?.user) return null
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

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
