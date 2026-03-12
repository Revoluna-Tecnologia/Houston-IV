import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { WhatsAppInstanceStatus } from "../../../generated/prisma/client";
import { InstancesRepository } from "../instances.repository";
import { PrismaService } from "../../../prisma/prisma.service";

describe("InstancesRepository", () => {
  let repository: InstancesRepository;
  let prisma: {
    whatsAppInstance: {
      create: Mock;
      findUnique: Mock;
      findFirst: Mock;
      findMany: Mock;
      update: Mock;
      delete: Mock;
      count: Mock;
    };
  };

  const mockInstance = {
    id: "instance-1",
    grupoId: "grupo-1",
    provider: "zapster",
    providerInstanceId: "provider-instance-1",
    instanceName: "Test Instance",
    status: WhatsAppInstanceStatus.disconnected,
    phoneNumber: null,
    metadata: {},
    createdById: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      whatsAppInstance: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    };

    // Directly instantiate the repository with mocked dependencies
    repository = new InstancesRepository(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("should create a new instance", async () => {
      const createData = {
        grupoId: "grupo-1",
        providerInstanceId: "provider-instance-1",
        instanceName: "Test Instance",
        createdById: "user-1",
      };

      prisma.whatsAppInstance.create.mockResolvedValue(mockInstance);

      const result = await repository.create(createData);

      expect(result).toEqual(mockInstance);
      expect(prisma.whatsAppInstance.create).toHaveBeenCalledWith({
        data: {
          grupoId: "grupo-1",
          provider: "zapster",
          providerInstanceId: "provider-instance-1",
          instanceName: "Test Instance",
          status: WhatsAppInstanceStatus.disconnected,
          phoneNumber: undefined,
          metadata: {},
          createdById: "user-1",
        },
      });
    });

    it("should create instance with custom status", async () => {
      const createData = {
        grupoId: "grupo-1",
        providerInstanceId: "provider-instance-1",
        instanceName: "Test Instance",
        status: WhatsAppInstanceStatus.connected,
        phoneNumber: "5511999999999",
        createdById: "user-1",
      };

      prisma.whatsAppInstance.create.mockResolvedValue({
        ...mockInstance,
        status: WhatsAppInstanceStatus.connected,
        phoneNumber: "5511999999999",
      });

      const result = await repository.create(createData);

      expect(result.status).toBe(WhatsAppInstanceStatus.connected);
      expect(result.phoneNumber).toBe("5511999999999");
    });
  });

  describe("findById", () => {
    it("should find instance by id", async () => {
      prisma.whatsAppInstance.findUnique.mockResolvedValue(mockInstance);

      const result = await repository.findById("instance-1");

      expect(result).toEqual(mockInstance);
      expect(prisma.whatsAppInstance.findUnique).toHaveBeenCalledWith({
        where: { id: "instance-1" },
      });
    });

    it("should return null when instance not found", async () => {
      prisma.whatsAppInstance.findUnique.mockResolvedValue(null);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByGrupoId", () => {
    it("should find instance by grupo id", async () => {
      prisma.whatsAppInstance.findUnique.mockResolvedValue(mockInstance);

      const result = await repository.findByGrupoId("grupo-1");

      expect(result).toEqual(mockInstance);
      expect(prisma.whatsAppInstance.findUnique).toHaveBeenCalledWith({
        where: { grupoId: "grupo-1" },
      });
    });
  });

  describe("findByProviderInstanceId", () => {
    it("should find instance by provider instance id", async () => {
      prisma.whatsAppInstance.findFirst.mockResolvedValue(mockInstance);

      const result = await repository.findByProviderInstanceId(
        "provider-instance-1",
      );

      expect(result).toEqual(mockInstance);
      expect(prisma.whatsAppInstance.findFirst).toHaveBeenCalledWith({
        where: { providerInstanceId: "provider-instance-1" },
      });
    });
  });

  describe("findAll", () => {
    it("should find all instances", async () => {
      prisma.whatsAppInstance.findMany.mockResolvedValue([mockInstance]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(prisma.whatsAppInstance.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter by grupo ids", async () => {
      prisma.whatsAppInstance.findMany.mockResolvedValue([mockInstance]);

      const result = await repository.findAll(["grupo-1", "grupo-2"]);

      expect(result).toHaveLength(1);
      expect(prisma.whatsAppInstance.findMany).toHaveBeenCalledWith({
        where: { grupoId: { in: ["grupo-1", "grupo-2"] } },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("update", () => {
    it("should update instance", async () => {
      const updatedInstance = { ...mockInstance, instanceName: "Updated Name" };
      prisma.whatsAppInstance.update.mockResolvedValue(updatedInstance);

      const result = await repository.update("instance-1", {
        instanceName: "Updated Name",
      });

      expect(result.instanceName).toBe("Updated Name");
      expect(prisma.whatsAppInstance.update).toHaveBeenCalledWith({
        where: { id: "instance-1" },
        data: {
          instanceName: "Updated Name",
          status: undefined,
          phoneNumber: undefined,
          metadata: undefined,
        },
      });
    });
  });

  describe("updateStatus", () => {
    it("should update instance status", async () => {
      const updatedInstance = {
        ...mockInstance,
        status: WhatsAppInstanceStatus.connected,
        phoneNumber: "5511999999999",
      };
      prisma.whatsAppInstance.update.mockResolvedValue(updatedInstance);

      const result = await repository.updateStatus(
        "instance-1",
        WhatsAppInstanceStatus.connected,
        "5511999999999",
      );

      expect(result.status).toBe(WhatsAppInstanceStatus.connected);
      expect(result.phoneNumber).toBe("5511999999999");
    });
  });

  describe("delete", () => {
    it("should delete instance", async () => {
      prisma.whatsAppInstance.delete.mockResolvedValue(mockInstance);

      await repository.delete("instance-1");

      expect(prisma.whatsAppInstance.delete).toHaveBeenCalledWith({
        where: { id: "instance-1" },
      });
    });
  });

  describe("existsForGrupo", () => {
    it("should return true when instance exists", async () => {
      prisma.whatsAppInstance.count.mockResolvedValue(1);

      const result = await repository.existsForGrupo("grupo-1");

      expect(result).toBe(true);
    });

    it("should return false when instance does not exist", async () => {
      prisma.whatsAppInstance.count.mockResolvedValue(0);

      const result = await repository.existsForGrupo("grupo-1");

      expect(result).toBe(false);
    });
  });
});
