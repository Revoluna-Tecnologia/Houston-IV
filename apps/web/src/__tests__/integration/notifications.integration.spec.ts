import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    unreadCount: number
  }
}

describe('Notifications Integration', () => {
  describe('Listing', () => {
    it('should list notifications', async () => {
      const response = await apiRequest<PaginatedResponse<Notification>>('/notifications')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.meta).toBeDefined()
    })

    it('should list with pagination', async () => {
      const response = await apiRequest<PaginatedResponse<Notification>>(
        '/notifications?page=1&limit=5'
      )

      expect(response.meta.page).toBe(1)
      expect(response.meta.limit).toBe(5)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })

    it('should filter by read status', async () => {
      const unread = await apiRequest<PaginatedResponse<Notification>>(
        '/notifications?isRead=false'
      )

      unread.data.forEach((notification) => {
        expect(notification.isRead).toBe(false)
      })
    })

    it('should return unread count', async () => {
      const response = await apiRequest<PaginatedResponse<Notification>>('/notifications')

      expect(response.meta.unreadCount).toBeDefined()
      expect(typeof response.meta.unreadCount).toBe('number')
    })
  })

  describe('Mark as Read', () => {
    it('should mark single notification as read', async () => {
      // Get unread notifications
      const response = await apiRequest<PaginatedResponse<Notification>>(
        '/notifications?isRead=false'
      )

      if (response.data.length > 0) {
        const notification = response.data[0]

        const marked = await apiRequest<Notification>(
          `/notifications/${notification.id}/read`,
          { method: 'PATCH' }
        )

        expect(marked.isRead).toBe(true)
      }
    })

    it('should mark all notifications as read', async () => {
      await apiRequest('/notifications/read-all', { method: 'POST' })

      // Verify all are read
      const response = await apiRequest<PaginatedResponse<Notification>>(
        '/notifications?isRead=false'
      )

      expect(response.meta.unreadCount).toBe(0)
    })
  })

  describe('Preferences', () => {
    it('should get notification preferences', async () => {
      const prefs = await apiRequest<NotificationPreferences>('/notifications/preferences')

      expect(prefs).toBeDefined()
      expect(typeof prefs.email).toBe('boolean')
      expect(typeof prefs.push).toBe('boolean')
      expect(typeof prefs.inApp).toBe('boolean')
    })

    it('should update notification preferences', async () => {
      const updated = await apiRequest<NotificationPreferences>('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          email: true,
          push: false,
        }),
      })

      expect(updated.email).toBe(true)
      expect(updated.push).toBe(false)
    })
  })
})
