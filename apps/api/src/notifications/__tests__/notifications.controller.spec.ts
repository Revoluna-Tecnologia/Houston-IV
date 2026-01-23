import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma before imports
vi.mock('@prisma/client', () => ({
  NotificationType: {},
  NotificationChannel: {},
  NotificationPriority: {},
}))

import { NotificationsController } from '../notifications.controller'
import { NotificationsService } from '../notifications.service'

describe('NotificationsController', () => {
  let controller: NotificationsController
  let mockService: Partial<NotificationsService>

  const mockUser = { id: 'user-1', email: 'user@test.com', name: 'Test User' }

  beforeEach(() => {
    mockService = {
      findByUser: vi.fn(),
      countUnread: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      delete: vi.fn(),
      getPreferences: vi.fn(),
      updatePreference: vi.fn(),
      updatePreferences: vi.fn(),
    }
    controller = new NotificationsController(mockService as NotificationsService)
  })

  describe('findAll', () => {
    it('should return paginated notifications for user', async () => {
      const query = { page: 1, limit: 10 }
      const expectedResult = {
        data: [{ id: 'notif-1', title: 'Test' }],
        total: 1,
        page: 1,
        limit: 10,
      }
      vi.mocked(mockService.findByUser).mockResolvedValue(expectedResult as any)

      const result = await controller.findAll(mockUser as any, query as any)

      expect(mockService.findByUser).toHaveBeenCalledWith('user-1', query)
      expect(result).toEqual(expectedResult)
    })

    it('should pass query filters to service', async () => {
      const query = { page: 1, limit: 20, unreadOnly: true, type: 'ticket_created' }
      vi.mocked(mockService.findByUser).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 } as any)

      await controller.findAll(mockUser as any, query as any)

      expect(mockService.findByUser).toHaveBeenCalledWith('user-1', query)
    })
  })

  describe('countUnread', () => {
    it('should return unread count for user', async () => {
      vi.mocked(mockService.countUnread).mockResolvedValue(5)

      const result = await controller.countUnread(mockUser as any)

      expect(mockService.countUnread).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({ count: 5 })
    })

    it('should return zero when no unread notifications', async () => {
      vi.mocked(mockService.countUnread).mockResolvedValue(0)

      const result = await controller.countUnread(mockUser as any)

      expect(result).toEqual({ count: 0 })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { id: 'notif-1', read: true }
      vi.mocked(mockService.markAsRead).mockResolvedValue(notification as any)

      const result = await controller.markAsRead(mockUser as any, 'notif-1')

      expect(mockService.markAsRead).toHaveBeenCalledWith('user-1', 'notif-1')
      expect(result).toEqual(notification)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(mockService.markAllAsRead).mockResolvedValue(10)

      const result = await controller.markAllAsRead(mockUser as any)

      expect(mockService.markAllAsRead).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({ count: 10 })
    })

    it('should return zero when no notifications to mark', async () => {
      vi.mocked(mockService.markAllAsRead).mockResolvedValue(0)

      const result = await controller.markAllAsRead(mockUser as any)

      expect(result).toEqual({ count: 0 })
    })
  })

  describe('delete', () => {
    it('should delete notification', async () => {
      vi.mocked(mockService.delete).mockResolvedValue(undefined)

      await controller.delete(mockUser as any, 'notif-1')

      expect(mockService.delete).toHaveBeenCalledWith('user-1', 'notif-1')
    })
  })

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const preferences = [
        { type: 'ticket_created', inApp: true, email: true, push: false },
        { type: 'ticket_assigned', inApp: true, email: false, push: true },
      ]
      vi.mocked(mockService.getPreferences).mockResolvedValue(preferences as any)

      const result = await controller.getPreferences(mockUser as any)

      expect(mockService.getPreferences).toHaveBeenCalledWith('user-1')
      expect(result).toEqual(preferences)
    })
  })

  describe('updatePreference', () => {
    it('should update single preference', async () => {
      const dto = { type: 'ticket_created', inApp: true, email: false }
      const updated = { ...dto, push: false }
      vi.mocked(mockService.updatePreference).mockResolvedValue(updated as any)

      const result = await controller.updatePreference(mockUser as any, dto as any)

      expect(mockService.updatePreference).toHaveBeenCalledWith('user-1', dto)
      expect(result).toEqual(updated)
    })
  })

  describe('updatePreferences', () => {
    it('should update multiple preferences', async () => {
      const dto = {
        preferences: [
          { type: 'ticket_created', inApp: true, email: true },
          { type: 'ticket_assigned', inApp: false, email: true },
        ],
      }
      const updated = dto.preferences.map((p) => ({ ...p, push: false }))
      vi.mocked(mockService.updatePreferences).mockResolvedValue(updated as any)

      const result = await controller.updatePreferences(mockUser as any, dto as any)

      expect(mockService.updatePreferences).toHaveBeenCalledWith('user-1', dto.preferences)
      expect(result).toEqual(updated)
    })
  })
})
