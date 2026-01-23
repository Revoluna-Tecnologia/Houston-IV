import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notificationsService,
} from '../notifications-service'
import { apiClient } from '../../api-client'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('notifications-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNotifications', () => {
    it('should fetch notifications without params', async () => {
      const mockResponse = {
        data: [{ id: '1', title: 'Test' }],
        meta: { total: 1, page: 1, limit: 10 },
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getNotifications()

      expect(apiClient.get).toHaveBeenCalledWith('/notifications')
      expect(result).toEqual(mockResponse)
    })

    it('should fetch notifications with type filter', async () => {
      const mockResponse = { data: [], meta: { total: 0 } }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getNotifications({ type: 'info' })

      expect(apiClient.get).toHaveBeenCalledWith('/notifications?type=info')
    })

    it('should fetch notifications with read filter', async () => {
      const mockResponse = { data: [], meta: { total: 0 } }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getNotifications({ read: false })

      expect(apiClient.get).toHaveBeenCalledWith('/notifications?read=false')
    })

    it('should fetch notifications with pagination', async () => {
      const mockResponse = { data: [], meta: { total: 0, page: 2, limit: 20 } }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getNotifications({ page: 2, limit: 20 })

      expect(apiClient.get).toHaveBeenCalledWith('/notifications?page=2&limit=20')
    })

    it('should fetch notifications with all params', async () => {
      const mockResponse = { data: [], meta: { total: 0 } }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getNotifications({ type: 'warning', read: true, page: 1, limit: 10 })

      expect(apiClient.get).toHaveBeenCalledWith(
        '/notifications?type=warning&read=true&page=1&limit=10'
      )
    })
  })

  describe('getUnreadCount', () => {
    it('should fetch unread count', async () => {
      const mockResponse = { count: 5 }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getUnreadCount()

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = { id: '123', title: 'Test', read: true }
      vi.mocked(apiClient.patch).mockResolvedValue(mockNotification)

      const result = await markAsRead('123')

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/123/read', {})
      expect(result).toEqual(mockNotification)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResponse = { count: 10 }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await markAllAsRead()

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/read-all', {})
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await deleteNotification('123')

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/123')
    })
  })

  describe('notificationsService object', () => {
    it('should export all functions', () => {
      expect(notificationsService.getNotifications).toBe(getNotifications)
      expect(notificationsService.getUnreadCount).toBe(getUnreadCount)
      expect(notificationsService.markAsRead).toBe(markAsRead)
      expect(notificationsService.markAllAsRead).toBe(markAllAsRead)
      expect(notificationsService.deleteNotification).toBe(deleteNotification)
    })
  })
})
