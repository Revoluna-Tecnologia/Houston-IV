import { describe, it, expect, vi, beforeEach } from "vitest";
import { HospitaisRepository } from "../hospitais.repository";
import {
  createHospitalFixture,
  createHospitalListFixture,
} from "../../__tests__/fixtures";

describe("HospitaisRepository", () => {
  let repository: HospitaisRepository;

  const mockPrisma = {
    notDeleted: () => ({ deletedAt: null }),
    softDeleteData: () => ({ deletedAt: new Date() }),
    hospital: {
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
    repository = new HospitaisRepository(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new hospital", async () => {
      const dto = { nome: "Novo Hospital", grupoId: "grupo-id" };
      const hospital = createHospitalFixture(dto);
      mockPrisma.hospital.create.mockResolvedValue(hospital);

      const result = await repository.create(dto);

      expect(result).toEqual(hospital);
      expect(mockPrisma.hospital.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe("findAll", () => {
    it("should return paginated hospitais", async () => {
      const hospitais = createHospitalListFixture(5);
      mockPrisma.hospital.findMany.mockResolvedValue(hospitais);
      mockPrisma.hospital.count.mockResolvedValue(5);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(hospitais);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
    });

    it("should apply ativo filter", async () => {
      mockPrisma.hospital.findMany.mockResolvedValue([]);
      mockPrisma.hospital.count.mockResolvedValue(0);

      await repository.findAll({ ativo: true });

      expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        }),
      );
    });

    it("should apply grupoId filter", async () => {
      mockPrisma.hospital.findMany.mockResolvedValue([]);
      mockPrisma.hospital.count.mockResolvedValue(0);

      await repository.findAll({ grupoId: "grupo-id" });

      expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ grupoId: "grupo-id" }),
        }),
      );
    });

    it("should apply search filter", async () => {
      mockPrisma.hospital.findMany.mockResolvedValue([]);
      mockPrisma.hospital.count.mockResolvedValue(0);

      await repository.findAll({ search: "Hospital" });

      expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.hospital.findMany.mockResolvedValue([]);
      mockPrisma.hospital.count.mockResolvedValue(0);

      const result = await repository.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return hospital by id", async () => {
      const hospital = createHospitalFixture({ id: "test-id" });
      mockPrisma.hospital.findFirst.mockResolvedValue(hospital);

      const result = await repository.findById("test-id");

      expect(result).toEqual(hospital);
      expect(mockPrisma.hospital.findFirst).toHaveBeenCalledWith({
        where: { id: "test-id", deletedAt: null },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.hospital.findFirst.mockResolvedValue(null);

      const result = await repository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findByCnpj", () => {
    it("should return hospital by cnpj", async () => {
      const hospital = createHospitalFixture({ cnpj: "12345678000199" });
      mockPrisma.hospital.findFirst.mockResolvedValue(hospital);

      const result = await repository.findByCnpj("12345678000199");

      expect(result).toEqual(hospital);
      expect(mockPrisma.hospital.findFirst).toHaveBeenCalledWith({
        where: { cnpj: "12345678000199", deletedAt: null },
      });
    });
  });

  describe("findByCnpjExcludingId", () => {
    it("should find by cnpj excluding specific id", async () => {
      mockPrisma.hospital.findFirst.mockResolvedValue(null);

      await repository.findByCnpjExcludingId("12345678000199", "exclude-id");

      expect(mockPrisma.hospital.findFirst).toHaveBeenCalledWith({
        where: {
          cnpj: "12345678000199",
          NOT: { id: "exclude-id" },
          deletedAt: null,
        },
      });
    });
  });

  describe("update", () => {
    it("should update hospital", async () => {
      const hospital = createHospitalFixture({ nome: "Updated" });
      mockPrisma.hospital.update.mockResolvedValue(hospital);

      const result = await repository.update("id", { nome: "Updated" });

      expect(result).toEqual(hospital);
      expect(mockPrisma.hospital.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { nome: "Updated" },
      });
    });
  });

  describe("delete", () => {
    it("should delete hospital", async () => {
      mockPrisma.hospital.update.mockResolvedValue({});

      await repository.delete("id");

      expect(mockPrisma.hospital.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
