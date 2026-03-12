import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { MessageType, MessageStatus } from "../../../generated/prisma/client";
import { Server, Socket } from "socket.io";
import { MessagesGateway } from "../messages.gateway";

describe("MessagesGateway", () => {
  let gateway: MessagesGateway;
  let mockServer: {
    to: Mock;
    emit: Mock;
  };
  let mockClient: {
    id: string;
    handshake: { auth: { userId?: string }; query: { userId?: string } };
    data: { userId?: string };
    disconnect: Mock;
    join: Mock;
    leave: Mock;
    to: Mock;
  };

  beforeEach(() => {
    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockClient = {
      id: "socket-1",
      handshake: { auth: { userId: "user-1" }, query: {} },
      data: {},
      disconnect: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      to: vi.fn().mockReturnThis(),
    };

    gateway = new MessagesGateway();
    (gateway as unknown as { server: typeof mockServer }).server = mockServer;
  });

  describe("afterInit", () => {
    it("should initialize without errors", () => {
      expect(() => gateway.afterInit()).not.toThrow();
    });
  });

  describe("handleConnection", () => {
    it("should accept connection with userId in auth", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);

      expect(mockClient.data.userId).toBe("user-1");
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it("should accept connection with userId in query", async () => {
      mockClient.handshake.auth = {};
      mockClient.handshake.query = { userId: "user-2" };

      await gateway.handleConnection(mockClient as unknown as Socket);

      expect(mockClient.data.userId).toBe("user-2");
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it("should disconnect client without userId", async () => {
      mockClient.handshake.auth = {};
      mockClient.handshake.query = {};

      await gateway.handleConnection(mockClient as unknown as Socket);

      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it("should track multiple connections for same user", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);

      const mockClient2 = {
        ...mockClient,
        id: "socket-2",
        data: {},
      };

      await gateway.handleConnection(mockClient2 as unknown as Socket);

      expect(gateway.isUserOnline("user-1")).toBe(true);
    });
  });

  describe("handleDisconnect", () => {
    it("should clean up on disconnect", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);
      gateway.handleDisconnect(mockClient as unknown as Socket);

      expect(gateway.isUserOnline("user-1")).toBe(false);
    });

    it("should keep user online with multiple connections", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);

      const mockClient2 = {
        ...mockClient,
        id: "socket-2",
        data: {},
      };
      await gateway.handleConnection(mockClient2 as unknown as Socket);

      gateway.handleDisconnect(mockClient as unknown as Socket);

      expect(gateway.isUserOnline("user-1")).toBe(true);
    });
  });

  describe("handleJoinConversation", () => {
    it("should join conversation room", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);
      gateway.handleJoinConversation(mockClient as unknown as Socket, "conv-1");

      expect(mockClient.join).toHaveBeenCalledWith("conversation:conv-1");
    });

    it("should not join if no userId", () => {
      mockClient.data.userId = undefined;
      gateway.handleJoinConversation(mockClient as unknown as Socket, "conv-1");

      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe("handleLeaveConversation", () => {
    it("should leave conversation room", () => {
      gateway.handleLeaveConversation(
        mockClient as unknown as Socket,
        "conv-1",
      );

      expect(mockClient.leave).toHaveBeenCalledWith("conversation:conv-1");
    });
  });

  describe("handleTypingStart", () => {
    it("should emit typing start event", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);
      mockClient.to.mockReturnValue({ emit: vi.fn() });

      gateway.handleTypingStart(mockClient as unknown as Socket, {
        conversationId: "conv-1",
        userName: "John",
      });

      expect(mockClient.to).toHaveBeenCalledWith("conversation:conv-1");
    });

    it("should not emit if no userId", () => {
      mockClient.data.userId = undefined;
      gateway.handleTypingStart(mockClient as unknown as Socket, {
        conversationId: "conv-1",
      });

      expect(mockClient.to).not.toHaveBeenCalled();
    });
  });

  describe("handleTypingStop", () => {
    it("should emit typing stop event", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);
      mockClient.to.mockReturnValue({ emit: vi.fn() });

      gateway.handleTypingStop(mockClient as unknown as Socket, "conv-1");

      expect(mockClient.to).toHaveBeenCalledWith("conversation:conv-1");
    });
  });

  describe("handleMessagesRead", () => {
    it("should emit messages read event", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);
      mockClient.to.mockReturnValue({ emit: vi.fn() });

      gateway.handleMessagesRead(mockClient as unknown as Socket, "conv-1");

      expect(mockClient.to).toHaveBeenCalledWith("conversation:conv-1");
    });
  });

  describe("emitNewMessage", () => {
    it("should emit new message to conversation", () => {
      const message = {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-1",
        senderPhone: "5511999999999",
        content: "Hello",
        messageType: MessageType.text,
        metadata: {},
        status: MessageStatus.sent,
        replyToId: null,
        whatsappMessageId: null,
        createdAt: new Date(),
        deliveredAt: null,
        readAt: null,
        deletedAt: null,
      };

      gateway.emitNewMessage("conv-1", message);

      expect(mockServer.to).toHaveBeenCalledWith("conversation:conv-1");
      expect(mockServer.emit).toHaveBeenCalledWith(
        "message:new",
        expect.objectContaining({
          conversationId: "conv-1",
          message: expect.objectContaining({
            id: "msg-1",
            content: "Hello",
          }),
        }),
      );
    });
  });

  describe("emitMessageStatusUpdate", () => {
    it("should emit message status update", () => {
      gateway.emitMessageStatusUpdate(
        "conv-1",
        "msg-1",
        MessageStatus.delivered,
      );

      expect(mockServer.to).toHaveBeenCalledWith("conversation:conv-1");
      expect(mockServer.emit).toHaveBeenCalledWith(
        "message:status",
        expect.objectContaining({
          conversationId: "conv-1",
          messageId: "msg-1",
          status: MessageStatus.delivered,
        }),
      );
    });
  });

  describe("emitMessageDeleted", () => {
    it("should emit message deleted event", () => {
      gateway.emitMessageDeleted("conv-1", "msg-1");

      expect(mockServer.to).toHaveBeenCalledWith("conversation:conv-1");
      expect(mockServer.emit).toHaveBeenCalledWith(
        "message:deleted",
        expect.objectContaining({
          conversationId: "conv-1",
          messageId: "msg-1",
        }),
      );
    });
  });

  describe("emitConversationUpdate", () => {
    it("should emit conversation update", () => {
      gateway.emitConversationUpdate("conv-1", {
        lastMessagePreview: "New message",
      });

      expect(mockServer.to).toHaveBeenCalledWith("conversation:conv-1");
      expect(mockServer.emit).toHaveBeenCalledWith(
        "conversation:update",
        expect.objectContaining({
          conversationId: "conv-1",
          lastMessagePreview: "New message",
        }),
      );
    });
  });

  describe("emitToUser", () => {
    it("should emit event to specific user", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);

      gateway.emitToUser("user-1", "custom:event", { data: "test" });

      expect(mockServer.to).toHaveBeenCalledWith("socket-1");
      expect(mockServer.emit).toHaveBeenCalledWith("custom:event", {
        data: "test",
      });
    });

    it("should not emit if user offline", () => {
      gateway.emitToUser("offline-user", "custom:event", { data: "test" });

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe("isUserOnline", () => {
    it("should return true for online user", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);

      expect(gateway.isUserOnline("user-1")).toBe(true);
    });

    it("should return false for offline user", () => {
      expect(gateway.isUserOnline("offline-user")).toBe(false);
    });
  });

  describe("getOnlineUsers", () => {
    it("should return list of online user ids", async () => {
      await gateway.handleConnection(mockClient as unknown as Socket);

      const mockClient2 = {
        ...mockClient,
        id: "socket-2",
        handshake: { auth: { userId: "user-2" }, query: {} },
        data: {},
      };
      await gateway.handleConnection(mockClient2 as unknown as Socket);

      const onlineUsers = gateway.getOnlineUsers();

      expect(onlineUsers).toContain("user-1");
      expect(onlineUsers).toContain("user-2");
    });
  });
});
