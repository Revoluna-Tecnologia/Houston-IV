'use client'

import { useSession } from '@/lib/auth-client'
import type { User } from '../services'
import { UserRole } from '../services'

interface UseCurrentUserReturn {
  user: User | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { data: session, isPending, error, refetch } = useSession()

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user.role as UserRole) || UserRole.ESCALISTA,
        grupoIds: (session.user.grupoIds as string[]) || [],
        ativo: true,
        createdAt: session.user.createdAt ? new Date(session.user.createdAt) : new Date(),
        updatedAt: session.user.updatedAt ? new Date(session.user.updatedAt) : new Date(),
      }
    : null

  return {
    user,
    isLoading: isPending,
    error: error ? new Error(error.message || 'Failed to fetch user') : null,
    refetch: async () => {
      await refetch()
    },
  }
}
