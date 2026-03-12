import { describe, it, expect, vi, beforeEach } from "vitest";
import { VagasRepository } from "../vagas.repository";
import {
  createVagaFixture,
  createVagaListFixture,
} from "../../__tests__/fixtures";

describe("VagasRepository", () => {
  let repository: VagasRepository;

  const mockPrisma = {
    notDeleted: () => ({ deletedAt: null }),
    softDeleteData: () => ({ deletedAt: new Date() }),
    vaga: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };

  beforeEach(() => {
    repository = new VagasRepository(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new vaga", async () => {
      const dto = {
        data: "2025-01-15",
        horaInicio: "08:00",
        horaFim: "12:00",
        valor: 1500,
        hospitalId: "hospital-id",
        setorId: "setor-id",
        especialidadeId: "especialidade-id",
      };
      const vaga = createVagaFixture({
        data: new Date(dto.data),
        horaInicio: dto.horaInicio,
        horaFim: dto.horaFim,
        valor: dto.valor,
        hospitalId: dto.hospitalId,
        setorId: dto.setorId,
        especialidadeId: dto.especialidadeId,
      });
      mockPrisma.vaga.create.mockResolvedValue(vaga);

      const result = await repository.create(dto);

      expect(result).toEqual(vaga);
      expect(mockPrisma.vaga.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated vagas", async () => {
      const vagas = createVagaListFixture(5);
      mockPrisma.vaga.findMany.mockResolvedValue(vagas);
      mockPrisma.vaga.count.mockResolvedValue(5);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(vagas);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
    });

    it("should apply status filter", async () => {
      mockPrisma.vaga.findMany.mockResolvedValue([]);
      mockPrisma.vaga.count.mockResolvedValue(0);

      await repository.findAll({ status: "aberta" });

      expect(mockPrisma.vaga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "aberta" }),
        }),
      );
    });

    it("should apply hospitalId filter", async () => {
      mockPrisma.vaga.findMany.mockResolvedValue([]);
      mockPrisma.vaga.count.mockResolvedValue(0);

      await repository.findAll({ hospitalId: "hospital-123" });

      expect(mockPrisma.vaga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hospitalId: "hospital-123" }),
        }),
      );
    });

    it("should apply date range filter", async () => {
      mockPrisma.vaga.findMany.mockResolvedValue([]);
      mockPrisma.vaga.count.mockResolvedValue(0);

      await repository.findAll({
        dataInicio: "2025-01-01",
        dataFim: "2025-01-31",
      });

      expect(mockPrisma.vaga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            data: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.vaga.findMany.mockResolvedValue([]);
      mockPrisma.vaga.count.mockResolvedValue(0);

      const result = await repository.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return vaga by id", async () => {
      const vaga = createVagaFixture({ id: "test-id" });
      mockPrisma.vaga.findFirst.mockResolvedValue(vaga);

      const result = await repository.findById("test-id");

      expect(result).toEqual(vaga);
      expect(mockPrisma.vaga.findFirst).toHaveBeenCalledWith({
        where: { id: "test-id", deletedAt: null },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.vaga.findFirst.mockResolvedValue(null);

      const result = await repository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findConflicting", () => {
    it("should find conflicting vaga with overlapping times", async () => {
      const vaga = createVagaFixture();
      mockPrisma.vaga.findFirst.mockResolvedValue(vaga);

      const result = await repository.findConflicting(
        "hospital-id",
        "setor-id",
        new Date("2025-01-15"),
        "09:00",
        "11:00",
      );

      expect(result).toEqual(vaga);
    });

    it("should exclude specific id when checking conflicts", async () => {
      mockPrisma.vaga.findFirst.mockResolvedValue(null);

      await repository.findConflicting(
        "hospital-id",
        "setor-id",
        new Date("2025-01-15"),
        "09:00",
        "11:00",
        "exclude-id",
      );

      expect(mockPrisma.vaga.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: { id: "exclude-id" },
          }),
        }),
      );
    });
  });

  describe("update", () => {
    it("should update vaga", async () => {
      const vaga = createVagaFixture({ horaInicio: "10:00" });
      mockPrisma.vaga.update.mockResolvedValue(vaga);

      const result = await repository.update("id", { horaInicio: "10:00" });

      expect(result).toEqual(vaga);
      expect(mockPrisma.vaga.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { horaInicio: "10:00" },
      });
    });
  });

  describe("delete", () => {
    it("should delete vaga", async () => {
      mockPrisma.vaga.update.mockResolvedValue({});

      await repository.delete("id");

      expect(mockPrisma.vaga.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
