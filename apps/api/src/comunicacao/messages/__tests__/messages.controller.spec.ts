import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { MessageType, MessageStatus } from "@prisma/client";
import { MessagesController } from "../messages.controller";
import { MessagesService } from "../messages.service";
import { AppRole } from "../../../auth/types/auth.types";

describe("MessagesController", () => {
  let controller: MessagesController;
  let service: {
    send: Mock;
    findByConversation: Mock;
    findOne: Mock;
    markAsRead: Mock;
    delete: Mock;
  };

  const mockUser = {
    id: "user-1",
    email: "test@test.com",
    name: "Test User",
    roles: [AppRole.ADMINISTRADOR],
    grupoIds: ["grupo-1"],
    permissions: [],
    hospitalIds: [],
    setorIds: [],
  };

  const mockMessage = {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-1",
    senderPhone: "5511999999999",
    content: "Hello World",
    messageType: MessageType.text,
    replyToId: undefined,
    metadata: {},
    status: MessageStatus.sent,
    createdAt: new Date(),
    deliveredAt: undefined,
    readAt: undefined,
    isFromMe: true,
    isDeleted: false,
  };

  beforeEach(() => {
    service = {
      send: vi.fn().mockResolvedValue(mockMessage),
      findByConversation: vi.fn().mockResolvedValue({
        data: [mockMessage],
        meta: {
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }),
      findOne: vi.fn().mockResolvedValue(mockMessage),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    controller = new MessagesController(service as unknown as MessagesService);
  });

  describe("send", () => {
    it("should send a text message", async () => {
      const dto = {
        conversationId: "conv-1",
        content: "Hello World",
        messageType: MessageType.text,
      };

      const result = await controller.send(dto, mockUser);

      expect(result.id).toBe("msg-1");
      expect(service.send).toHaveBeenCalledWith(dto, mockUser);
    });

    it("should send a message with metadata", async () => {
      const dto = {
        conversationId: "conv-1",
        content: "Check this image",
        messageType: MessageType.image,
        metadata: {
          fileUrl: "https://example.com/image.jpg",
          mimeType: "image/jpeg",
        },
      };

      await controller.send(dto, mockUser);

      expect(service.send).toHaveBeenCalledWith(dto, mockUser);
    });

    it("should send a reply message", async () => {
      const dto = {
        conversationId: "conv-1",
        content: "This is a reply",
        messageType: MessageType.text,
        replyToId: "msg-original",
      };

      await controller.send(dto, mockUser);

      expect(service.send).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe("findByConversation", () => {
    it("should return messages from conversation", async () => {
      const query = { page: 1, limit: 50 };

      const result = await controller.findByConversation(
        "conv-1",
        query,
        mockUser,
      );

      expect(result.data).toHaveLength(1);
      expect(service.findByConversation).toHaveBeenCalledWith(
        "conv-1",
        query,
        mockUser,
      );
    });

    it("should filter by message type", async () => {
      const query = { messageType: MessageType.image, page: 1, limit: 50 };

      await controller.findByConversation("conv-1", query, mockUser);

      expect(service.findByConversation).toHaveBeenCalledWith(
        "conv-1",
        query,
        mockUser,
      );
    });

    it("should filter by date range", async () => {
      const query = {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        page: 1,
        limit: 50,
      };

      await controller.findByConversation("conv-1", query, mockUser);

      expect(service.findByConversation).toHaveBeenCalledWith(
        "conv-1",
        query,
        mockUser,
      );
    });

    it("should search by content", async () => {
      const query = { search: "Hello", page: 1, limit: 50 };

      await controller.findByConversation("conv-1", query, mockUser);

      expect(service.findByConversation).toHaveBeenCalledWith(
        "conv-1",
        query,
        mockUser,
      );
    });

    it("should support cursor pagination", async () => {
      const query = { cursor: "msg-last", limit: 50 };

      await controller.findByConversation("conv-1", query, mockUser);

      expect(service.findByConversation).toHaveBeenCalledWith(
        "conv-1",
        query,
        mockUser,
      );
    });
  });

  describe("findOne", () => {
    it("should return a message by id", async () => {
      const result = await controller.findOne("msg-1", mockUser);

      expect(result.id).toBe("msg-1");
      expect(service.findOne).toHaveBeenCalledWith("msg-1", mockUser);
    });
  });

  describe("markAsRead", () => {
    it("should mark messages as read", async () => {
      await controller.markAsRead("conv-1", mockUser);

      expect(service.markAsRead).toHaveBeenCalledWith("conv-1", mockUser);
    });
  });

  describe("remove", () => {
    it("should delete a message", async () => {
      await controller.remove("msg-1", mockUser);

      expect(service.delete).toHaveBeenCalledWith("msg-1", mockUser);
    });
  });
});
