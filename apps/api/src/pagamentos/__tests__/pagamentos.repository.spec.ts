import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@prisma/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@prisma/client")>();
  return {
    ...actual,
    PagamentoStatus: {
      pendente: "pendente",
      autorizado: "autorizado",
      pago: "pago",
      cancelado: "cancelado",
    },
  };
});

import { PagamentosRepository } from "../pagamentos.repository";
import {
  createPagamentoFixture,
  createPagamentoListFixture,
} from "../../__tests__/fixtures";
import { Prisma } from "../../generated/prisma/client";
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

describe("PagamentosRepository", () => {
  let repository: PagamentosRepository;

  const mockPrisma = {
    pagamento: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  };

  beforeEach(() => {
    repository = new PagamentosRepository(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new pagamento", async () => {
      const dto = { vagaId: "vaga-id", medicoId: "medico-id", valor: 1500 };
      const pagamento = createPagamentoFixture(dto);
      mockPrisma.pagamento.create.mockResolvedValue(pagamento);

      const result = await repository.create(dto);

      expect(result).toEqual(pagamento);
      expect(mockPrisma.pagamento.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe("findAll", () => {
    it("should return paginated pagamentos", async () => {
      const pagamentos = createPagamentoListFixture(5);
      mockPrisma.pagamento.findMany.mockResolvedValue(pagamentos);
      mockPrisma.pagamento.count.mockResolvedValue(5);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(pagamentos);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
    });

    it("should apply vagaId filter", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);
      mockPrisma.pagamento.count.mockResolvedValue(0);

      await repository.findAll({ vagaId: "vaga-id" });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vagaId: "vaga-id" }),
        }),
      );
    });

    it("should apply medicoId filter", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);
      mockPrisma.pagamento.count.mockResolvedValue(0);

      await repository.findAll({ medicoId: "medico-id" });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicoId: "medico-id" }),
        }),
      );
    });

    it("should apply status filter", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);
      mockPrisma.pagamento.count.mockResolvedValue(0);

      await repository.findAll({ status: "pendente" });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "pendente" }),
        }),
      );
    });

    it("should apply date range filter", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);
      mockPrisma.pagamento.count.mockResolvedValue(0);

      await repository.findAll({
        dataInicio: "2024-01-01",
        dataFim: "2024-12-31",
      });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);
      mockPrisma.pagamento.count.mockResolvedValue(0);

      const result = await repository.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return pagamento by id", async () => {
      const pagamento = createPagamentoFixture({ id: "test-id" });
      mockPrisma.pagamento.findUnique.mockResolvedValue(pagamento);

      const result = await repository.findById("test-id");

      expect(result).toEqual(pagamento);
      expect(mockPrisma.pagamento.findUnique).toHaveBeenCalledWith({
        where: { id: "test-id" },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.pagamento.findUnique.mockResolvedValue(null);

      const result = await repository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findByVagaAndMedico", () => {
    it("should return pagamento by vagaId and medicoId", async () => {
      const pagamento = createPagamentoFixture({
        vagaId: "vaga-id",
        medicoId: "medico-id",
      });
      mockPrisma.pagamento.findFirst.mockResolvedValue(pagamento);

      const result = await repository.findByVagaAndMedico(
        "vaga-id",
        "medico-id",
      );

      expect(result).toEqual(pagamento);
      expect(mockPrisma.pagamento.findFirst).toHaveBeenCalledWith({
        where: { vagaId: "vaga-id", medicoId: "medico-id" },
      });
    });
  });

  describe("update", () => {
    it("should update pagamento", async () => {
      const pagamento = createPagamentoFixture({ status: "autorizado" });
      mockPrisma.pagamento.update.mockResolvedValue(pagamento);

      const result = await repository.update("id", { status: "autorizado" });

      expect(result).toEqual(pagamento);
      expect(mockPrisma.pagamento.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { status: "autorizado" },
      });
    });
  });

  describe("updateMany", () => {
    it("should update multiple pagamentos", async () => {
      mockPrisma.pagamento.updateMany.mockResolvedValue({ count: 3 });

      const result = await repository.updateMany(["id1", "id2", "id3"], {
        status: "autorizado",
      });

      expect(result).toBe(3);
      expect(mockPrisma.pagamento.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["id1", "id2", "id3"] } },
        data: { status: "autorizado" },
      });
    });
  });

  describe("delete", () => {
    it("should delete pagamento", async () => {
      mockPrisma.pagamento.delete.mockResolvedValue({});

      await repository.delete("id");

      expect(mockPrisma.pagamento.delete).toHaveBeenCalledWith({
        where: { id: "id" },
      });
    });
  });

  describe("sumByMedico", () => {
    it("should return sum of valores by medicoId", async () => {
      mockPrisma.pagamento.aggregate.mockResolvedValue({
        _sum: { valor: new Decimal(4500) },
      });

      const result = await repository.sumByMedico("medico-id");

      expect(result).toBe(4500);
      expect(mockPrisma.pagamento.aggregate).toHaveBeenCalledWith({
        where: { medicoId: "medico-id" },
        _sum: { valor: true },
      });
    });

    it("should return 0 when no pagamentos found", async () => {
      mockPrisma.pagamento.aggregate.mockResolvedValue({
        _sum: { valor: null },
      });

      const result = await repository.sumByMedico("medico-id");

      expect(result).toBe(0);
    });
  });

  describe("sumByPeriod", () => {
    it("should return sum of valores by period", async () => {
      const dataInicio = new Date("2024-01-01");
      const dataFim = new Date("2024-12-31");
      mockPrisma.pagamento.aggregate.mockResolvedValue({
        _sum: { valor: new Decimal(10000) },
      });

      const result = await repository.sumByPeriod(dataInicio, dataFim);

      expect(result).toBe(10000);
      expect(mockPrisma.pagamento.aggregate).toHaveBeenCalledWith({
        where: { createdAt: { gte: dataInicio, lte: dataFim } },
        _sum: { valor: true },
      });
    });

    it("should return 0 when no pagamentos found in period", async () => {
      mockPrisma.pagamento.aggregate.mockResolvedValue({
        _sum: { valor: null },
      });

      const result = await repository.sumByPeriod(new Date(), new Date());

      expect(result).toBe(0);
    });
  });
});
