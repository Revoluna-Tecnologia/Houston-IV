import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  Notification,
  NotificationPreference,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  Prisma,
} from '@prisma/client'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  priority?: NotificationPriority
  title: string
  content: string
  data?: Prisma.InputJsonValue
  channels?: NotificationChannel[]
  grupoId?: string
}

export interface NotificationQueryParams {
  type?: NotificationType
  read?: boolean
  page?: number
  limit?: number
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        priority: data.priority || 'normal',
        title: data.title,
        content: data.content,
        data: data.data,
        channels: data.channels || ['in_app'],
        grupoId: data.grupoId,
      },
    })
  }

  async createMany(notifications: CreateNotificationData[]): Promise<number> {
    const result = await this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        priority: n.priority || 'normal',
        title: n.title,
        content: n.content,
        data: n.data,
        channels: n.channels || ['in_app'],
        grupoId: n.grupoId,
      })),
    })
    return result.count
  }

  async findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } })
  }

  async findByUser(
    userId: string,
    params: NotificationQueryParams,
  ): Promise<{ data: Notification[]; total: number }> {
    const { type, read, page = 1, limit = 20 } = params
    const where = this.buildWhereClause(userId, type, read)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ])

    return { data, total }
  }

  private buildWhereClause(
    userId: string,
    type?: NotificationType,
    read?: boolean,
  ): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = { userId }
    if (type !== undefined) where.type = type
    if (read !== undefined) where.read = read
    return where
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    })
  }

  async markAsRead(userId: string, id: string): Promise<Notification | null> {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { read: true, readAt: new Date() },
    })
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
    return result.count
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id, userId } })
  }

  async deleteOld(daysOld: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoffDate }, read: true },
    })
    return result.count
  }

  async findPreferencesByUser(userId: string): Promise<NotificationPreference[]> {
    return this.prisma.notificationPreference.findMany({ where: { userId } })
  }

  async findPreference(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreference | null> {
    return this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    })
  }

  async upsertPreference(
    userId: string,
    type: NotificationType,
    data: { inApp?: boolean; email?: boolean; push?: boolean },
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      create: {
        userId,
        type,
        inApp: data.inApp ?? true,
        email: data.email ?? true,
        push: data.push ?? false,
      },
      update: {
        inApp: data.inApp,
        email: data.email,
        push: data.push,
      },
    })
  }
}
