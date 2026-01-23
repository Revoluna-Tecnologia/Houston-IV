'use client'

import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '../../../api/src/auth.config'

const baseURL = 'http://localhost:3000/api/auth'

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include',
    onSuccess: (ctx) => ctx.data,
  },
  plugins: [
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
  ],
  session: {
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  },
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
} = authClient
