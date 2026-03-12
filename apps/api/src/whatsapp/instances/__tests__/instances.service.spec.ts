import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { WhatsAppInstanceStatus } from "@prisma/client";
import { InstancesService } from "../instances.service";
import { InstancesRepository } from "../instances.repository";
import { WhatsAppService } from "../../whatsapp.service";
import { ConnectionStatus } from "../../types";
import { AppRole } from "../../../auth/types/auth.types";

describe("InstancesService", () => {
  let service: InstancesService;
  let repository: {
    create: Mock;
    findById: Mock;
    findByGrupoId: Mock;
    findAll: Mock;
    update: Mock;
    updateStatus: Mock;
    delete: Mock;
    existsForGrupo: Mock;
  };
  let whatsappService: {
    createInstance: Mock;
    deleteInstance: Mock;
    getActiveProvider: Mock;
    getQRCode: Mock;
    getPairingCode: Mock;
    getConnectionStatus: Mock;
    getInstance: Mock;
    powerOn: Mock;
    powerOff: Mock;
    disconnect: Mock;
  };

  const mockUser = {
    id: "user-1",
    email: "test@test.com",
    name: "Test User",
    roles: [AppRole.ADMINISTRADOR],
    grupoIds: ["grupo-1", "grupo-2"],
    permissions: [],
    hospitalIds: [],
    setorIds: [],
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
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByGrupoId: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      existsForGrupo: vi.fn(),
    };

    whatsappService = {
      createInstance: vi.fn(),
      deleteInstance: vi.fn(),
      getActiveProvider: vi.fn(),
      getQRCode: vi.fn(),
      getPairingCode: vi.fn(),
      getConnectionStatus: vi.fn(),
      getInstance: vi.fn(),
      powerOn: vi.fn(),
      powerOff: vi.fn(),
      disconnect: vi.fn(),
    };

    // Directly instantiate the service with mocked dependencies
    service = new InstancesService(
      repository as unknown as InstancesRepository,
      whatsappService as unknown as WhatsAppService,
    );
  });

  describe("create", () => {
    it("should create a new instance", async () => {
      const dto = { grupoId: "grupo-1", name: "New Instance" };
      const providerInstance = {
        id: "provider-1",
        name: "New Instance",
        status: ConnectionStatus.DISCONNECTED,
        phoneNumber: null,
        createdAt: new Date(),
      };

      repository.existsForGrupo.mockResolvedValue(false);
      whatsappService.createInstance.mockResolvedValue(providerInstance);
      whatsappService.getActiveProvider.mockReturnValue("zapster");
      repository.create.mockResolvedValue(mockInstance);

      const result = await service.create(dto, mockUser);

      expect(result.id).toBe("instance-1");
      expect(repository.existsForGrupo).toHaveBeenCalledWith("grupo-1");
      expect(whatsappService.createInstance).toHaveBeenCalledWith(
        "New Instance",
      );
    });

    it("should throw ForbiddenException when user has no access to grupo", async () => {
      const dto = { grupoId: "grupo-not-allowed", name: "New Instance" };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        "Sem acesso ao grupo",
      );
    });

    it("should throw ConflictException when grupo already has instance", async () => {
      const dto = { grupoId: "grupo-1", name: "New Instance" };

      repository.existsForGrupo.mockResolvedValue(true);

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dto, mockUser)).rejects.toThrow(
        "Grupo já possui uma instância WhatsApp",
      );
    });
  });

  describe("findAll", () => {
    it("should return all instances for user grupos", async () => {
      repository.findAll.mockResolvedValue([mockInstance]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith(mockUser.grupoIds);
    });
  });

  describe("findOne", () => {
    it("should return an instance by id", async () => {
      repository.findById.mockResolvedValue(mockInstance);

      const result = await service.findOne("instance-1", mockUser);

      expect(result.id).toBe("instance-1");
    });

    it("should throw NotFoundException when instance not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne("non-existent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException when user has no access", async () => {
      const instanceOutsideGrupo = {
        ...mockInstance,
        grupoId: "grupo-not-allowed",
      };
      repository.findById.mockResolvedValue(instanceOutsideGrupo);

      await expect(service.findOne("instance-1", mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("findByGrupo", () => {
    it("should return instance for grupo", async () => {
      repository.findByGrupoId.mockResolvedValue(mockInstance);

      const result = await service.findByGrupo("grupo-1", mockUser);

      expect(result?.id).toBe("instance-1");
    });

    it("should return null when no instance exists for grupo", async () => {
      repository.findByGrupoId.mockResolvedValue(null);

      const result = await service.findByGrupo("grupo-1", mockUser);

      expect(result).toBeNull();
    });

    it("should throw ForbiddenException when user has no access", async () => {
      await expect(
        service.findByGrupo("grupo-not-allowed", mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("update", () => {
    it("should update an instance", async () => {
      const updatedInstance = { ...mockInstance, instanceName: "Updated Name" };
      repository.findById.mockResolvedValue(mockInstance);
      repository.update.mockResolvedValue(updatedInstance);

      const result = await service.update(
        "instance-1",
        { name: "Updated Name" },
        mockUser,
      );

      expect(result.instanceName).toBe("Updated Name");
    });

    it("should throw NotFoundException when instance not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("non-existent", { name: "New Name" }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete an instance", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.disconnect.mockResolvedValue(undefined);
      whatsappService.deleteInstance.mockResolvedValue(undefined);
      repository.delete.mockResolvedValue(undefined);

      await service.delete("instance-1", mockUser);

      expect(whatsappService.disconnect).toHaveBeenCalled();
      expect(whatsappService.deleteInstance).toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith("instance-1");
    });

    it("should continue deletion even if provider fails", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.disconnect.mockRejectedValue(new Error("Provider error"));
      repository.delete.mockResolvedValue(undefined);

      await service.delete("instance-1", mockUser);

      expect(repository.delete).toHaveBeenCalledWith("instance-1");
    });
  });

  describe("getQRCode", () => {
    it("should return QR code", async () => {
      const qrResponse = { qr: "base64-qr-code", expiresAt: new Date() };
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.getQRCode.mockResolvedValue(qrResponse);
      repository.updateStatus.mockResolvedValue(mockInstance);

      const result = await service.getQRCode("instance-1", mockUser);

      expect(result.qr).toBe("base64-qr-code");
    });

    it("should power on instance if offline", async () => {
      const offlineInstance = {
        ...mockInstance,
        status: WhatsAppInstanceStatus.offline,
      };
      repository.findById.mockResolvedValue(offlineInstance);
      whatsappService.powerOn.mockResolvedValue(undefined);
      whatsappService.getQRCode.mockResolvedValue({
        qr: "qr-code",
        expiresAt: new Date(),
      });
      repository.updateStatus.mockResolvedValue(mockInstance);

      await service.getQRCode("instance-1", mockUser);

      expect(whatsappService.powerOn).toHaveBeenCalled();
    });
  });

  describe("getPairingCode", () => {
    it("should return pairing code", async () => {
      const codeResponse = { code: "123456", expiresAt: new Date() };
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.getPairingCode.mockResolvedValue(codeResponse);
      repository.updateStatus.mockResolvedValue(mockInstance);

      const result = await service.getPairingCode(
        "instance-1",
        { phoneNumber: "5511999999999" },
        mockUser,
      );

      expect(result.code).toBe("123456");
    });

    it("should throw error when phone number not provided", async () => {
      repository.findById.mockResolvedValue(mockInstance);

      await expect(
        service.getPairingCode("instance-1", {}, mockUser),
      ).rejects.toThrow(
        "Número de telefone é obrigatório para código de pareamento",
      );
    });
  });

  describe("getConnectionStatus", () => {
    it("should return connection status", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.getConnectionStatus.mockResolvedValue(
        ConnectionStatus.CONNECTED,
      );
      repository.updateStatus.mockResolvedValue({
        ...mockInstance,
        status: WhatsAppInstanceStatus.connected,
      });

      const result = await service.getConnectionStatus("instance-1", mockUser);

      expect(result.isConnected).toBe(true);
      expect(result.status).toBe(WhatsAppInstanceStatus.connected);
    });
  });

  describe("powerOn", () => {
    it("should power on instance", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.powerOn.mockResolvedValue(undefined);
      repository.updateStatus.mockResolvedValue(mockInstance);

      await service.powerOn("instance-1", mockUser);

      expect(whatsappService.powerOn).toHaveBeenCalledWith(
        "provider-instance-1",
      );
      expect(repository.updateStatus).toHaveBeenCalledWith(
        "instance-1",
        WhatsAppInstanceStatus.connecting,
      );
    });
  });

  describe("powerOff", () => {
    it("should power off instance", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.powerOff.mockResolvedValue(undefined);
      repository.updateStatus.mockResolvedValue(mockInstance);

      await service.powerOff("instance-1", mockUser);

      expect(whatsappService.powerOff).toHaveBeenCalledWith(
        "provider-instance-1",
      );
      expect(repository.updateStatus).toHaveBeenCalledWith(
        "instance-1",
        WhatsAppInstanceStatus.offline,
      );
    });
  });

  describe("disconnect", () => {
    it("should disconnect instance", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.disconnect.mockResolvedValue(undefined);
      repository.updateStatus.mockResolvedValue(mockInstance);

      await service.disconnect("instance-1", mockUser);

      expect(whatsappService.disconnect).toHaveBeenCalledWith(
        "provider-instance-1",
      );
      expect(repository.updateStatus).toHaveBeenCalledWith(
        "instance-1",
        WhatsAppInstanceStatus.disconnected,
        undefined,
      );
    });
  });

  describe("refreshStatus", () => {
    it("should refresh status from provider", async () => {
      const providerInstance = {
        id: "provider-1",
        name: "Test",
        status: ConnectionStatus.CONNECTED,
        phoneNumber: "5511999999999",
        createdAt: new Date(),
      };
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.getConnectionStatus.mockResolvedValue(
        ConnectionStatus.CONNECTED,
      );
      whatsappService.getInstance.mockResolvedValue(providerInstance);
      repository.updateStatus.mockResolvedValue(mockInstance);

      await service.refreshStatus("instance-1");

      expect(repository.updateStatus).toHaveBeenCalledWith(
        "instance-1",
        WhatsAppInstanceStatus.connected,
        "5511999999999",
      );
    });

    it("should set offline status when provider fails", async () => {
      repository.findById.mockResolvedValue(mockInstance);
      whatsappService.getConnectionStatus.mockRejectedValue(
        new Error("Provider error"),
      );
      repository.updateStatus.mockResolvedValue(mockInstance);

      await service.refreshStatus("instance-1");

      expect(repository.updateStatus).toHaveBeenCalledWith(
        "instance-1",
        WhatsAppInstanceStatus.offline,
      );
    });

    it("should do nothing when instance not found", async () => {
      repository.findById.mockResolvedValue(null);

      await service.refreshStatus("non-existent");

      expect(whatsappService.getConnectionStatus).not.toHaveBeenCalled();
    });
  });
});
