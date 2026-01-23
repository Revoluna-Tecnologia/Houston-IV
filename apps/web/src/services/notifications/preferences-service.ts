import { apiClient } from '../api-client'
import type { NotificationPreference, UpdatePreferenceInput } from './types'

const BASE_URL = '/notifications/preferences'

export async function getPreferences(): Promise<NotificationPreference[]> {
  return apiClient.get<NotificationPreference[]>(BASE_URL)
}

export async function updatePreference(
  input: UpdatePreferenceInput,
): Promise<NotificationPreference> {
  return apiClient.patch<NotificationPreference>(BASE_URL, input)
}

export async function updatePreferences(
  preferences: UpdatePreferenceInput[],
): Promise<NotificationPreference[]> {
  return apiClient.post<NotificationPreference[]>(`${BASE_URL}/bulk`, {
    preferences,
  })
}

export const preferencesService = {
  getPreferences,
  updatePreference,
  updatePreferences,
}
