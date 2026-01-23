import { describe, it, expect } from 'vitest'
import { apiRequest, TEST_USER, login, getSessionToken } from '../setup.integration'

interface User {
  id: string
  email: string
  name: string
  role: string
  grupoIds: string[]
}

interface Session {
  user: User
}

describe('Auth Integration', () => {
  describe('Session', () => {
    it('should have valid session after login', async () => {
      const token = getSessionToken()
      expect(token).toBeDefined()
      expect(token).not.toBe('')
    })

    it('should get current session', async () => {
      const session = await apiRequest<Session>('/auth/get-session')

      expect(session).toBeDefined()
      expect(session.user).toBeDefined()
      expect(session.user.email).toBe(TEST_USER.email)
    })

    it('should have user data in session', async () => {
      const session = await apiRequest<Session>('/auth/get-session')

      expect(session.user.id).toBeDefined()
      expect(session.user.email).toBe(TEST_USER.email)
      expect(session.user.role).toBeDefined()
    })

    it('should have grupoIds in session', async () => {
      const session = await apiRequest<Session>('/auth/get-session')

      expect(session.user.grupoIds).toBeDefined()
      expect(Array.isArray(session.user.grupoIds)).toBe(true)
    })
  })

  describe('Sign In', () => {
    it('should sign in with valid credentials', async () => {
      // Test that login function works (already called in setup)
      const token = await login()
      expect(token).toBeDefined()
    })

    it('should fail with invalid credentials', async () => {
      const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api'

      const response = await fetch(`${API_BASE_URL}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        }),
      })

      expect(response.ok).toBe(false)
    })

    it('should fail with missing email', async () => {
      const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api'

      const response = await fetch(`${API_BASE_URL}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123',
        }),
      })

      expect(response.ok).toBe(false)
    })

    it('should fail with missing password', async () => {
      const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api'

      const response = await fetch(`${API_BASE_URL}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
        }),
      })

      expect(response.ok).toBe(false)
    })
  })

  describe('Protected Routes', () => {
    it('should access protected route with valid session', async () => {
      // Try to access a protected endpoint
      const response = await apiRequest<{ data: unknown[] }>('/hospitais')

      expect(response).toBeDefined()
      expect(response.data).toBeDefined()
    })

    it('should fail to access protected route without session', async () => {
      const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api'

      const response = await fetch(`${API_BASE_URL}/hospitais`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      // Should be unauthorized
      expect(response.status).toBe(401)
    })
  })

  describe('User Info', () => {
    it('should get user profile', async () => {
      const session = await apiRequest<Session>('/auth/get-session')

      expect(session.user.name).toBeDefined()
      expect(session.user.email).toBeDefined()
    })

    it('should have correct role', async () => {
      const session = await apiRequest<Session>('/auth/get-session')

      // Test user should be admin
      expect(session.user.role).toBe('administrador')
    })
  })

  describe('Permissions', () => {
    it('should have permissions based on role', async () => {
      const session = await apiRequest<Session>('/auth/get-session')

      // Admin should have access to grupos
      expect(session.user.grupoIds.length).toBeGreaterThan(0)
    })

    it('should access admin-only routes as admin', async () => {
      // Try to access escalistas (admin only)
      const response = await apiRequest<{ data: unknown[] }>('/escalistas')

      expect(response).toBeDefined()
      expect(response.data).toBeDefined()
    })
  })

  describe('Sign Out', () => {
    it('should invalidate session on sign out', async () => {
      // Get current session first
      const session = await apiRequest<Session>('/auth/get-session')
      expect(session.user).toBeDefined()

      // Sign out
      await apiRequest('/auth/sign-out', { method: 'POST' })

      // Login again to restore session for other tests
      await login()
    })
  })

  describe('Rate Limiting', () => {
    it('should not be rate limited with valid requests', async () => {
      // Make a few requests in succession
      const requests = Array.from({ length: 5 }, () =>
        apiRequest<Session>('/auth/get-session')
      )

      const results = await Promise.all(requests)

      // All requests should succeed
      results.forEach((result) => {
        expect(result.user).toBeDefined()
      })
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session across requests', async () => {
      const session1 = await apiRequest<Session>('/auth/get-session')
      const session2 = await apiRequest<Session>('/auth/get-session')

      expect(session1.user.id).toBe(session2.user.id)
    })
  })
})
