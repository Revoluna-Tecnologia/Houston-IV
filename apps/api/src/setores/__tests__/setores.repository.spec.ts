import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetoresRepository } from "../setores.repository";
import {
  createSetorFixture,
  createSetorListFixture,
} from "../../__tests__/fixtures";

describe("SetoresRepository", () => {
  let repository: SetoresRepository;

  const mockPrisma = {
    notDeleted: () => ({ deletedAt: null }),
    softDeleteData: () => ({ deletedAt: new Date() }),
    setor: {
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
    repository = new SetoresRepository(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new setor", async () => {
      const dto = {
        nome: "UTI",
        descricao: "Unidade de Terapia Intensiva",
        hospitalId: "hospital-id",
      };
      const setor = createSetorFixture(dto);
      mockPrisma.setor.create.mockResolvedValue(setor);

      const result = await repository.create(dto);

      expect(result).toEqual(setor);
      expect(mockPrisma.setor.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe("findAll", () => {
    it("should return paginated setores", async () => {
      const hospitalId = "hospital-id";
      const setores = createSetorListFixture(5, hospitalId);
      mockPrisma.setor.findMany.mockResolvedValue(setores);
      mockPrisma.setor.count.mockResolvedValue(5);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(setores);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
    });

    it("should apply ativo filter", async () => {
      mockPrisma.setor.findMany.mockResolvedValue([]);
      mockPrisma.setor.count.mockResolvedValue(0);

      await repository.findAll({ ativo: true });

      expect(mockPrisma.setor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        }),
      );
    });

    it("should apply hospitalId filter", async () => {
      mockPrisma.setor.findMany.mockResolvedValue([]);
      mockPrisma.setor.count.mockResolvedValue(0);

      await repository.findAll({ hospitalId: "hospital-id" });

      expect(mockPrisma.setor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hospitalId: "hospital-id" }),
        }),
      );
    });

    it("should apply search filter", async () => {
      mockPrisma.setor.findMany.mockResolvedValue([]);
      mockPrisma.setor.count.mockResolvedValue(0);

      await repository.findAll({ search: "UTI" });

      expect(mockPrisma.setor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.setor.findMany.mockResolvedValue([]);
      mockPrisma.setor.count.mockResolvedValue(0);

      const result = await repository.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return setor by id", async () => {
      const setor = createSetorFixture({ id: "test-id" });
      mockPrisma.setor.findFirst.mockResolvedValue(setor);

      const result = await repository.findById("test-id");

      expect(result).toEqual(setor);
      expect(mockPrisma.setor.findFirst).toHaveBeenCalledWith({
        where: { id: "test-id", deletedAt: null },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.setor.findFirst.mockResolvedValue(null);

      const result = await repository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findByNomeAndHospital", () => {
    it("should return setor by nome and hospitalId", async () => {
      const setor = createSetorFixture({
        nome: "UTI",
        hospitalId: "hospital-id",
      });
      mockPrisma.setor.findFirst.mockResolvedValue(setor);

      const result = await repository.findByNomeAndHospital(
        "UTI",
        "hospital-id",
      );

      expect(result).toEqual(setor);
    });
  });

  describe("findByNomeAndHospitalExcludingId", () => {
    it("should find by nome and hospitalId excluding specific id", async () => {
      mockPrisma.setor.findFirst.mockResolvedValue(null);

      await repository.findByNomeAndHospitalExcludingId(
        "UTI",
        "hospital-id",
        "exclude-id",
      );

      expect(mockPrisma.setor.findFirst).toHaveBeenCalledWith({
        where: {
          nome: "UTI",
          hospitalId: "hospital-id",
          NOT: { id: "exclude-id" },
          deletedAt: null,
        },
      });
    });
  });

  describe("update", () => {
    it("should update setor", async () => {
      const setor = createSetorFixture({ nome: "Updated" });
      mockPrisma.setor.update.mockResolvedValue(setor);

      const result = await repository.update("id", { nome: "Updated" });

      expect(result).toEqual(setor);
      expect(mockPrisma.setor.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { nome: "Updated" },
      });
    });
  });

  describe("delete", () => {
    it("should delete setor", async () => {
      mockPrisma.setor.update.mockResolvedValue({});

      await repository.delete("id");

      expect(mockPrisma.setor.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
