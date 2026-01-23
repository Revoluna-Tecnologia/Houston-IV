'use client'

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useSession, signIn, signOut, signUp } from './auth-client'

export interface AuthContextValue {
  user: {
    id: string
    email: string
    name: string
    role?: string
    grupoIds?: string[]
  } | null
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

  const value: AuthContextValue = {
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role as string | undefined,
          grupoIds: session.user.grupoIds as string[] | undefined,
        }
      : null,
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
