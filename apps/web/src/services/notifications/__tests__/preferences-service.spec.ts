import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPreferences,
  updatePreference,
  updatePreferences,
  preferencesService,
} from '../preferences-service'
import { apiClient } from '../../api-client'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('preferences-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPreferences', () => {
    it('should fetch notification preferences', async () => {
      const mockPreferences = [
        { id: '1', type: 'email', enabled: true },
        { id: '2', type: 'push', enabled: false },
      ]
      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences)

      const result = await getPreferences()

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/preferences')
      expect(result).toEqual(mockPreferences)
    })

    it('should return empty array when no preferences', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])

      const result = await getPreferences()

      expect(result).toEqual([])
    })
  })

  describe('updatePreference', () => {
    it('should update a single preference', async () => {
      const input = { type: 'email', enabled: true }
      const mockUpdated = { id: '1', type: 'email', enabled: true }
      vi.mocked(apiClient.patch).mockResolvedValue(mockUpdated)

      const result = await updatePreference(input)

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/preferences', input)
      expect(result).toEqual(mockUpdated)
    })

    it('should update preference to disabled', async () => {
      const input = { type: 'push', enabled: false }
      const mockUpdated = { id: '2', type: 'push', enabled: false }
      vi.mocked(apiClient.patch).mockResolvedValue(mockUpdated)

      const result = await updatePreference(input)

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/preferences', input)
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('updatePreferences', () => {
    it('should update multiple preferences', async () => {
      const preferences = [
        { type: 'email', enabled: true },
        { type: 'push', enabled: false },
      ]
      const mockUpdated = [
        { id: '1', type: 'email', enabled: true },
        { id: '2', type: 'push', enabled: false },
      ]
      vi.mocked(apiClient.post).mockResolvedValue(mockUpdated)

      const result = await updatePreferences(preferences)

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/preferences/bulk', {
        preferences,
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should handle empty preferences array', async () => {
      vi.mocked(apiClient.post).mockResolvedValue([])

      const result = await updatePreferences([])

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/preferences/bulk', {
        preferences: [],
      })
      expect(result).toEqual([])
    })
  })

  describe('preferencesService object', () => {
    it('should export all functions', () => {
      expect(preferencesService.getPreferences).toBe(getPreferences)
      expect(preferencesService.updatePreference).toBe(updatePreference)
      expect(preferencesService.updatePreferences).toBe(updatePreferences)
    })
  })
})
