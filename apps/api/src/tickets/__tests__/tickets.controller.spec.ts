import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { TicketStatus, TicketPriority } from "../../generated/prisma/client";
import { TicketsController } from "../tickets.controller";
import { TicketsService } from "../tickets.service";

describe("TicketsController", () => {
  let controller: TicketsController;
  let service: {
    create: Mock;
    findAll: Mock;
    findOne: Mock;
    update: Mock;
    updateStatus: Mock;
    assign: Mock;
    archive: Mock;
    remove: Mock;
  };

  const mockTicket = {
    id: "ticket-1",
    title: "Test Ticket",
    description: "Test description",
    status: TicketStatus.open,
    priority: TicketPriority.medium,
    category: "functionality",
    sector: "dev",
    grupoId: "grupo-1",
    createdById: "user-1",
    assignedToId: null,
    isArchived: false,
    slaDeadline: null,
    slaBreach: false,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      create: vi.fn().mockResolvedValue(mockTicket),
      findAll: vi.fn().mockResolvedValue({
        data: [mockTicket],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }),
      findOne: vi.fn().mockResolvedValue(mockTicket),
      update: vi.fn().mockResolvedValue(mockTicket),
      updateStatus: vi
        .fn()
        .mockResolvedValue({ ...mockTicket, status: TicketStatus.in_progress }),
      assign: vi
        .fn()
        .mockResolvedValue({ ...mockTicket, assignedToId: "user-2" }),
      archive: vi.fn().mockResolvedValue({ ...mockTicket, isArchived: true }),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    controller = new TicketsController(service as unknown as TicketsService);
  });

  describe("create", () => {
    it("should create a new ticket", async () => {
      const dto = {
        title: "Test Ticket",
        description: "Test description",
        priority: TicketPriority.medium,
        category: "functionality",
        sector: "dev",
        grupoId: "grupo-1",
      };

      const result = await controller.create(dto, "user-1");

      expect(result.id).toBe("ticket-1");
      expect(service.create).toHaveBeenCalledWith(dto, "user-1");
    });
  });

  describe("findAll", () => {
    it("should return all tickets", async () => {
      const query = { page: 1, limit: 20 };

      const result = await controller.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it("should filter by status", async () => {
      const query = { status: TicketStatus.open, page: 1, limit: 20 };

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it("should filter by priority", async () => {
      const query = { priority: TicketPriority.high, page: 1, limit: 20 };

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe("findOne", () => {
    it("should return a ticket by id", async () => {
      const result = await controller.findOne("ticket-1");

      expect(result.id).toBe("ticket-1");
      expect(service.findOne).toHaveBeenCalledWith("ticket-1");
    });
  });

  describe("update", () => {
    it("should update a ticket", async () => {
      const dto = { title: "Updated Title" };

      const result = await controller.update("ticket-1", dto, "user-1");

      expect(result.id).toBe("ticket-1");
      expect(service.update).toHaveBeenCalledWith("ticket-1", dto, "user-1");
    });
  });

  describe("updateStatus", () => {
    it("should update ticket status", async () => {
      const dto = { status: TicketStatus.in_progress };

      const result = await controller.updateStatus("ticket-1", dto);

      expect(result.status).toBe(TicketStatus.in_progress);
      expect(service.updateStatus).toHaveBeenCalledWith(
        "ticket-1",
        TicketStatus.in_progress,
      );
    });
  });

  describe("assign", () => {
    it("should assign ticket to user", async () => {
      const result = await controller.assign("ticket-1", "user-2");

      expect(result.assignedToId).toBe("user-2");
      expect(service.assign).toHaveBeenCalledWith("ticket-1", "user-2");
    });

    it("should unassign ticket", async () => {
      service.assign.mockResolvedValue({ ...mockTicket, assignedToId: null });

      const result = await controller.assign("ticket-1", null);

      expect(result.assignedToId).toBeNull();
      expect(service.assign).toHaveBeenCalledWith("ticket-1", null);
    });
  });

  describe("archive", () => {
    it("should archive a ticket", async () => {
      const result = await controller.archive("ticket-1", true);

      expect(result.isArchived).toBe(true);
      expect(service.archive).toHaveBeenCalledWith("ticket-1", true);
    });

    it("should unarchive a ticket", async () => {
      service.archive.mockResolvedValue({ ...mockTicket, isArchived: false });

      const result = await controller.archive("ticket-1", false);

      expect(result.isArchived).toBe(false);
      expect(service.archive).toHaveBeenCalledWith("ticket-1", false);
    });
  });

  describe("remove", () => {
    it("should remove a ticket", async () => {
      await controller.remove("ticket-1");

      expect(service.remove).toHaveBeenCalledWith("ticket-1");
    });
  });
});
