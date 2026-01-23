import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationsGateway } from '../notifications.gateway'
import { Server } from 'socket.io'

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway
  let mockServer: Partial<Server>

  beforeEach(() => {
    mockServer = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    }
    gateway = new NotificationsGateway()
    ;(gateway as any).server = mockServer
  })

  describe('afterInit', () => {
    it('should log initialization', () => {
      expect(() => gateway.afterInit()).not.toThrow()
    })
  })

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const mockClient = { id: 'socket-123' }
      expect(() => gateway.handleConnection(mockClient as any)).not.toThrow()
    })
  })

  describe('handleDisconnect', () => {
    it('should remove user socket on disconnect', () => {
      const mockClient = { id: 'socket-123', userId: 'user-1' }
      ;(gateway as any).userSockets.set('user-1', new Set(['socket-123']))

      gateway.handleDisconnect(mockClient as any)

      expect((gateway as any).userSockets.has('user-1')).toBe(false)
    })
  })

  describe('handleSubscribe', () => {
    it('should subscribe user to notifications', () => {
      const mockClient = {
        id: 'socket-123',
        join: vi.fn(),
      }

      const result = gateway.handleSubscribe(mockClient as any, { userId: 'user-1' })

      expect(mockClient.join).toHaveBeenCalledWith('user:user-1')
      expect(result).toEqual({ status: 'subscribed' })
    })

    it('should return undefined if no userId provided', () => {
      const mockClient = { id: 'socket-123', join: vi.fn() }

      const result = gateway.handleSubscribe(mockClient as any, {} as any)

      expect(result).toBeUndefined()
      expect(mockClient.join).not.toHaveBeenCalled()
    })
  })

  describe('handleUnsubscribe', () => {
    it('should unsubscribe user from notifications', () => {
      const mockClient = {
        id: 'socket-123',
        userId: 'user-1',
        leave: vi.fn(),
      }
      ;(gateway as any).userSockets.set('user-1', new Set(['socket-123']))

      const result = gateway.handleUnsubscribe(mockClient as any)

      expect(mockClient.leave).toHaveBeenCalledWith('user:user-1')
      expect(result).toEqual({ status: 'unsubscribed' })
    })
  })

  describe('emitNotification', () => {
    it('should emit notification to user room', () => {
      const notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'ticket_created',
        title: 'Test',
        content: 'Test content',
      }

      gateway.emitNotification('user-1', notification as any)

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1')
    })
  })

  describe('emitUnreadCount', () => {
    it('should emit unread count to user room', () => {
      gateway.emitUnreadCount('user-1', 5)

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1')
    })
  })

  describe('isUserOnline', () => {
    it('should return true if user has active sockets', () => {
      ;(gateway as any).userSockets.set('user-1', new Set(['socket-123']))

      expect(gateway.isUserOnline('user-1')).toBe(true)
    })

    it('should return false if user has no sockets', () => {
      expect(gateway.isUserOnline('user-1')).toBe(false)
    })
  })

  describe('getOnlineUsers', () => {
    it('should return list of online user IDs', () => {
      ;(gateway as any).userSockets.set('user-1', new Set(['socket-1']))
      ;(gateway as any).userSockets.set('user-2', new Set(['socket-2']))

      const onlineUsers = gateway.getOnlineUsers()

      expect(onlineUsers).toContain('user-1')
      expect(onlineUsers).toContain('user-2')
    })
  })
})
