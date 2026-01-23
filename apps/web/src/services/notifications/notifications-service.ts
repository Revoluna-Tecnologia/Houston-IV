import { apiClient } from '../api-client'
import type {
  Notification,
  NotificationPaginatedResponse,
  NotificationQueryParams,
  UnreadCountResponse,
} from './types'

const BASE_URL = '/notifications'

export async function getNotifications(
  params?: NotificationQueryParams,
): Promise<NotificationPaginatedResponse> {
  const searchParams = new URLSearchParams()
  if (params?.type) searchParams.set('type', params.type)
  if (params?.read !== undefined) searchParams.set('read', String(params.read))
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  const url = query ? `${BASE_URL}?${query}` : BASE_URL
  return apiClient.get<NotificationPaginatedResponse>(url)
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>(`${BASE_URL}/unread-count`)
}

export async function markAsRead(notificationId: string): Promise<Notification> {
  return apiClient.patch<Notification>(`${BASE_URL}/${notificationId}/read`, {})
}

export async function markAllAsRead(): Promise<{ count: number }> {
  return apiClient.post<{ count: number }>(`${BASE_URL}/read-all`, {})
}

export async function deleteNotification(notificationId: string): Promise<void> {
  return apiClient.delete(`${BASE_URL}/${notificationId}`)
}

export const notificationsService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
}
