import { describe, it, expect, vi } from 'vitest'
import * as notificationHooks from '../use-notifications'

// Mock the notifications service
vi.mock('@/services/notifications', () => ({
  notificationsService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}))

describe('use-notifications module', () => {
  describe('exports', () => {
    it('should export useNotifications', () => {
      expect(notificationHooks.useNotifications).toBeDefined()
      expect(typeof notificationHooks.useNotifications).toBe('function')
    })

    it('should export useUnreadCount', () => {
      expect(notificationHooks.useUnreadCount).toBeDefined()
      expect(typeof notificationHooks.useUnreadCount).toBe('function')
    })

    it('should export useMarkAsRead', () => {
      expect(notificationHooks.useMarkAsRead).toBeDefined()
      expect(typeof notificationHooks.useMarkAsRead).toBe('function')
    })

    it('should export useMarkAllAsRead', () => {
      expect(notificationHooks.useMarkAllAsRead).toBeDefined()
      expect(typeof notificationHooks.useMarkAllAsRead).toBe('function')
    })

    it('should export useDeleteNotification', () => {
      expect(notificationHooks.useDeleteNotification).toBeDefined()
      expect(typeof notificationHooks.useDeleteNotification).toBe('function')
    })
  })

  describe('useNotifications', () => {
    it('should be a function that accepts optional params', () => {
      expect(notificationHooks.useNotifications.length).toBeLessThanOrEqual(1)
    })
  })

  describe('useUnreadCount', () => {
    it('should be a function with no required params', () => {
      expect(notificationHooks.useUnreadCount.length).toBe(0)
    })
  })

  describe('useMarkAsRead', () => {
    it('should be a function with no required params', () => {
      expect(notificationHooks.useMarkAsRead.length).toBe(0)
    })
  })

  describe('useMarkAllAsRead', () => {
    it('should be a function with no required params', () => {
      expect(notificationHooks.useMarkAllAsRead.length).toBe(0)
    })
  })

  describe('useDeleteNotification', () => {
    it('should be a function with no required params', () => {
      expect(notificationHooks.useDeleteNotification.length).toBe(0)
    })
  })
})
