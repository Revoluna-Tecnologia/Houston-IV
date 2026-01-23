import { describe, it, expect, vi } from 'vitest'
import * as preferenceHooks from '../use-notification-preferences'

// Mock the preferences service
vi.mock('@/services/notifications', () => ({
  preferencesService: {
    getPreferences: vi.fn(),
    updatePreference: vi.fn(),
    updatePreferences: vi.fn(),
  },
}))

describe('use-notification-preferences module', () => {
  describe('exports', () => {
    it('should export useNotificationPreferences', () => {
      expect(preferenceHooks.useNotificationPreferences).toBeDefined()
      expect(typeof preferenceHooks.useNotificationPreferences).toBe('function')
    })

    it('should export useUpdatePreference', () => {
      expect(preferenceHooks.useUpdatePreference).toBeDefined()
      expect(typeof preferenceHooks.useUpdatePreference).toBe('function')
    })

    it('should export useUpdatePreferences', () => {
      expect(preferenceHooks.useUpdatePreferences).toBeDefined()
      expect(typeof preferenceHooks.useUpdatePreferences).toBe('function')
    })
  })

  describe('useNotificationPreferences', () => {
    it('should be a function with no required params', () => {
      expect(preferenceHooks.useNotificationPreferences.length).toBe(0)
    })
  })

  describe('useUpdatePreference', () => {
    it('should be a function with no required params', () => {
      expect(preferenceHooks.useUpdatePreference.length).toBe(0)
    })
  })

  describe('useUpdatePreferences', () => {
    it('should be a function with no required params', () => {
      expect(preferenceHooks.useUpdatePreferences.length).toBe(0)
    })
  })
})
