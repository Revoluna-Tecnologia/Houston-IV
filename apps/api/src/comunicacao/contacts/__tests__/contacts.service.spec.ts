import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { ContactsService } from "../contacts.service";
import { ContactsRepository } from "../contacts.repository";
import { AppRole } from "../../../auth/types/auth.types";

describe("ContactsService", () => {
  let service: ContactsService;
  let repository: {
    create: Mock;
    findById: Mock;
    findByOwnerAndPhone: Mock;
    findAll: Mock;
    update: Mock;
    delete: Mock;
    toggleFavorite: Mock;
    toggleBlock: Mock;
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

  const mockContact = {
    id: "contact-1",
    ownerId: "user-1",
    name: "John Doe",
    phoneNumber: "5511999999999",
    email: "john@example.com",
    avatarUrl: null,
    linkedUserId: null,
    linkedMedicoId: null,
    linkedMedico: null,
    isFavorite: false,
    isBlocked: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      create: vi.fn().mockResolvedValue(mockContact),
      findById: vi.fn().mockResolvedValue(mockContact),
      findByOwnerAndPhone: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue({ data: [mockContact], total: 1 }),
      update: vi.fn().mockResolvedValue(mockContact),
      delete: vi.fn().mockResolvedValue(undefined),
      toggleFavorite: vi
        .fn()
        .mockResolvedValue({ ...mockContact, isFavorite: true }),
      toggleBlock: vi
        .fn()
        .mockResolvedValue({ ...mockContact, isBlocked: true }),
    };

    service = new ContactsService(repository as unknown as ContactsRepository);
  });

  describe("create", () => {
    it("should create a new contact", async () => {
      const dto = {
        name: "John Doe",
        phoneNumber: "5511999999999",
        email: "john@example.com",
      };

      const result = await service.create(dto, mockUser);

      expect(result.id).toBe("contact-1");
      expect(repository.findByOwnerAndPhone).toHaveBeenCalledWith(
        mockUser.id,
        dto.phoneNumber,
      );
      expect(repository.create).toHaveBeenCalled();
    });

    it("should throw ConflictException when contact already exists", async () => {
      repository.findByOwnerAndPhone.mockResolvedValue(mockContact);

      const dto = {
        name: "John Doe",
        phoneNumber: "5511999999999",
      };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        "Contato com esse telefone já existe",
      );
    });

    it("should create contact with optional fields", async () => {
      const dto = {
        name: "John Doe",
        phoneNumber: "5511999999999",
        email: "john@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
        linkedMedicoId: "medico-1",
        isFavorite: true,
        notes: "Some notes",
      };

      await service.create(dto, mockUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUser.id,
          name: dto.name,
          phoneNumber: dto.phoneNumber,
          email: dto.email,
          avatarUrl: dto.avatarUrl,
          linkedMedicoId: dto.linkedMedicoId,
          isFavorite: dto.isFavorite,
          notes: dto.notes,
        }),
      );
    });
  });

  describe("findAll", () => {
    it("should return all contacts for user", async () => {
      const query = { page: 1, limit: 50 };

      const result = await service.findAll(query, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repository.findAll).toHaveBeenCalledWith(mockUser.id, query);
    });
  });

  describe("findOne", () => {
    it("should return a contact by id", async () => {
      const result = await service.findOne("contact-1", mockUser);

      expect(result.id).toBe("contact-1");
      expect(repository.findById).toHaveBeenCalledWith("contact-1");
    });

    it("should throw NotFoundException when contact not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne("non-existent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne("non-existent", mockUser)).rejects.toThrow(
        "Contato não encontrado",
      );
    });

    it("should throw ForbiddenException when user has no access", async () => {
      const contactFromOtherUser = { ...mockContact, ownerId: "other-user" };
      repository.findById.mockResolvedValue(contactFromOtherUser);

      await expect(service.findOne("contact-1", mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne("contact-1", mockUser)).rejects.toThrow(
        "Sem acesso ao contato",
      );
    });
  });

  describe("update", () => {
    it("should update a contact", async () => {
      const dto = { name: "Jane Doe" };

      const result = await service.update("contact-1", dto, mockUser);

      expect(result.id).toBe("contact-1");
      expect(repository.update).toHaveBeenCalledWith(
        "contact-1",
        expect.any(Object),
      );
    });

    it("should throw NotFoundException when contact not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("non-existent", { name: "Jane" }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when user has no access", async () => {
      const contactFromOtherUser = { ...mockContact, ownerId: "other-user" };
      repository.findById.mockResolvedValue(contactFromOtherUser);

      await expect(
        service.update("contact-1", { name: "Jane" }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("delete", () => {
    it("should delete a contact", async () => {
      await service.delete("contact-1", mockUser);

      expect(repository.delete).toHaveBeenCalledWith("contact-1");
    });

    it("should throw NotFoundException when contact not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete("non-existent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException when user has no access", async () => {
      const contactFromOtherUser = { ...mockContact, ownerId: "other-user" };
      repository.findById.mockResolvedValue(contactFromOtherUser);

      await expect(service.delete("contact-1", mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("toggleFavorite", () => {
    it("should toggle favorite status", async () => {
      const result = await service.toggleFavorite("contact-1", mockUser);

      expect(result.isFavorite).toBe(true);
      expect(repository.toggleFavorite).toHaveBeenCalledWith("contact-1");
    });

    it("should throw NotFoundException when contact not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.toggleFavorite("non-existent", mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("toggleBlock", () => {
    it("should toggle block status", async () => {
      const result = await service.toggleBlock("contact-1", mockUser);

      expect(result.isBlocked).toBe(true);
      expect(repository.toggleBlock).toHaveBeenCalledWith("contact-1");
    });

    it("should throw NotFoundException when contact not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.toggleBlock("non-existent", mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
