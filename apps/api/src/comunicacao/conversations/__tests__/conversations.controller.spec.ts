import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { ConversationType, ParticipantRole } from "@prisma/client";
import { ConversationsController } from "../conversations.controller";
import { ConversationsService } from "../conversations.service";
import { AppRole } from "../../../auth/types/auth.types";

describe("ConversationsController", () => {
  let controller: ConversationsController;
  let service: {
    create: Mock;
    findAll: Mock;
    findOne: Mock;
    update: Mock;
    archive: Mock;
    remove: Mock;
    addParticipant: Mock;
    removeParticipant: Mock;
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

  const mockConversation = {
    id: "conv-1",
    type: ConversationType.direct,
    name: undefined,
    grupoId: "grupo-1",
    isArchived: false,
    lastMessageAt: new Date(),
    lastMessagePreview: "Hello",
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [],
    unreadCount: 0,
  };

  const mockParticipant = {
    id: "participant-1",
    phoneNumber: "5511999999999",
    role: ParticipantRole.member,
    name: "John Doe",
    userId: "user-2",
    medicoId: "medico-1",
    isMuted: false,
    unreadCount: 0,
    joinedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      create: vi.fn().mockResolvedValue(mockConversation),
      findAll: vi.fn().mockResolvedValue({
        data: [mockConversation],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }),
      findOne: vi.fn().mockResolvedValue(mockConversation),
      update: vi.fn().mockResolvedValue(mockConversation),
      archive: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      addParticipant: vi.fn().mockResolvedValue(mockParticipant),
      removeParticipant: vi.fn().mockResolvedValue(undefined),
    };

    controller = new ConversationsController(
      service as unknown as ConversationsService,
    );
  });

  describe("create", () => {
    it("should create a new conversation", async () => {
      const dto = {
        type: ConversationType.direct,
        grupoId: "grupo-1",
        participantPhones: ["5511999999999"],
      };

      const result = await controller.create(dto, mockUser);

      expect(result.id).toBe("conv-1");
      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    });

    it("should create a group conversation", async () => {
      const dto = {
        type: ConversationType.group,
        name: "Group Chat",
        grupoId: "grupo-1",
        participantPhones: ["5511999999999", "5511888888888"],
      };

      await controller.create(dto, mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe("findAll", () => {
    it("should return all conversations", async () => {
      const query = { page: 1, limit: 20 };

      const result = await controller.findAll(query, mockUser);

      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
    });

    it("should filter by type", async () => {
      const query = { type: ConversationType.group, page: 1, limit: 20 };

      await controller.findAll(query, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
    });

    it("should filter archived", async () => {
      const query = { isArchived: true, page: 1, limit: 20 };

      await controller.findAll(query, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
    });
  });

  describe("findOne", () => {
    it("should return a conversation by id", async () => {
      const result = await controller.findOne("conv-1", mockUser);

      expect(result.id).toBe("conv-1");
      expect(service.findOne).toHaveBeenCalledWith("conv-1", mockUser);
    });
  });

  describe("update", () => {
    it("should update a conversation", async () => {
      const dto = { name: "New Name" };

      const result = await controller.update("conv-1", dto, mockUser);

      expect(result.id).toBe("conv-1");
      expect(service.update).toHaveBeenCalledWith("conv-1", dto, mockUser);
    });
  });

  describe("archive", () => {
    it("should archive a conversation", async () => {
      await controller.archive("conv-1", true, mockUser);

      expect(service.archive).toHaveBeenCalledWith("conv-1", true, mockUser);
    });

    it("should unarchive a conversation", async () => {
      await controller.archive("conv-1", false, mockUser);

      expect(service.archive).toHaveBeenCalledWith("conv-1", false, mockUser);
    });
  });

  describe("remove", () => {
    it("should delete a conversation", async () => {
      await controller.remove("conv-1", mockUser);

      expect(service.remove).toHaveBeenCalledWith("conv-1", mockUser);
    });
  });

  describe("addParticipant", () => {
    it("should add a participant", async () => {
      const dto = {
        phoneNumber: "5511999999999",
        role: ParticipantRole.member,
      };

      const result = await controller.addParticipant("conv-1", dto, mockUser);

      expect(result.id).toBe("participant-1");
      expect(service.addParticipant).toHaveBeenCalledWith(
        "conv-1",
        dto,
        mockUser,
      );
    });
  });

  describe("removeParticipant", () => {
    it("should remove a participant", async () => {
      await controller.removeParticipant("conv-1", "participant-1", mockUser);

      expect(service.removeParticipant).toHaveBeenCalledWith(
        "conv-1",
        "participant-1",
        mockUser,
      );
    });
  });
});
