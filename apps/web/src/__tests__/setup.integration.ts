/**
 * Integration test setup
 * Connects to real backend running in Docker
 */

import { beforeAll, afterAll, beforeEach } from 'vitest'

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api'

// Test user credentials
export const TEST_USER = {
  email: 'admin@houston.test',
  password: 'Admin@123456',
}

// Session token for authenticated requests
let sessionToken: string | null = null

export async function login(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  const cookies = response.headers.get('set-cookie')
  const match = cookies?.match(/better-auth\.session_token=([^;]+)/)
  sessionToken = match?.[1] || null

  if (!sessionToken) {
    throw new Error('No session token received')
  }

  return sessionToken
}

export function getSessionToken(): string | null {
  return sessionToken
}

export function getAuthHeaders(): Record<string, string> {
  if (!sessionToken) {
    throw new Error('Not logged in')
  }

  return {
    Cookie: `better-auth.session_token=${sessionToken}`,
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

beforeAll(async () => {
  // Wait for API to be available
  let attempts = 0
  const maxAttempts = 30

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      if (response.ok) {
        console.log('API is ready')
        break
      }
    } catch {
      // API not ready yet
    }

    attempts++
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  if (attempts >= maxAttempts) {
    throw new Error('API did not become ready in time')
  }

  // Login
  await login()
})

afterAll(() => {
  sessionToken = null
})

beforeEach(() => {
  // Reset any test state
})
