import { describe, it, expect, vi, beforeEach } from "vitest";

import { PagamentosController } from "../pagamentos.controller";
import {
  createPagamentoFixture,
  createPagamentoListFixture,
  createAutorizadoPagamentoFixture,
  createPagoPagamentoFixture,
} from "../../__tests__/fixtures";
import { mockSession } from "../../__tests__/mocks";

describe("PagamentosController", () => {
  let controller: PagamentosController;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    autorizar: vi.fn(),
    pagar: vi.fn(),
    bulkAutorizar: vi.fn(),
    bulkPagar: vi.fn(),
  };

  beforeEach(() => {
    controller = new PagamentosController(mockService as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new pagamento", async () => {
      const dto = { vagaId: "vaga-id", medicoId: "medico-id", valor: 1500 };
      const pagamento = createPagamentoFixture(dto);
      mockService.create.mockResolvedValue(pagamento);

      const result = await controller.create(dto, mockSession as never);

      expect(result).toEqual(pagamento);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("should return paginated pagamentos", async () => {
      const pagamentos = createPagamentoListFixture(3);
      const response = {
        data: pagamentos,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(response);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(response);
    });

    it("should pass query filters to service", async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: {} });
      const query = { vagaId: "vaga-id", status: "pendente" };

      await controller.findAll(query as never);

      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe("findOne", () => {
    it("should return pagamento by id", async () => {
      const pagamento = createPagamentoFixture({ id: "test-id" });
      mockService.findOne.mockResolvedValue(pagamento);

      const result = await controller.findOne("test-id");

      expect(result).toEqual(pagamento);
      expect(mockService.findOne).toHaveBeenCalledWith("test-id");
    });
  });

  describe("update", () => {
    it("should update pagamento", async () => {
      const pagamento = createPagamentoFixture({
        id: "test-id",
        observacoes: "Updated",
      });
      mockService.update.mockResolvedValue(pagamento);

      const result = await controller.update(
        "test-id",
        { observacoes: "Updated" },
        mockSession as never,
      );

      expect(result).toEqual(pagamento);
      expect(mockService.update).toHaveBeenCalledWith("test-id", {
        observacoes: "Updated",
      });
    });
  });

  describe("remove", () => {
    it("should remove pagamento", async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove("test-id", mockSession as never);

      expect(mockService.remove).toHaveBeenCalledWith("test-id");
    });
  });

  describe("autorizar", () => {
    it("should autorizar pagamento", async () => {
      const pagamento = createAutorizadoPagamentoFixture({ id: "test-id" });
      mockService.autorizar.mockResolvedValue(pagamento);

      const result = await controller.autorizar(
        "test-id",
        mockSession as never,
      );

      expect(result).toEqual(pagamento);
      expect(result.status).toBe("autorizado");
      expect(mockService.autorizar).toHaveBeenCalledWith("test-id");
    });
  });

  describe("pagar", () => {
    it("should pagar pagamento", async () => {
      const pagamento = createPagoPagamentoFixture({ id: "test-id" });
      mockService.pagar.mockResolvedValue(pagamento);

      const result = await controller.pagar("test-id", mockSession as never);

      expect(result).toEqual(pagamento);
      expect(result.status).toBe("pago");
      expect(mockService.pagar).toHaveBeenCalledWith("test-id");
    });
  });

  describe("bulkAutorizar", () => {
    it("should autorizar multiple pagamentos", async () => {
      const response = { success: 2, failed: [] };
      mockService.bulkAutorizar.mockResolvedValue(response);

      const result = await controller.bulkAutorizar(
        { ids: ["id1", "id2"] },
        mockSession as never,
      );

      expect(result).toEqual(response);
      expect(mockService.bulkAutorizar).toHaveBeenCalledWith(["id1", "id2"]);
    });

    it("should return partial success for bulk operations", async () => {
      const response = { success: 1, failed: ["id2"] };
      mockService.bulkAutorizar.mockResolvedValue(response);

      const result = await controller.bulkAutorizar(
        { ids: ["id1", "id2"] },
        mockSession as never,
      );

      expect(result.success).toBe(1);
      expect(result.failed).toContain("id2");
    });
  });

  describe("bulkPagar", () => {
    it("should pagar multiple pagamentos", async () => {
      const response = { success: 3, failed: [] };
      mockService.bulkPagar.mockResolvedValue(response);

      const result = await controller.bulkPagar(
        { ids: ["id1", "id2", "id3"] },
        mockSession as never,
      );

      expect(result).toEqual(response);
      expect(mockService.bulkPagar).toHaveBeenCalledWith(["id1", "id2", "id3"]);
    });

    it("should return partial success for bulk pagar", async () => {
      const response = { success: 2, failed: ["id3"] };
      mockService.bulkPagar.mockResolvedValue(response);

      const result = await controller.bulkPagar(
        { ids: ["id1", "id2", "id3"] },
        mockSession as never,
      );

      expect(result.success).toBe(2);
      expect(result.failed).toContain("id3");
    });
  });
});
