import { describe, it, expect, vi, beforeEach } from "vitest";
import { GradesRepository } from "../grades.repository";
import {
  createGradeFixture,
  createTimeSlotFixture,
} from "../../__tests__/fixtures";

describe("GradesRepository", () => {
  let repository: GradesRepository;

  const mockPrisma = {
    notDeleted: () => ({ deletedAt: null }),
    softDeleteData: () => ({ deletedAt: new Date() }),
    grade: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    timeSlot: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    repository = new GradesRepository(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new grade", async () => {
      const dto = {
        nome: "Grade Janeiro",
        descricao: "Descricao",
        dataInicio: "2025-01-01",
        dataFim: "2025-01-31",
        hospitalId: "hospital-id",
        setorId: "setor-id",
      };
      const grade = createGradeFixture(dto);
      mockPrisma.grade.create.mockResolvedValue(grade);

      const result = await repository.create(dto);

      expect(result).toEqual(grade);
      expect(mockPrisma.grade.create).toHaveBeenCalledWith({
        data: {
          nome: dto.nome,
          descricao: dto.descricao,
          dataInicio: new Date(dto.dataInicio),
          dataFim: new Date(dto.dataFim),
          hospitalId: dto.hospitalId,
          setorId: dto.setorId,
        },
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated grades", async () => {
      const grades = [createGradeFixture(), createGradeFixture()];
      mockPrisma.grade.findMany.mockResolvedValue(grades);
      mockPrisma.grade.count.mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(grades);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it("should apply hospitalId filter", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);
      mockPrisma.grade.count.mockResolvedValue(0);

      await repository.findAll({ hospitalId: "hospital-id" });

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hospitalId: "hospital-id" }),
        }),
      );
    });

    it("should apply setorId filter", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);
      mockPrisma.grade.count.mockResolvedValue(0);

      await repository.findAll({ setorId: "setor-id" });

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ setorId: "setor-id" }),
        }),
      );
    });

    it("should apply status filter", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);
      mockPrisma.grade.count.mockResolvedValue(0);

      await repository.findAll({ status: "rascunho" });

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "rascunho" }),
        }),
      );
    });

    it("should apply date filters", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);
      mockPrisma.grade.count.mockResolvedValue(0);

      await repository.findAll({
        dataInicio: "2025-01-01",
        dataFim: "2025-01-31",
      });

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dataInicio: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-01-31"),
            },
          }),
        }),
      );
    });

    it("should use default pagination values", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);
      mockPrisma.grade.count.mockResolvedValue(0);

      const result = await repository.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe("findById", () => {
    it("should return grade by id with time slots", async () => {
      const grade = createGradeFixture({ id: "test-id" });
      mockPrisma.grade.findFirst.mockResolvedValue(grade);

      const result = await repository.findById("test-id");

      expect(result).toEqual(grade);
      expect(mockPrisma.grade.findFirst).toHaveBeenCalledWith({
        where: { id: "test-id", deletedAt: null },
        include: { timeSlots: true },
      });
    });

    it("should return null when not found", async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(null);

      const result = await repository.findById("invalid-id");

      expect(result).toBeNull();
    });
  });

  describe("findByHospitalAndSetor", () => {
    it("should return grades by hospital and setor", async () => {
      const grades = [createGradeFixture()];
      mockPrisma.grade.findMany.mockResolvedValue(grades);

      const result = await repository.findByHospitalAndSetor(
        "hospital-id",
        "setor-id",
      );

      expect(result).toEqual(grades);
      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith({
        where: {
          hospitalId: "hospital-id",
          setorId: "setor-id",
          deletedAt: null,
        },
      });
    });
  });

  describe("update", () => {
    it("should update grade", async () => {
      const grade = createGradeFixture({ nome: "Updated" });
      mockPrisma.grade.update.mockResolvedValue(grade);

      const result = await repository.update("id", { nome: "Updated" });

      expect(result).toEqual(grade);
      expect(mockPrisma.grade.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { nome: "Updated" },
      });
    });
  });

  describe("delete", () => {
    it("should delete grade", async () => {
      mockPrisma.grade.update.mockResolvedValue({});

      await repository.delete("id");

      expect(mockPrisma.grade.update).toHaveBeenCalledWith({
        where: { id: "id" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("addTimeSlots", () => {
    it("should add time slots to grade", async () => {
      const timeSlots = [
        { data: "2025-01-15", horaInicio: "08:00", horaFim: "12:00" },
        {
          data: "2025-01-16",
          horaInicio: "14:00",
          horaFim: "18:00",
          medicoId: "medico-id",
        },
      ];
      const createdSlots = [createTimeSlotFixture(), createTimeSlotFixture()];
      mockPrisma.timeSlot.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.timeSlot.findMany.mockResolvedValue(createdSlots);

      const result = await repository.addTimeSlots("grade-id", timeSlots);

      expect(result).toEqual(createdSlots);
      expect(mockPrisma.timeSlot.createMany).toHaveBeenCalledWith({
        data: [
          {
            gradeId: "grade-id",
            data: new Date("2025-01-15"),
            horaInicio: "08:00",
            horaFim: "12:00",
            medicoId: null,
          },
          {
            gradeId: "grade-id",
            data: new Date("2025-01-16"),
            horaInicio: "14:00",
            horaFim: "18:00",
            medicoId: "medico-id",
          },
        ],
      });
    });
  });

  describe("getTimeSlots", () => {
    it("should return time slots for grade", async () => {
      const timeSlots = [createTimeSlotFixture(), createTimeSlotFixture()];
      mockPrisma.timeSlot.findMany.mockResolvedValue(timeSlots);

      const result = await repository.getTimeSlots("grade-id");

      expect(result).toEqual(timeSlots);
      expect(mockPrisma.timeSlot.findMany).toHaveBeenCalledWith({
        where: { gradeId: "grade-id" },
      });
    });
  });
});
