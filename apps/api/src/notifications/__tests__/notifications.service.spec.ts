import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { NotificationsService } from '../notifications.service'
import { NotificationsRepository } from '../notifications.repository'
import {
  createNotificationFixture,
  createPreferenceFixture,
} from '../../__tests__/fixtures/notification.fixture'

describe('NotificationsService', () => {
  let service: NotificationsService
  let repository: NotificationsRepository

  const mockNotification = createNotificationFixture()
  const mockPreference = createPreferenceFixture()

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn(),
      findByUser: vi.fn(),
      countUnread: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      delete: vi.fn(),
      findPreferencesByUser: vi.fn(),
      findPreference: vi.fn(),
      upsertPreference: vi.fn(),
    } as unknown as NotificationsRepository

    service = new NotificationsService(repository)
  })

  describe('send', () => {
    it('should create and return notification', async () => {
      vi.mocked(repository.findPreference).mockResolvedValue(mockPreference)
      vi.mocked(repository.create).mockResolvedValue(mockNotification)

      const result = await service.send({
        userId: 'user-1',
        type: 'ticket_created',
        title: 'Novo Ticket',
        content: 'Um novo ticket foi criado',
        grupoId: 'grupo-1',
      })

      expect(result.id).toBe('notification-1')
      expect(result.type).toBe('ticket_created')
    })

    it('should use default channels when no preference exists', async () => {
      vi.mocked(repository.findPreference).mockResolvedValue(null)
      vi.mocked(repository.create).mockResolvedValue(mockNotification)

      await service.send({
        userId: 'user-1',
        type: 'ticket_created',
        title: 'Novo Ticket',
        content: 'Um novo ticket foi criado',
      })

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: ['in_app', 'email'],
        }),
      )
    })

    it('should use explicit channels when provided', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockNotification)

      await service.send({
        userId: 'user-1',
        type: 'ticket_created',
        title: 'Novo Ticket',
        content: 'Um novo ticket foi criado',
        channels: ['in_app'],
      })

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: ['in_app'],
        }),
      )
    })
  })

  describe('sendBulk', () => {
    it('should create notifications for multiple users', async () => {
      vi.mocked(repository.findPreference).mockResolvedValue(mockPreference)
      vi.mocked(repository.createMany).mockResolvedValue(3)

      const result = await service.sendBulk({
        userIds: ['user-1', 'user-2', 'user-3'],
        type: 'comunicado_published',
        title: 'Novo Comunicado',
        content: 'Um novo comunicado foi publicado',
      })

      expect(result).toBe(3)
    })
  })

  describe('findByUser', () => {
    it('should return paginated notifications', async () => {
      vi.mocked(repository.findByUser).mockResolvedValue({
        data: [mockNotification],
        total: 1,
      })

      const result = await service.findByUser('user-1', { page: 1, limit: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('countUnread', () => {
    it('should return unread count', async () => {
      vi.mocked(repository.countUnread).mockResolvedValue(5)

      const result = await service.countUnread('user-1')

      expect(result).toBe(5)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = { ...mockNotification, read: true, readAt: new Date() }
      vi.mocked(repository.markAsRead).mockResolvedValue(readNotification)

      const result = await service.markAsRead('user-1', 'notification-1')

      expect(result.read).toBe(true)
    })

    it('should throw NotFoundException when notification not found', async () => {
      vi.mocked(repository.markAsRead).mockResolvedValue(null)

      await expect(service.markAsRead('user-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('markAllAsRead', () => {
    it('should return count of updated notifications', async () => {
      vi.mocked(repository.markAllAsRead).mockResolvedValue(10)

      const result = await service.markAllAsRead('user-1')

      expect(result).toBe(10)
    })
  })

  describe('delete', () => {
    it('should delete notification', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockNotification)
      vi.mocked(repository.delete).mockResolvedValue()

      await service.delete('user-1', 'notification-1')

      expect(repository.delete).toHaveBeenCalledWith('user-1', 'notification-1')
    })

    it('should throw NotFoundException when notification not found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null)

      await expect(service.delete('user-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw NotFoundException when notification belongs to another user', async () => {
      vi.mocked(repository.findById).mockResolvedValue({
        ...mockNotification,
        userId: 'user-2',
      })

      await expect(service.delete('user-1', 'notification-1')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      vi.mocked(repository.findPreferencesByUser).mockResolvedValue([mockPreference])

      const result = await service.getPreferences('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('ticket_created')
    })
  })

  describe('updatePreference', () => {
    it('should update and return preference', async () => {
      const updatedPreference = { ...mockPreference, email: false }
      vi.mocked(repository.upsertPreference).mockResolvedValue(updatedPreference)

      const result = await service.updatePreference('user-1', {
        type: 'ticket_created',
        email: false,
      })

      expect(result.email).toBe(false)
    })
  })

  describe('updatePreferences', () => {
    it('should update multiple preferences', async () => {
      vi.mocked(repository.upsertPreference)
        .mockResolvedValueOnce(mockPreference)
        .mockResolvedValueOnce({ ...mockPreference, type: 'vaga_created' as const })

      const result = await service.updatePreferences('user-1', [
        { type: 'ticket_created', email: true },
        { type: 'vaga_created', email: false },
      ])

      expect(result).toHaveLength(2)
    })
  })
})
