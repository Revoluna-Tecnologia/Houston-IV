import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationsRepository } from "./notifications.repository";
import {
  NotificationQueryDto,
  UpdatePreferenceDto,
  NotificationResponseDto,
  NotificationPaginatedResponseDto,
  PreferenceResponseDto,
} from "./dto";
import {
  Notification,
  NotificationPreference,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  Prisma,
} from "../generated/prisma/client";

interface SendNotificationInput {
  userId: string;
  type: NotificationType | string;
  priority?: NotificationPriority | string;
  title: string;
  content: string;
  data?: Prisma.InputJsonValue;
  channels?: (NotificationChannel | string)[];
  grupoId?: string;
}

interface SendBulkInput {
  userIds: string[];
  type: NotificationType | string;
  priority?: NotificationPriority | string;
  title: string;
  content: string;
  data?: Prisma.InputJsonValue;
  grupoId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async send(dto: SendNotificationInput): Promise<NotificationResponseDto> {
    const type = dto.type as NotificationType;
    const channels = await this.resolveChannels(
      dto.userId,
      type,
      dto.channels as NotificationChannel[] | undefined,
    );
    const notification = await this.repository.create({
      userId: dto.userId,
      type,
      priority: (dto.priority as NotificationPriority) || "normal",
      title: dto.title,
      content: dto.content,
      data: dto.data,
      channels,
      grupoId: dto.grupoId,
    });
    return this.toResponseDto(notification);
  }

  async sendBulk(dto: SendBulkInput): Promise<number> {
    const type = dto.type as NotificationType;
    const notifications = await Promise.all(
      dto.userIds.map(async (userId) => {
        const channels = await this.resolveChannels(userId, type);
        return {
          userId,
          type,
          priority: (dto.priority as NotificationPriority) || "normal",
          title: dto.title,
          content: dto.content,
          data: dto.data,
          channels,
          grupoId: dto.grupoId,
        };
      }),
    );
    return this.repository.createMany(notifications);
  }

  private async resolveChannels(
    userId: string,
    type: NotificationType,
    explicitChannels?: NotificationChannel[],
  ): Promise<NotificationChannel[]> {
    if (explicitChannels && explicitChannels.length > 0) {
      return explicitChannels;
    }
    const preference = await this.repository.findPreference(userId, type);
    if (!preference) {
      return ["in_app", "email"];
    }
    const channels: NotificationChannel[] = [];
    if (preference.inApp) channels.push("in_app");
    if (preference.email) channels.push("email");
    if (preference.push) channels.push("push");
    return channels.length > 0 ? channels : ["in_app"];
  }

  async findByUser(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationPaginatedResponseDto> {
    const { data, total } = await this.repository.findByUser(userId, query);
    const limit = query.limit || 20;
    const page = query.page || 1;
    return {
      data: data.map((n) => this.toResponseDto(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markAsRead(
    userId: string,
    id: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.repository.markAsRead(userId, id);
    if (!notification) {
      throw new NotFoundException("Notificacao nao encontrada");
    }
    return this.toResponseDto(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.repository.markAllAsRead(userId);
  }

  async delete(userId: string, id: string): Promise<void> {
    const notification = await this.repository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException("Notificacao nao encontrada");
    }
    await this.repository.delete(userId, id);
  }

  async getPreferences(userId: string): Promise<PreferenceResponseDto[]> {
    const preferences = await this.repository.findPreferencesByUser(userId);
    return preferences.map((p) => this.toPreferenceDto(p));
  }

  async updatePreference(
    userId: string,
    dto: UpdatePreferenceDto,
  ): Promise<PreferenceResponseDto> {
    const preference = await this.repository.upsertPreference(
      userId,
      dto.type,
      {
        inApp: dto.inApp,
        email: dto.email,
        push: dto.push,
      },
    );
    return this.toPreferenceDto(preference);
  }

  async updatePreferences(
    userId: string,
    preferences: UpdatePreferenceDto[],
  ): Promise<PreferenceResponseDto[]> {
    const results = await Promise.all(
      preferences.map((p) => this.updatePreference(userId, p)),
    );
    return results;
  }

  private toResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      content: notification.content,
      data: notification.data as Record<string, unknown> | undefined,
      read: notification.read,
      readAt: notification.readAt || undefined,
      sentAt: notification.sentAt,
      channels: notification.channels,
      grupoId: notification.grupoId || undefined,
      createdAt: notification.createdAt,
    };
  }

  private toPreferenceDto(
    preference: NotificationPreference,
  ): PreferenceResponseDto {
    return {
      id: preference.id,
      userId: preference.userId,
      type: preference.type,
      inApp: preference.inApp,
      email: preference.email,
      push: preference.push,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }
}
