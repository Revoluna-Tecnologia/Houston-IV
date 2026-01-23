'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications'
import type { NotificationQueryParams } from '@/services/notifications'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_COUNT_KEY = ['notifications', 'unread-count']

export function useNotifications(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => notificationsService.getNotifications(params),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}
