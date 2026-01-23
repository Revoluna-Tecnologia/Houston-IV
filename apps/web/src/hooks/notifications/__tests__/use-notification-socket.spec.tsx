import { describe, it, expect, vi } from 'vitest'
import * as socketHook from '../use-notification-socket'

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}))

// Mock notifications service types
vi.mock('@/services/notifications', () => ({}))

describe('use-notification-socket module', () => {
  describe('exports', () => {
    it('should export useNotificationSocket', () => {
      expect(socketHook.useNotificationSocket).toBeDefined()
      expect(typeof socketHook.useNotificationSocket).toBe('function')
    })
  })

  describe('useNotificationSocket', () => {
    it('should be a function that accepts options object', () => {
      expect(socketHook.useNotificationSocket.length).toBe(1)
    })
  })
})
