import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationsRepository } from '../notifications.repository'
import { PrismaService } from '../../prisma/prisma.service'
import {
  createNotificationFixture,
  createPreferenceFixture,
} from '../../__tests__/fixtures/notification.fixture'

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository
  let prisma: PrismaService

  const mockNotification = createNotificationFixture()

  beforeEach(() => {
    prisma = {
      notification: {
        create: vi.fn(),
        createMany: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      notificationPreference: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    } as unknown as PrismaService

    repository = new NotificationsRepository(prisma)
  })

  describe('create', () => {
    it('should create a notification', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification as never)

      const result = await repository.create({
        userId: 'user-1',
        type: 'ticket_created',
        title: 'Novo Ticket',
        content: 'Um novo ticket foi criado',
        grupoId: 'grupo-1',
      })

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'ticket_created',
          title: 'Novo Ticket',
        }),
      })
      expect(result).toEqual(mockNotification)
    })
  })

  describe('createMany', () => {
    it('should create multiple notifications', async () => {
      vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 3 })

      const result = await repository.createMany([
        { userId: 'user-1', type: 'ticket_created', title: 'Titulo 1', content: 'Conteudo 1' },
        { userId: 'user-2', type: 'ticket_created', title: 'Titulo 2', content: 'Conteudo 2' },
        { userId: 'user-3', type: 'ticket_created', title: 'Titulo 3', content: 'Conteudo 3' },
      ])

      expect(result).toBe(3)
    })
  })

  describe('findByUser', () => {
    it('should return paginated notifications', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([mockNotification] as never)
      vi.mocked(prisma.notification.count).mockResolvedValue(1)

      const result = await repository.findByUser('user-1', { page: 1, limit: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter by type', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([])
      vi.mocked(prisma.notification.count).mockResolvedValue(0)

      await repository.findByUser('user-1', {
        type: 'ticket_assigned',
        page: 1,
        limit: 20,
      })

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            type: 'ticket_assigned',
          }),
        }),
      )
    })

    it('should filter by read status', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([])
      vi.mocked(prisma.notification.count).mockResolvedValue(0)

      await repository.findByUser('user-1', { read: false, page: 1, limit: 20 })

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            read: false,
          }),
        }),
      )
    })
  })

  describe('countUnread', () => {
    it('should return unread count', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(5)

      const result = await repository.countUnread('user-1')

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      })
      expect(result).toBe(5)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = createNotificationFixture({ read: true, readAt: new Date() })
      vi.mocked(prisma.notification.update).mockResolvedValue(readNotification as never)

      const result = await repository.markAsRead('user-1', 'notification-1')

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1', userId: 'user-1' },
        data: { read: true, readAt: expect.any(Date) },
      })
      expect(result?.read).toBe(true)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 10 })

      const result = await repository.markAllAsRead('user-1')

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true, readAt: expect.any(Date) },
      })
      expect(result).toBe(10)
    })
  })

  describe('findPreferencesByUser', () => {
    it('should return user preferences', async () => {
      const mockPreferences = [createPreferenceFixture()]
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValue(mockPreferences as never)

      const result = await repository.findPreferencesByUser('user-1')

      expect(result).toEqual(mockPreferences)
    })
  })

  describe('upsertPreference', () => {
    it('should create or update preference', async () => {
      const mockPreference = createPreferenceFixture({ email: false })
      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue(mockPreference as never)

      const result = await repository.upsertPreference(
        'user-1',
        'ticket_created',
        { inApp: true, email: false },
      )

      expect(result.email).toBe(false)
    })
  })

  describe('findById', () => {
    it('should return notification by id', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(mockNotification as never)

      const result = await repository.findById('notification-1')

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
      })
      expect(result).toEqual(mockNotification)
    })

    it('should return null when notification not found', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete notification', async () => {
      vi.mocked(prisma.notification.delete).mockResolvedValue(mockNotification as never)

      await repository.delete('user-1', 'notification-1')

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notification-1', userId: 'user-1' },
      })
    })
  })

  describe('deleteOld', () => {
    it('should delete old read notifications', async () => {
      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 5 })

      const result = await repository.deleteOld(30)

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
          read: true,
        },
      })
      expect(result).toBe(5)
    })
  })

  describe('findPreference', () => {
    it('should return preference by user and type', async () => {
      const mockPreference = createPreferenceFixture()
      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(mockPreference as never)

      const result = await repository.findPreference('user-1', 'ticket_created')

      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId_type: { userId: 'user-1', type: 'ticket_created' } },
      })
      expect(result).toEqual(mockPreference)
    })

    it('should return null when preference not found', async () => {
      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(null)

      const result = await repository.findPreference('user-1', 'unknown_type' as any)

      expect(result).toBeNull()
    })
  })
})
