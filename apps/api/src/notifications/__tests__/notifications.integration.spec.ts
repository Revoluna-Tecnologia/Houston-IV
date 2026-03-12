import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import { NotificationsService } from "../notifications.service";
import { NotificationsRepository } from "../notifications.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { PrismaService } from "../../prisma/prisma.service";
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "../../generated/prisma/client";

describe("NotificationsModule (Integration)", () => {
  let module: TestingModule;
  let service: NotificationsService;
  let prisma: PrismaService;
  let testUserId: string;
  let testGrupoId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [NotificationsService, NotificationsRepository],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up in correct order
    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.grupo.deleteMany();
    await prisma.user.deleteMany();

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: "Grupo Notifications Teste" },
    });
    testGrupoId = grupo.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "notifications-test@example.com",
        name: "Notifications Test User",
        emailVerified: true,
      },
    });
    testUserId = user.id;
  });

  describe("Send Notifications", () => {
    describe("send", () => {
      it("should send a notification to user", async () => {
        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Bem-vindo",
          content: "Bem-vindo ao sistema!",
        });

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.userId).toBe(testUserId);
        expect(result.type).toBe(NotificationType.system);
        expect(result.title).toBe("Bem-vindo");
        expect(result.content).toBe("Bem-vindo ao sistema!");
        expect(result.read).toBe(false);
      });

      it("should send notification with priority", async () => {
        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          priority: NotificationPriority.urgent,
          title: "Urgente",
          content: "Mensagem urgente!",
        });

        expect(result.priority).toBe(NotificationPriority.urgent);
      });

      it("should send notification with data", async () => {
        const result = await service.send({
          userId: testUserId,
          type: NotificationType.ticket,
          title: "Novo Ticket",
          content: "Um novo ticket foi criado",
          data: { ticketId: "ticket-123", action: "created" },
        });

        expect(result.data).toBeDefined();
        expect(result.data?.ticketId).toBe("ticket-123");
        expect(result.data?.action).toBe("created");
      });

      it("should send notification with explicit channels", async () => {
        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Notificacao",
          content: "Conteudo",
          channels: [NotificationChannel.in_app, NotificationChannel.push],
        });

        expect(result.channels).toContain(NotificationChannel.in_app);
        expect(result.channels).toContain(NotificationChannel.push);
      });

      it("should send notification with grupoId", async () => {
        const result = await service.send({
          userId: testUserId,
          type: NotificationType.vaga,
          title: "Nova Vaga",
          content: "Uma nova vaga foi publicada",
          grupoId: testGrupoId,
        });

        expect(result.grupoId).toBe(testGrupoId);
      });

      it("should use default channels when user has no preferences", async () => {
        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Sem Preferencias",
          content: "Usando canais padrao",
        });

        expect(result.channels).toContain(NotificationChannel.in_app);
        expect(result.channels).toContain(NotificationChannel.email);
      });
    });

    describe("sendBulk", () => {
      it("should send notifications to multiple users", async () => {
        // Create another user
        const user2 = await prisma.user.create({
          data: {
            email: "user2@example.com",
            name: "User 2",
            emailVerified: true,
          },
        });

        const count = await service.sendBulk({
          userIds: [testUserId, user2.id],
          type: NotificationType.system,
          title: "Aviso Geral",
          content: "Mensagem para todos",
        });

        expect(count).toBe(2);

        const user1Notifications = await service.findByUser(testUserId, {});
        const user2Notifications = await service.findByUser(user2.id, {});

        expect(user1Notifications.total).toBe(1);
        expect(user2Notifications.total).toBe(1);
      });
    });
  });

  describe("Query Notifications", () => {
    describe("findByUser", () => {
      it("should return empty list when no notifications exist", async () => {
        const result = await service.findByUser(testUserId, {});

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      it("should return paginated notifications", async () => {
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N1",
          content: "C1",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N2",
          content: "C2",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N3",
          content: "C3",
        });

        const result = await service.findByUser(testUserId, {
          page: 1,
          limit: 2,
        });

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(3);
        expect(result.totalPages).toBe(2);
      });

      it("should filter by type", async () => {
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "System",
          content: "C",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.ticket,
          title: "Ticket",
          content: "C",
        });

        const result = await service.findByUser(testUserId, {
          type: NotificationType.ticket,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe(NotificationType.ticket);
      });

      it("should filter by read status", async () => {
        const notification = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Read",
          content: "C",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Unread",
          content: "C",
        });

        await service.markAsRead(testUserId, notification.id);

        const unreadResult = await service.findByUser(testUserId, {
          read: false,
        });
        const readResult = await service.findByUser(testUserId, { read: true });

        expect(unreadResult.data).toHaveLength(1);
        expect(readResult.data).toHaveLength(1);
      });
    });

    describe("countUnread", () => {
      it("should count unread notifications", async () => {
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N1",
          content: "C1",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N2",
          content: "C2",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N3",
          content: "C3",
        });

        const count = await service.countUnread(testUserId);

        expect(count).toBe(3);
      });

      it("should return 0 when all notifications are read", async () => {
        const n1 = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N1",
          content: "C1",
        });
        const n2 = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N2",
          content: "C2",
        });

        await service.markAsRead(testUserId, n1.id);
        await service.markAsRead(testUserId, n2.id);

        const count = await service.countUnread(testUserId);

        expect(count).toBe(0);
      });
    });
  });

  describe("Mark as Read", () => {
    describe("markAsRead", () => {
      it("should mark notification as read", async () => {
        const notification = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Para Ler",
          content: "Marcar como lido",
        });

        const result = await service.markAsRead(testUserId, notification.id);

        expect(result.read).toBe(true);
        expect(result.readAt).toBeDefined();
      });

      it("should throw NotFoundException when notification does not exist", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(
          service.markAsRead(testUserId, nonExistentId),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe("markAllAsRead", () => {
      it("should mark all notifications as read", async () => {
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N1",
          content: "C1",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N2",
          content: "C2",
        });
        await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "N3",
          content: "C3",
        });

        const count = await service.markAllAsRead(testUserId);

        expect(count).toBe(3);

        const unreadCount = await service.countUnread(testUserId);
        expect(unreadCount).toBe(0);
      });

      it("should return 0 when no unread notifications exist", async () => {
        const count = await service.markAllAsRead(testUserId);

        expect(count).toBe(0);
      });
    });
  });

  describe("Delete Notifications", () => {
    describe("delete", () => {
      it("should delete a notification", async () => {
        const notification = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Para Deletar",
          content: "Sera deletado",
        });

        await service.delete(testUserId, notification.id);

        const result = await service.findByUser(testUserId, {});
        expect(result.total).toBe(0);
      });

      it("should throw NotFoundException when notification does not exist", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(service.delete(testUserId, nonExistentId)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("should throw NotFoundException when notification belongs to another user", async () => {
        const otherUser = await prisma.user.create({
          data: {
            email: "other@example.com",
            name: "Other User",
            emailVerified: true,
          },
        });

        const notification = await service.send({
          userId: otherUser.id,
          type: NotificationType.system,
          title: "Outro Usuario",
          content: "Nao pode deletar",
        });

        await expect(
          service.delete(testUserId, notification.id),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe("Preferences", () => {
    describe("getPreferences", () => {
      it("should return empty list when no preferences exist", async () => {
        const result = await service.getPreferences(testUserId);

        expect(result).toEqual([]);
      });

      it("should return user preferences", async () => {
        await service.updatePreference(testUserId, {
          type: NotificationType.system,
          inApp: true,
          email: true,
          push: false,
        });

        const result = await service.getPreferences(testUserId);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(NotificationType.system);
        expect(result[0].inApp).toBe(true);
        expect(result[0].email).toBe(true);
        expect(result[0].push).toBe(false);
      });
    });

    describe("updatePreference", () => {
      it("should create new preference", async () => {
        const result = await service.updatePreference(testUserId, {
          type: NotificationType.vaga,
          inApp: true,
          email: false,
          push: true,
        });

        expect(result.type).toBe(NotificationType.vaga);
        expect(result.inApp).toBe(true);
        expect(result.email).toBe(false);
        expect(result.push).toBe(true);
      });

      it("should update existing preference", async () => {
        await service.updatePreference(testUserId, {
          type: NotificationType.ticket,
          inApp: true,
          email: true,
          push: false,
        });

        const result = await service.updatePreference(testUserId, {
          type: NotificationType.ticket,
          inApp: false,
          email: false,
          push: true,
        });

        expect(result.inApp).toBe(false);
        expect(result.email).toBe(false);
        expect(result.push).toBe(true);
      });
    });

    describe("updatePreferences", () => {
      it("should update multiple preferences at once", async () => {
        const result = await service.updatePreferences(testUserId, [
          {
            type: NotificationType.system,
            inApp: true,
            email: true,
            push: false,
          },
          {
            type: NotificationType.vaga,
            inApp: true,
            email: false,
            push: false,
          },
          {
            type: NotificationType.ticket,
            inApp: true,
            email: true,
            push: true,
          },
        ]);

        expect(result).toHaveLength(3);

        const preferences = await service.getPreferences(testUserId);
        expect(preferences).toHaveLength(3);
      });
    });

    describe("Preferences affecting notification channels", () => {
      it("should respect user preferences when sending notification", async () => {
        // Set preference to only receive in-app notifications
        await service.updatePreference(testUserId, {
          type: NotificationType.system,
          inApp: true,
          email: false,
          push: false,
        });

        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Com Preferencias",
          content: "Respeitando preferencias",
        });

        expect(result.channels).toEqual([NotificationChannel.in_app]);
        expect(result.channels).not.toContain(NotificationChannel.email);
      });

      it("should use at least in_app when all preferences are disabled", async () => {
        // Disable all channels
        await service.updatePreference(testUserId, {
          type: NotificationType.system,
          inApp: false,
          email: false,
          push: false,
        });

        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Sem Canais",
          content: "Deve usar in_app",
        });

        // Should fallback to in_app
        expect(result.channels).toContain(NotificationChannel.in_app);
      });

      it("should override preferences with explicit channels", async () => {
        // Set preference to only receive in-app
        await service.updatePreference(testUserId, {
          type: NotificationType.system,
          inApp: true,
          email: false,
          push: false,
        });

        const result = await service.send({
          userId: testUserId,
          type: NotificationType.system,
          title: "Override",
          content: "Canais explicitos",
          channels: [NotificationChannel.email, NotificationChannel.push],
        });

        expect(result.channels).toContain(NotificationChannel.email);
        expect(result.channels).toContain(NotificationChannel.push);
        expect(result.channels).not.toContain(NotificationChannel.in_app);
      });
    });
  });
});
