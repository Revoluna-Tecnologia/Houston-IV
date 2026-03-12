import { describe, it, expect, vi, beforeEach } from "vitest";
import { EspecialidadesRepository } from "../especialidades.repository";
import {
  createEspecialidadeFixture,
  createEspecialidadeListFixture,
} from "../../__tests__/fixtures";

describe("EspecialidadesRepository", () => {
  let repository: EspecialidadesRepository;

  const mockPrisma = {
    notDeleted: () => ({ deletedAt: null }),
    softDeleteData: () => ({ deletedAt: new Date() }),
    especialidade: {
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
    repository = new EspecialidadesRepository(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new especialidade", async () => {
      const dto = { nome: "Cardiologia", sigla: "CARD", cor: "#FF5733" };
      const especialidade = createEspecialidadeFixture(dto);
      mockPrisma.especialidade.create.mockResolvedValue(especialidade);

      const result = await repository.create(dto);

      expect(result).toEqual(especialidade);
      expect(mockPrisma.especialidade.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated especialidades", async () => {
      const especialidades = createEspecialidadeListFixture(5);
      mockPrisma.especialidade.findMany.mockResolvedValue(especialidades);
      mockPrisma.especialidade.count.mockResolvedValue(5);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(especialidades);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
    });

    it("should apply ativo filter", async () => {
      mockPrisma.especialidade.findMany.mockResolvedValue([]);
      mockPrisma.especialidade.count.mockResolvedValue(0);

      await repository.findAll({ ativo: true });

      expect(mockPrisma.especialidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        }),
      );
    });

    it("should apply search filter", async () => {
      mockPrisma.especialidade.findMany.mockResolvedValue([]);
      mockPrisma.especialidade.count.mockResolvedValue(0);

      await repository.findAll({ search: "Cardio" });

      expect(mockPrisma.especialidade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.especialidade.findMany.mockResolvedValue([]);
      mockPrisma.especialidade.count.mockResolvedValue(0);

      const result = await repository.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return especialidade by id", async () => {
      const especialidade = createEspecialidadeFixture({ id: "test-id" });
      mockPrisma.especialidade.findFirst.mockResolvedValue(especialidade);

      const result = await repository.findById("test-id");

      expect(result).toEqual(especialidade);
      expect(mockPrisma.especialidade.findFirst).toHaveBeenCalledWith({
        where: { id: "test-id", deletedAt: null },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.especialidade.findFirst.mockResolvedValue(null);

      const result = await repository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findByNome", () => {
    it("should return especialidade by nome", async () => {
      const especialidade = createEspecialidadeFixture({ nome: "Cardiologia" });
      mockPrisma.especialidade.findFirst.mockResolvedValue(especialidade);

      const result = await repository.findByNome("Cardiologia");

      expect(result).toEqual(especialidade);
    });
  });

  describe("findByNomeExcludingId", () => {
    it("should find by nome excluding specific id", async () => {
      mockPrisma.especialidade.findFirst.mockResolvedValue(null);

      await repository.findByNomeExcludingId("Cardiologia", "exclude-id");

      expect(mockPrisma.especialidade.findFirst).toHaveBeenCalledWith({
        where: {
          nome: "Cardiologia",
          NOT: { id: "exclude-id" },
          deletedAt: null,
        },
      });
    });
  });

  describe("update", () => {
    it("should update especialidade", async () => {
      const especialidade = createEspecialidadeFixture({ nome: "Neurologia" });
      mockPrisma.especialidade.update.mockResolvedValue(especialidade);

      const result = await repository.update("id", { nome: "Neurologia" });

      expect(result).toEqual(especialidade);
      expect(mockPrisma.especialidade.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { nome: "Neurologia" },
      });
    });
  });

  describe("delete", () => {
    it("should delete especialidade", async () => {
      mockPrisma.especialidade.update.mockResolvedValue({});

      await repository.delete("id");

      expect(mockPrisma.especialidade.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
