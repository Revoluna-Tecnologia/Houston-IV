import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { ContactsService } from "../contacts/contacts.service";
import { ContactsRepository } from "../contacts/contacts.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthenticatedUser, AppRole } from "../../auth/types/auth.types";

describe("ComunicacaoModule (Integration)", () => {
  let module: TestingModule;
  let contactsService: ContactsService;
  let prisma: PrismaService;
  let testUserId: string;
  let testGrupoId: string;

  const createMockUser = (
    overrides: Partial<AuthenticatedUser> = {},
  ): AuthenticatedUser => ({
    id: testUserId,
    email: "test@example.com",
    roles: [AppRole.ADMINISTRADOR],
    grupoIds: [testGrupoId],
    permissions: [],
    hospitalIds: [],
    setorIds: [],
    ...overrides,
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [ContactsService, ContactsRepository],
    }).compile();

    contactsService = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up in correct order (respecting foreign keys)
    await prisma.chatContact.deleteMany();
    await prisma.chatParticipant.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.grupo.deleteMany();

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: "Grupo Teste" },
    });
    testGrupoId = grupo.id;

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        role: "administrador",
        grupoIds: [grupo.id],
      },
    });
    testUserId = testUser.id;
  });

  describe("ContactsService", () => {
    describe("create", () => {
      it("should create a new contact", async () => {
        const user = createMockUser();
        const dto = {
          name: "Dr. João Silva",
          phoneNumber: "5511999998888",
          email: "joao@example.com",
        };

        const result = await contactsService.create(dto, user);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(dto.name);
        expect(result.phoneNumber).toBe(dto.phoneNumber);
        expect(result.email).toBe(dto.email);
        expect(result.ownerId).toBe(testUserId);
        expect(result.isFavorite).toBe(false);
        expect(result.isBlocked).toBe(false);
      });

      it("should create contact with minimal data", async () => {
        const user = createMockUser();
        const dto = {
          name: "Contato Simples",
          phoneNumber: "5511888887777",
        };

        const result = await contactsService.create(dto, user);

        expect(result.name).toBe(dto.name);
        expect(result.phoneNumber).toBe(dto.phoneNumber);
        expect(result.email).toBeUndefined();
      });

      it("should create contact with favorite flag", async () => {
        const user = createMockUser();
        const dto = {
          name: "Contato Favorito",
          phoneNumber: "5511777776666",
          isFavorite: true,
        };

        const result = await contactsService.create(dto, user);

        expect(result.isFavorite).toBe(true);
      });

      it("should create contact with notes", async () => {
        const user = createMockUser();
        const dto = {
          name: "Contato com Notas",
          phoneNumber: "5511666665555",
          notes: "Preferência por plantões noturnos",
        };

        const result = await contactsService.create(dto, user);

        expect(result.notes).toBe(dto.notes);
      });

      it("should throw ConflictException when contact with same phone exists", async () => {
        const user = createMockUser();
        const dto = {
          name: "Primeiro Contato",
          phoneNumber: "5511555554444",
        };

        await contactsService.create(dto, user);

        const dto2 = {
          name: "Segundo Contato",
          phoneNumber: "5511555554444",
        };

        await expect(contactsService.create(dto2, user)).rejects.toThrow(
          ConflictException,
        );
        await expect(contactsService.create(dto2, user)).rejects.toThrow(
          "Contato com esse telefone já existe",
        );
      });

      it("should allow same phone for different users", async () => {
        const user1 = createMockUser();
        const dto = {
          name: "Contato User 1",
          phoneNumber: "5511444443333",
        };

        await contactsService.create(dto, user1);

        // Create another user
        const anotherUser = await prisma.user.create({
          data: {
            name: "Another User",
            email: "another@example.com",
            role: "escalista",
            grupoIds: [testGrupoId],
          },
        });

        const user2 = createMockUser({ id: anotherUser.id });
        const dto2 = {
          name: "Contato User 2",
          phoneNumber: "5511444443333",
        };

        const result = await contactsService.create(dto2, user2);

        expect(result.name).toBe(dto2.name);
      });
    });

    describe("findAll", () => {
      it("should return empty list when no contacts exist", async () => {
        const user = createMockUser();

        const result = await contactsService.findAll({}, user);

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      it("should return list of contacts for user", async () => {
        const user = createMockUser();

        await contactsService.create(
          { name: "Contato A", phoneNumber: "5511111111111" },
          user,
        );
        await contactsService.create(
          { name: "Contato B", phoneNumber: "5511222222222" },
          user,
        );
        await contactsService.create(
          { name: "Contato C", phoneNumber: "5511333333333" },
          user,
        );

        const result = await contactsService.findAll({}, user);

        expect(result.data).toHaveLength(3);
        expect(result.total).toBe(3);
      });

      it("should only return contacts owned by user", async () => {
        const user1 = createMockUser();

        await contactsService.create(
          { name: "Contato User 1", phoneNumber: "5511111111111" },
          user1,
        );

        // Create another user and their contact
        const anotherUser = await prisma.user.create({
          data: {
            name: "Another User",
            email: "another@example.com",
            role: "escalista",
            grupoIds: [testGrupoId],
          },
        });

        const user2 = createMockUser({ id: anotherUser.id });
        await contactsService.create(
          { name: "Contato User 2", phoneNumber: "5511222222222" },
          user2,
        );

        const result = await contactsService.findAll({}, user1);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Contato User 1");
      });

      it("should search contacts by name", async () => {
        const user = createMockUser();

        await contactsService.create(
          { name: "Dr. João Silva", phoneNumber: "5511111111111" },
          user,
        );
        await contactsService.create(
          { name: "Dra. Maria Santos", phoneNumber: "5511222222222" },
          user,
        );

        const result = await contactsService.findAll({ search: "João" }, user);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Dr. João Silva");
      });

      it("should filter by favorites", async () => {
        const user = createMockUser();

        await contactsService.create(
          {
            name: "Contato Normal",
            phoneNumber: "5511111111111",
            isFavorite: false,
          },
          user,
        );
        await contactsService.create(
          {
            name: "Contato Favorito",
            phoneNumber: "5511222222222",
            isFavorite: true,
          },
          user,
        );

        const result = await contactsService.findAll(
          { favoritesOnly: true },
          user,
        );

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Contato Favorito");
      });
    });

    describe("findOne", () => {
      it("should return a contact by id", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato Específico", phoneNumber: "5511999998888" },
          user,
        );

        const result = await contactsService.findOne(created.id, user);

        expect(result.id).toBe(created.id);
        expect(result.name).toBe("Contato Específico");
      });

      it("should throw NotFoundException when contact does not exist", async () => {
        const user = createMockUser();
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(
          contactsService.findOne(nonExistentId, user),
        ).rejects.toThrow(NotFoundException);
        await expect(
          contactsService.findOne(nonExistentId, user),
        ).rejects.toThrow("Contato não encontrado");
      });

      it("should throw ForbiddenException when accessing another user contact", async () => {
        const user1 = createMockUser();
        const created = await contactsService.create(
          { name: "Contato User 1", phoneNumber: "5511111111111" },
          user1,
        );

        // Create another user
        const anotherUser = await prisma.user.create({
          data: {
            name: "Another User",
            email: "another@example.com",
            role: "escalista",
            grupoIds: [testGrupoId],
          },
        });

        const user2 = createMockUser({ id: anotherUser.id });

        await expect(
          contactsService.findOne(created.id, user2),
        ).rejects.toThrow(ForbiddenException);
        await expect(
          contactsService.findOne(created.id, user2),
        ).rejects.toThrow("Sem acesso ao contato");
      });
    });

    describe("update", () => {
      it("should update contact name", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Nome Original", phoneNumber: "5511999998888" },
          user,
        );

        const result = await contactsService.update(
          created.id,
          { name: "Nome Atualizado" },
          user,
        );

        expect(result.name).toBe("Nome Atualizado");
      });

      it("should update contact email", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888" },
          user,
        );

        const result = await contactsService.update(
          created.id,
          { email: "novo@example.com" },
          user,
        );

        expect(result.email).toBe("novo@example.com");
      });

      it("should update favorite status", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888", isFavorite: false },
          user,
        );

        const result = await contactsService.update(
          created.id,
          { isFavorite: true },
          user,
        );

        expect(result.isFavorite).toBe(true);
      });

      it("should update blocked status", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888" },
          user,
        );

        const result = await contactsService.update(
          created.id,
          { isBlocked: true },
          user,
        );

        expect(result.isBlocked).toBe(true);
      });

      it("should throw NotFoundException when updating non-existent contact", async () => {
        const user = createMockUser();
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(
          contactsService.update(nonExistentId, { name: "Novo Nome" }, user),
        ).rejects.toThrow(NotFoundException);
      });

      it("should throw ForbiddenException when updating another user contact", async () => {
        const user1 = createMockUser();
        const created = await contactsService.create(
          { name: "Contato User 1", phoneNumber: "5511111111111" },
          user1,
        );

        const anotherUser = await prisma.user.create({
          data: {
            name: "Another User",
            email: "another@example.com",
            role: "escalista",
            grupoIds: [testGrupoId],
          },
        });

        const user2 = createMockUser({ id: anotherUser.id });

        await expect(
          contactsService.update(created.id, { name: "Hacked" }, user2),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe("delete", () => {
      it("should delete a contact", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato a Deletar", phoneNumber: "5511999998888" },
          user,
        );

        await contactsService.delete(created.id, user);

        await expect(contactsService.findOne(created.id, user)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("should throw NotFoundException when deleting non-existent contact", async () => {
        const user = createMockUser();
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(
          contactsService.delete(nonExistentId, user),
        ).rejects.toThrow(NotFoundException);
      });

      it("should throw ForbiddenException when deleting another user contact", async () => {
        const user1 = createMockUser();
        const created = await contactsService.create(
          { name: "Contato User 1", phoneNumber: "5511111111111" },
          user1,
        );

        const anotherUser = await prisma.user.create({
          data: {
            name: "Another User",
            email: "another@example.com",
            role: "escalista",
            grupoIds: [testGrupoId],
          },
        });

        const user2 = createMockUser({ id: anotherUser.id });

        await expect(contactsService.delete(created.id, user2)).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe("toggleFavorite", () => {
      it("should toggle favorite from false to true", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888", isFavorite: false },
          user,
        );

        const result = await contactsService.toggleFavorite(created.id, user);

        expect(result.isFavorite).toBe(true);
      });

      it("should toggle favorite from true to false", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888", isFavorite: true },
          user,
        );

        const result = await contactsService.toggleFavorite(created.id, user);

        expect(result.isFavorite).toBe(false);
      });
    });

    describe("toggleBlock", () => {
      it("should toggle block from false to true", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888" },
          user,
        );

        const result = await contactsService.toggleBlock(created.id, user);

        expect(result.isBlocked).toBe(true);
      });

      it("should toggle block from true to false", async () => {
        const user = createMockUser();
        const created = await contactsService.create(
          { name: "Contato", phoneNumber: "5511999998888" },
          user,
        );

        // First toggle to true
        await contactsService.toggleBlock(created.id, user);

        // Second toggle to false
        const result = await contactsService.toggleBlock(created.id, user);

        expect(result.isBlocked).toBe(false);
      });
    });
  });
});
