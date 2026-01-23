'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { preferencesService } from '@/services/notifications'
import type { UpdatePreferenceInput } from '@/services/notifications'

const PREFERENCES_KEY = ['notifications', 'preferences']

export function useNotificationPreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => preferencesService.getPreferences(),
  })
}

export function useUpdatePreference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdatePreferenceInput) =>
      preferencesService.updatePreference(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY })
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preferences: UpdatePreferenceInput[]) =>
      preferencesService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY })
    },
  })
}
