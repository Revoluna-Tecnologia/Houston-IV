import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import {
  ConversationType,
  ParticipantRole,
} from "../../../generated/prisma/client";
import { ConversationsService } from "../conversations.service";
import { ConversationsRepository } from "../conversations.repository";
import { ParticipantsRepository } from "../participants.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { PermissionsService } from "../../../auth/services/permissions.service";
import { AppRole } from "../../../auth/types/auth.types";

describe("ConversationsService", () => {
  let service: ConversationsService;
  let conversationsRepository: {
    create: Mock;
    findById: Mock;
    findByZapsterGroupId: Mock;
    findDirectByPhone: Mock;
    findDirectByParticipantPhone: Mock;
    findAll: Mock;
    update: Mock;
    delete: Mock;
    isParticipant: Mock;
    getUserConversationIds: Mock;
  };
  let participantsRepository: {
    create: Mock;
    createMany: Mock;
    findById: Mock;
    findByConversationAndPhone: Mock;
    findByConversationAndUser: Mock;
    findByConversation: Mock;
    update: Mock;
    remove: Mock;
    resetUnreadCount: Mock;
    incrementUnreadExcept: Mock;
    getUnreadCount: Mock;
  };
  let prisma: {
    escalista: { findFirst: Mock };
    medico: { findFirst: Mock; findUnique: Mock };
  };
  let permissionsService: { hasAccessToGrupo: Mock };

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

  const mockParticipant = {
    id: "participant-1",
    conversationId: "conv-1",
    userId: "user-1",
    medicoId: null,
    phoneNumber: "5511999999999",
    role: ParticipantRole.admin,
    isMuted: false,
    unreadCount: 0,
    lastReadAt: null,
    joinedAt: new Date(),
    leftAt: null,
    medico: null,
  };

  const mockConversation = {
    id: "conv-1",
    type: ConversationType.direct,
    name: null,
    grupoId: "grupo-1",
    createdById: "user-1",
    isArchived: false,
    lastMessageAt: new Date(),
    lastMessagePreview: "Hello",
    zapsterGroupId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [mockParticipant],
  };

  beforeEach(() => {
    conversationsRepository = {
      create: vi.fn().mockResolvedValue(mockConversation),
      findById: vi.fn().mockResolvedValue(mockConversation),
      findByZapsterGroupId: vi.fn(),
      findDirectByPhone: vi.fn(),
      findDirectByParticipantPhone: vi.fn(),
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
      update: vi.fn().mockResolvedValue(mockConversation),
      delete: vi.fn(),
      isParticipant: vi.fn().mockResolvedValue(true),
      getUserConversationIds: vi.fn().mockResolvedValue(["conv-1"]),
    };

    participantsRepository = {
      create: vi.fn().mockResolvedValue(mockParticipant),
      createMany: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockParticipant),
      findByConversationAndPhone: vi.fn(),
      findByConversationAndUser: vi.fn().mockResolvedValue(mockParticipant),
      findByConversation: vi.fn().mockResolvedValue([mockParticipant]),
      update: vi.fn(),
      remove: vi.fn(),
      resetUnreadCount: vi.fn(),
      incrementUnreadExcept: vi.fn(),
      getUnreadCount: vi.fn().mockResolvedValue(0),
    };

    prisma = {
      escalista: {
        findFirst: vi.fn().mockResolvedValue({
          id: "escalista-1",
          medico: { telefone: "5511999999999" },
        }),
      },
      medico: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    permissionsService = {
      hasAccessToGrupo: vi.fn().mockReturnValue(true),
    };

    service = new ConversationsService(
      conversationsRepository as unknown as ConversationsRepository,
      participantsRepository as unknown as ParticipantsRepository,
      prisma as unknown as PrismaService,
      permissionsService as unknown as PermissionsService,
    );
  });

  describe("create", () => {
    it("should create a direct conversation", async () => {
      const dto = {
        type: ConversationType.direct,
        grupoId: "grupo-1",
        participantPhones: ["5511888888888"],
      };

      conversationsRepository.findDirectByPhone.mockResolvedValue(null);

      const result = await service.create(dto, mockUser);

      expect(result.id).toBe("conv-1");
      expect(conversationsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConversationType.direct,
          grupoId: "grupo-1",
          createdById: "user-1",
        }),
      );
    });

    it("should throw ForbiddenException when no access to grupo", async () => {
      permissionsService.hasAccessToGrupo.mockReturnValue(false);

      const dto = {
        type: ConversationType.direct,
        grupoId: "grupo-1",
        participantPhones: ["5511888888888"],
      };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        "Sem acesso ao grupo especificado",
      );
    });

    it("should throw BadRequestException when group has no name", async () => {
      const dto = {
        type: ConversationType.group,
        grupoId: "grupo-1",
        participantPhones: ["5511888888888"],
      };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        "Nome é obrigatório para grupos",
      );
    });

    it("should throw BadRequestException when direct has wrong participant count", async () => {
      const dto = {
        type: ConversationType.direct,
        grupoId: "grupo-1",
        participantPhones: ["5511888888888", "5511777777777"],
      };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        "Conversas diretas devem ter exatamente 1 destinatário",
      );
    });

    it("should return existing direct conversation if found", async () => {
      conversationsRepository.findDirectByPhone.mockResolvedValue(
        mockConversation,
      );

      const dto = {
        type: ConversationType.direct,
        grupoId: "grupo-1",
        participantPhones: ["5511888888888"],
      };

      const result = await service.create(dto, mockUser);

      expect(result.id).toBe("conv-1");
      expect(conversationsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all conversations for user", async () => {
      const query = { page: 1, limit: 20 };

      const result = await service.findAll(query, mockUser);

      expect(result.data).toHaveLength(1);
      expect(conversationsRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          grupoIds: mockUser.grupoIds,
          userId: mockUser.id,
          page: 1,
          limit: 20,
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a conversation by id", async () => {
      const result = await service.findOne("conv-1", mockUser);

      expect(result.id).toBe("conv-1");
    });

    it("should throw NotFoundException when not found", async () => {
      conversationsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne("non-existent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne("non-existent", mockUser)).rejects.toThrow(
        "Conversa não encontrada",
      );
    });

    it("should throw ForbiddenException when not participant", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        participants: [],
      });

      await expect(service.findOne("conv-1", mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne("conv-1", mockUser)).rejects.toThrow(
        "Sem acesso a esta conversa",
      );
    });
  });

  describe("update", () => {
    it("should update a conversation", async () => {
      const dto = { name: "New Name" };

      const result = await service.update("conv-1", dto, mockUser);

      expect(result.id).toBe("conv-1");
      expect(conversationsRepository.update).toHaveBeenCalledWith(
        "conv-1",
        dto,
      );
    });

    it("should throw ForbiddenException when not admin", async () => {
      participantsRepository.findByConversationAndUser.mockResolvedValue({
        ...mockParticipant,
        role: ParticipantRole.member,
      });

      const dto = { name: "New Name" };

      await expect(service.update("conv-1", dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update("conv-1", dto, mockUser)).rejects.toThrow(
        "Apenas administradores podem editar a conversa",
      );
    });
  });

  describe("archive", () => {
    it("should archive a conversation", async () => {
      await service.archive("conv-1", true, mockUser);

      expect(conversationsRepository.update).toHaveBeenCalledWith("conv-1", {
        isArchived: true,
      });
    });

    it("should unarchive a conversation", async () => {
      await service.archive("conv-1", false, mockUser);

      expect(conversationsRepository.update).toHaveBeenCalledWith("conv-1", {
        isArchived: false,
      });
    });
  });

  describe("remove", () => {
    it("should delete a conversation when creator", async () => {
      await service.remove("conv-1", mockUser);

      expect(conversationsRepository.delete).toHaveBeenCalledWith("conv-1");
    });

    it("should delete a conversation when admin", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        createdById: "other-user",
      });

      await service.remove("conv-1", mockUser);

      expect(conversationsRepository.delete).toHaveBeenCalledWith("conv-1");
    });

    it("should throw ForbiddenException when not creator or admin", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        createdById: "other-user",
      });
      participantsRepository.findByConversationAndUser.mockResolvedValue({
        ...mockParticipant,
        role: ParticipantRole.member,
      });

      await expect(service.remove("conv-1", mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove("conv-1", mockUser)).rejects.toThrow(
        "Sem permissão para deletar esta conversa",
      );
    });
  });

  describe("addParticipant", () => {
    it("should add participant to group", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findByConversationAndPhone.mockResolvedValue(null);

      const dto = {
        phoneNumber: "5511888888888",
        role: ParticipantRole.member,
      };

      const result = await service.addParticipant("conv-1", dto, mockUser);

      expect(result.id).toBe("participant-1");
      expect(participantsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: "conv-1",
          phoneNumber: "5511888888888",
          role: ParticipantRole.member,
        }),
      );
    });

    it("should throw BadRequestException when adding to direct conversation", async () => {
      const dto = {
        phoneNumber: "5511888888888",
        role: ParticipantRole.member,
      };

      await expect(
        service.addParticipant("conv-1", dto, mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addParticipant("conv-1", dto, mockUser),
      ).rejects.toThrow(
        "Não é possível adicionar participantes a conversas diretas",
      );
    });

    it("should throw ForbiddenException when not admin", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findByConversationAndUser.mockResolvedValue({
        ...mockParticipant,
        role: ParticipantRole.member,
      });

      const dto = {
        phoneNumber: "5511888888888",
        role: ParticipantRole.member,
      };

      await expect(
        service.addParticipant("conv-1", dto, mockUser),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.addParticipant("conv-1", dto, mockUser),
      ).rejects.toThrow("Apenas administradores podem adicionar participantes");
    });

    it("should throw BadRequestException when participant already exists", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findByConversationAndPhone.mockResolvedValue(
        mockParticipant,
      );

      const dto = {
        phoneNumber: "5511888888888",
        role: ParticipantRole.member,
      };

      await expect(
        service.addParticipant("conv-1", dto, mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addParticipant("conv-1", dto, mockUser),
      ).rejects.toThrow("Participante já existe na conversa");
    });
  });

  describe("removeParticipant", () => {
    it("should remove participant as admin", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findById.mockResolvedValue({
        ...mockParticipant,
        userId: "user-2",
      });

      await service.removeParticipant("conv-1", "participant-1", mockUser);

      expect(participantsRepository.remove).toHaveBeenCalledWith(
        "participant-1",
      );
    });

    it("should allow self-removal", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findByConversationAndUser.mockResolvedValue({
        ...mockParticipant,
        role: ParticipantRole.member,
      });

      await service.removeParticipant("conv-1", "participant-1", mockUser);

      expect(participantsRepository.remove).toHaveBeenCalledWith(
        "participant-1",
      );
    });

    it("should throw BadRequestException for direct conversation", async () => {
      await expect(
        service.removeParticipant("conv-1", "participant-1", mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.removeParticipant("conv-1", "participant-1", mockUser),
      ).rejects.toThrow(
        "Não é possível remover participantes de conversas diretas",
      );
    });

    it("should throw NotFoundException when participant not found", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findById.mockResolvedValue(null);

      await expect(
        service.removeParticipant("conv-1", "non-existent", mockUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeParticipant("conv-1", "non-existent", mockUser),
      ).rejects.toThrow("Participante não encontrado");
    });

    it("should throw ForbiddenException when not admin or self", async () => {
      conversationsRepository.findById.mockResolvedValue({
        ...mockConversation,
        type: ConversationType.group,
      });
      participantsRepository.findByConversationAndUser.mockResolvedValue({
        ...mockParticipant,
        role: ParticipantRole.member,
      });
      participantsRepository.findById.mockResolvedValue({
        ...mockParticipant,
        userId: "user-2",
      });

      await expect(
        service.removeParticipant("conv-1", "participant-1", mockUser),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.removeParticipant("conv-1", "participant-1", mockUser),
      ).rejects.toThrow("Sem permissão para remover este participante");
    });
  });

  describe("isParticipant", () => {
    it("should return true when user is participant", async () => {
      const result = await service.isParticipant("conv-1", "user-1");

      expect(result).toBe(true);
      expect(conversationsRepository.isParticipant).toHaveBeenCalledWith(
        "conv-1",
        "user-1",
      );
    });

    it("should return false when user is not participant", async () => {
      conversationsRepository.isParticipant.mockResolvedValue(false);

      const result = await service.isParticipant("conv-1", "user-2");

      expect(result).toBe(false);
    });
  });

  describe("getUserConversationIds", () => {
    it("should return conversation ids for user", async () => {
      const result = await service.getUserConversationIds("user-1");

      expect(result).toEqual(["conv-1"]);
      expect(
        conversationsRepository.getUserConversationIds,
      ).toHaveBeenCalledWith("user-1");
    });
  });
});
