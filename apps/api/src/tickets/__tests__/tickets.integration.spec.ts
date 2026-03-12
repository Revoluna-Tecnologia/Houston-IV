import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { TicketsService } from "../tickets.service";
import { TicketsRepository } from "../tickets.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { PrismaService } from "../../prisma/prisma.service";
import {
  TicketPriority,
  TicketCategory,
  TicketType,
  TicketSector,
  TicketStatus,
} from "../../generated/prisma/client";

describe("TicketsModule (Integration)", () => {
  let module: TestingModule;
  let service: TicketsService;
  let prisma: PrismaService;
  let testGrupoId: string;
  let testUserId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [TicketsService, TicketsRepository],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up in correct order (respecting foreign keys)
    await prisma.ticketAttachment.deleteMany();
    await prisma.ticketComment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.grupo.deleteMany();
    await prisma.user.deleteMany();

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: "Grupo Tickets Teste" },
    });
    testGrupoId = grupo.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "tickets-test@example.com",
        name: "Tickets Test User",
        emailVerified: true,
      },
    });
    testUserId = user.id;
  });

  describe("Ticket CRUD Operations", () => {
    describe("create", () => {
      it("should create a new ticket", async () => {
        const dto = {
          title: "Bug no Login",
          description: "O botao de login nao funciona",
          priority: TicketPriority.high,
          category: TicketCategory.functionality,
          grupoId: testGrupoId,
        };

        const result = await service.create(dto, testUserId);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.title).toBe(dto.title);
        expect(result.description).toBe(dto.description);
        expect(result.priority).toBe(TicketPriority.high);
        expect(result.category).toBe(TicketCategory.functionality);
        expect(result.status).toBe(TicketStatus.open);
        expect(result.grupoId).toBe(testGrupoId);
        expect(result.createdById).toBe(testUserId);
      });

      it("should create ticket with all optional fields", async () => {
        const dto = {
          title: "Bug Completo",
          description: "Descricao completa",
          priority: TicketPriority.critical,
          category: TicketCategory.functionality,
          type: TicketType.bug,
          sector: TicketSector.dev,
          location: "/dashboard/login",
          reproductionSteps: "1. Acessar\n2. Clicar",
          screenshots: ["https://storage.com/img1.png"],
          tags: ["urgente", "frontend"],
          grupoId: testGrupoId,
          assignedToId: testUserId,
        };

        const result = await service.create(dto, testUserId);

        expect(result.type).toBe(TicketType.bug);
        expect(result.sector).toBe(TicketSector.dev);
        expect(result.location).toBe("/dashboard/login");
        expect(result.reproductionSteps).toBe("1. Acessar\n2. Clicar");
        expect(result.screenshots).toContain("https://storage.com/img1.png");
        expect(result.tags).toContain("urgente");
        expect(result.assignedToId).toBe(testUserId);
      });

      it("should create ticket with SLA deadline", async () => {
        const slaDeadline = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString();
        const dto = {
          title: "Ticket com SLA",
          description: "Prazo definido",
          priority: TicketPriority.high,
          category: TicketCategory.functionality,
          grupoId: testGrupoId,
          slaDeadline,
        };

        const result = await service.create(dto, testUserId);

        expect(result.slaDeadline).toBeDefined();
      });
    });

    describe("findAll", () => {
      it("should return empty list when no tickets exist", async () => {
        const result = await service.findAll({ grupoId: testGrupoId });

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });

      it("should return paginated tickets", async () => {
        await service.create(
          {
            title: "Ticket 1",
            description: "Desc 1",
            priority: TicketPriority.low,
            category: TicketCategory.usability,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.create(
          {
            title: "Ticket 2",
            description: "Desc 2",
            priority: TicketPriority.medium,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.create(
          {
            title: "Ticket 3",
            description: "Desc 3",
            priority: TicketPriority.high,
            category: TicketCategory.other,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.findAll({
          grupoId: testGrupoId,
          page: 1,
          limit: 2,
        });

        expect(result.data).toHaveLength(2);
        expect(result.meta.total).toBe(3);
        expect(result.meta.totalPages).toBe(2);
      });

      it("should filter by status", async () => {
        const ticket1 = await service.create(
          {
            title: "Open Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.create(
          {
            title: "Closed Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        // Move second ticket to resolved then closed
        await service.updateStatus(ticket1.id, TicketStatus.resolved);

        const result = await service.findAll({
          grupoId: testGrupoId,
          status: TicketStatus.resolved,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe(TicketStatus.resolved);
      });

      it("should filter by priority", async () => {
        await service.create(
          {
            title: "High Priority",
            description: "Desc",
            priority: TicketPriority.high,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.create(
          {
            title: "Low Priority",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.findAll({
          grupoId: testGrupoId,
          priority: TicketPriority.high,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].priority).toBe(TicketPriority.high);
      });

      it("should filter by category", async () => {
        await service.create(
          {
            title: "Usability Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.usability,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.create(
          {
            title: "Performance Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.performance,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.findAll({
          grupoId: testGrupoId,
          category: TicketCategory.usability,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].category).toBe(TicketCategory.usability);
      });

      it("should search by title", async () => {
        await service.create(
          {
            title: "Bug no Login",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.create(
          {
            title: "Feature Request",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.findAll({
          grupoId: testGrupoId,
          search: "Login",
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toContain("Login");
      });
    });

    describe("findOne", () => {
      it("should return ticket by id with counts", async () => {
        const created = await service.create(
          {
            title: "Ticket Especifico",
            description: "Descricao",
            priority: TicketPriority.medium,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.findOne(created.id);

        expect(result.id).toBe(created.id);
        expect(result.title).toBe("Ticket Especifico");
        expect(result.commentsCount).toBeDefined();
        expect(result.attachmentsCount).toBeDefined();
      });

      it("should throw NotFoundException when ticket does not exist", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(service.findOne(nonExistentId)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.findOne(nonExistentId)).rejects.toThrow(
          "Ticket nao encontrado",
        );
      });
    });

    describe("update", () => {
      it("should update ticket title", async () => {
        const created = await service.create(
          {
            title: "Titulo Original",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.update(
          created.id,
          { title: "Titulo Atualizado" },
          testUserId,
        );

        expect(result.title).toBe("Titulo Atualizado");
      });

      it("should update ticket priority", async () => {
        const created = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.update(
          created.id,
          { priority: TicketPriority.critical },
          testUserId,
        );

        expect(result.priority).toBe(TicketPriority.critical);
      });

      it("should update ticket tags", async () => {
        const created = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.update(
          created.id,
          { tags: ["nova-tag", "outra-tag"] },
          testUserId,
        );

        expect(result.tags).toContain("nova-tag");
        expect(result.tags).toContain("outra-tag");
      });

      it("should throw NotFoundException when updating non-existent ticket", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(
          service.update(nonExistentId, { title: "New Title" }, testUserId),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe("remove", () => {
      it("should delete a ticket", async () => {
        const created = await service.create(
          {
            title: "Ticket a Deletar",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.remove(created.id);

        await expect(service.findOne(created.id)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("should throw NotFoundException when deleting non-existent ticket", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(service.remove(nonExistentId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe("Status Transitions", () => {
    describe("updateStatus", () => {
      it("should transition from open to in_progress", async () => {
        const ticket = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.updateStatus(
          ticket.id,
          TicketStatus.in_progress,
        );

        expect(result.status).toBe(TicketStatus.in_progress);
      });

      it("should transition from open to resolved", async () => {
        const ticket = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.updateStatus(
          ticket.id,
          TicketStatus.resolved,
        );

        expect(result.status).toBe(TicketStatus.resolved);
        expect(result.resolvedAt).toBeDefined();
      });

      it("should transition from resolved to closed", async () => {
        const ticket = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.updateStatus(ticket.id, TicketStatus.resolved);
        const result = await service.updateStatus(
          ticket.id,
          TicketStatus.closed,
        );

        expect(result.status).toBe(TicketStatus.closed);
        expect(result.closedAt).toBeDefined();
      });

      it("should allow reopening closed ticket", async () => {
        const ticket = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.updateStatus(ticket.id, TicketStatus.resolved);
        await service.updateStatus(ticket.id, TicketStatus.closed);
        const result = await service.updateStatus(ticket.id, TicketStatus.open);

        expect(result.status).toBe(TicketStatus.open);
      });

      it("should throw BadRequestException for invalid transition", async () => {
        const ticket = await service.create(
          {
            title: "Ticket",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.updateStatus(ticket.id, TicketStatus.in_progress);

        // in_progress -> open is not allowed
        await expect(
          service.updateStatus(ticket.id, TicketStatus.open),
        ).rejects.toThrow(BadRequestException);
      });

      it("should throw NotFoundException for non-existent ticket", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(
          service.updateStatus(nonExistentId, TicketStatus.in_progress),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe("Assignment", () => {
    describe("assign", () => {
      it("should assign ticket to user", async () => {
        const ticket = await service.create(
          {
            title: "Ticket para Atribuir",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.assign(ticket.id, testUserId);

        expect(result.assignedToId).toBe(testUserId);
      });

      it("should remove assignment when null is passed", async () => {
        const ticket = await service.create(
          {
            title: "Ticket Atribuido",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
            assignedToId: testUserId,
          },
          testUserId,
        );

        const result = await service.assign(ticket.id, null);

        expect(result.assignedToId).toBeNull();
      });

      it("should throw NotFoundException for non-existent ticket", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(service.assign(nonExistentId, testUserId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe("Archive", () => {
    describe("archive", () => {
      it("should archive a ticket", async () => {
        const ticket = await service.create(
          {
            title: "Ticket para Arquivar",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        const result = await service.archive(ticket.id, true);

        expect(result.archived).toBe(true);
      });

      it("should unarchive a ticket", async () => {
        const ticket = await service.create(
          {
            title: "Ticket Arquivado",
            description: "Desc",
            priority: TicketPriority.low,
            category: TicketCategory.functionality,
            grupoId: testGrupoId,
          },
          testUserId,
        );

        await service.archive(ticket.id, true);
        const result = await service.archive(ticket.id, false);

        expect(result.archived).toBe(false);
      });

      it("should throw NotFoundException for non-existent ticket", async () => {
        const nonExistentId = "00000000-0000-0000-0000-000000000000";

        await expect(service.archive(nonExistentId, true)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
