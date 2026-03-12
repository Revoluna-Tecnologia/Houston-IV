import { describe, it, expect, vi, beforeEach } from "vitest";
import { RelatoriosService } from "../relatorios.service";
import {
  createMedicoFixture,
  createHospitalFixture,
} from "../../__tests__/fixtures";
import { Prisma } from "../../generated/prisma/client";
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

describe("RelatoriosService", () => {
  let service: RelatoriosService;

  const mockPrisma = {
    pagamento: { findMany: vi.fn() },
    grade: { findMany: vi.fn() },
    checkinCheckout: { findMany: vi.fn() },
    hospital: { findMany: vi.fn() },
    setor: { findMany: vi.fn() },
    medico: { findMany: vi.fn() },
    vaga: { findMany: vi.fn() },
  };

  beforeEach(() => {
    service = new RelatoriosService(mockPrisma as never);
    vi.clearAllMocks();
  });

  describe("getFolhaPagamento", () => {
    it("should return empty array when no pagamentos", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);

      const result = await service.getFolhaPagamento({});

      expect(result).toEqual([]);
    });

    it("should aggregate pagamentos by medico", async () => {
      const medico = createMedicoFixture({ id: "medico-1", nome: "Dr. Teste" });
      mockPrisma.pagamento.findMany.mockResolvedValue([
        {
          id: "pag-1",
          vagaId: "vaga-1",
          medicoId: "medico-1",
          valor: new Decimal(1000),
          status: "pendente",
          medico,
          vaga: {
            data: new Date("2025-01-15"),
            horaInicio: "08:00",
            horaFim: "12:00",
          },
        },
        {
          id: "pag-2",
          vagaId: "vaga-2",
          medicoId: "medico-1",
          valor: new Decimal(1500),
          status: "pago",
          medico,
          vaga: {
            data: new Date("2025-01-16"),
            horaInicio: "14:00",
            horaFim: "18:00",
          },
        },
      ]);

      const result = await service.getFolhaPagamento({});

      expect(result).toHaveLength(1);
      expect(result[0].medicoId).toBe("medico-1");
      expect(result[0].totalVagas).toBe(2);
      expect(result[0].totalHoras).toBe(8);
      expect(result[0].valorTotal).toBe(2500);
      expect(result[0].pagamentos).toHaveLength(2);
    });

    it("should filter by medicoId", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);

      await service.getFolhaPagamento({ medicoId: "medico-1" });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicoId: "medico-1" }),
        }),
      );
    });

    it("should filter by date range", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);

      await service.getFolhaPagamento({
        dataInicio: "2025-01-01",
        dataFim: "2025-01-31",
      });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vaga: expect.objectContaining({
              data: {
                gte: new Date("2025-01-01"),
                lte: new Date("2025-01-31"),
              },
            }),
          }),
        }),
      );
    });

    it("should filter by hospitalId", async () => {
      mockPrisma.pagamento.findMany.mockResolvedValue([]);

      await service.getFolhaPagamento({ hospitalId: "hospital-1" });

      expect(mockPrisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vaga: expect.objectContaining({ hospitalId: "hospital-1" }),
          }),
        }),
      );
    });
  });

  describe("getGrades", () => {
    it("should return empty array when no grades", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      const result = await service.getGrades({});

      expect(result).toEqual([]);
    });

    it("should return grades with slot statistics", async () => {
      const hospital = createHospitalFixture({ nome: "Hospital A" });
      mockPrisma.grade.findMany.mockResolvedValue([
        {
          id: "grade-1",
          nome: "Grade Janeiro",
          dataInicio: new Date("2025-01-01"),
          dataFim: new Date("2025-01-31"),
          hospital,
          setor: { nome: "UTI" },
          timeSlots: [
            { id: "slot-1", medicoId: "medico-1" },
            { id: "slot-2", medicoId: null },
            { id: "slot-3", medicoId: "medico-2" },
          ],
        },
      ]);

      const result = await service.getGrades({});

      expect(result).toHaveLength(1);
      expect(result[0].gradeId).toBe("grade-1");
      expect(result[0].totalSlots).toBe(3);
      expect(result[0].slotsPreenchidos).toBe(2);
      expect(result[0].slotsVazios).toBe(1);
    });

    it("should filter by hospitalId", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      await service.getGrades({ hospitalId: "hospital-1" });

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hospitalId: "hospital-1" }),
        }),
      );
    });

    it("should filter by setorId", async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      await service.getGrades({ setorId: "setor-1" });

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ setorId: "setor-1" }),
        }),
      );
    });
  });

  describe("getProdutividade", () => {
    it("should return empty array when no checkins", async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([]);

      const result = await service.getProdutividade({});

      expect(result).toEqual([]);
    });

    it("should calculate productivity metrics", async () => {
      const medico = createMedicoFixture({ id: "medico-1", nome: "Dr. Teste" });
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([
        {
          id: "check-1",
          medicoId: "medico-1",
          checkinAt: new Date(),
          medico,
          vaga: {
            horaInicio: "08:00",
            horaFim: "12:00",
            valor: new Decimal(1000),
          },
        },
        {
          id: "check-2",
          medicoId: "medico-1",
          checkinAt: null,
          medico,
          vaga: {
            horaInicio: "14:00",
            horaFim: "18:00",
            valor: new Decimal(1000),
          },
        },
      ]);

      const result = await service.getProdutividade({});

      expect(result).toHaveLength(1);
      expect(result[0].medicoId).toBe("medico-1");
      expect(result[0].vagasRealizadas).toBe(1);
      expect(result[0].horasTrabalhadas).toBe(4);
      expect(result[0].taxaPresenca).toBe(50);
      expect(result[0].valorRecebido).toBe(1000);
    });

    it("should filter by medicoId", async () => {
      mockPrisma.checkinCheckout.findMany.mockResolvedValue([]);

      await service.getProdutividade({ medicoId: "medico-1" });

      expect(mockPrisma.checkinCheckout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicoId: "medico-1" }),
        }),
      );
    });
  });

  describe("getFiltrosDisponiveis", () => {
    it("should return available filters", async () => {
      mockPrisma.hospital.findMany.mockResolvedValue([
        { id: "h1", nome: "Hospital A" },
      ]);
      mockPrisma.setor.findMany.mockResolvedValue([{ id: "s1", nome: "UTI" }]);
      mockPrisma.medico.findMany.mockResolvedValue([
        { id: "m1", nome: "Dr. Teste" },
      ]);
      mockPrisma.vaga.findMany.mockResolvedValue([
        { data: new Date("2025-01-15") },
        { data: new Date("2025-02-10") },
      ]);

      const result = await service.getFiltrosDisponiveis();

      expect(result.hospitais).toHaveLength(1);
      expect(result.setores).toHaveLength(1);
      expect(result.medicos).toHaveLength(1);
      expect(result.meses).toHaveLength(2);
    });

    it("should deduplicate months", async () => {
      mockPrisma.hospital.findMany.mockResolvedValue([]);
      mockPrisma.setor.findMany.mockResolvedValue([]);
      mockPrisma.medico.findMany.mockResolvedValue([]);
      mockPrisma.vaga.findMany.mockResolvedValue([
        { data: new Date("2025-01-05T12:00:00Z") },
        { data: new Date("2025-01-15T12:00:00Z") },
        { data: new Date("2025-01-25T12:00:00Z") },
      ]);

      const result = await service.getFiltrosDisponiveis();

      expect(result.meses).toHaveLength(1);
      expect(result.meses[0].valor).toBe("2025-01");
    });
  });
});
