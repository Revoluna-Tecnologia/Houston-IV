import { describe, it, expect, vi, beforeEach } from "vitest";
import { CandidaturasController } from "../candidaturas.controller";
import {
  createCandidaturaFixture,
  createCandidaturaListFixture,
} from "../../__tests__/fixtures";

describe("CandidaturasController", () => {
  let controller: CandidaturasController;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    controller = new CandidaturasController(mockService as never);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new candidatura", async () => {
      const dto = { vagaId: "vaga-id", medicoId: "medico-id" };
      const candidatura = createCandidaturaFixture(dto);
      mockService.create.mockResolvedValue(candidatura);

      const result = await controller.create(dto);

      expect(result).toEqual(candidatura);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("should return paginated candidaturas", async () => {
      const candidaturas = createCandidaturaListFixture(3);
      const response = {
        data: candidaturas,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(response);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(response);
    });
  });

  describe("findOne", () => {
    it("should return candidatura by id", async () => {
      const candidatura = createCandidaturaFixture({ id: "test-id" });
      mockService.findOne.mockResolvedValue(candidatura);

      const result = await controller.findOne("test-id");

      expect(result).toEqual(candidatura);
      expect(mockService.findOne).toHaveBeenCalledWith("test-id");
    });
  });

  describe("approve", () => {
    it("should approve candidatura", async () => {
      const candidatura = createCandidaturaFixture({
        id: "test-id",
        status: "aprovada",
      });
      mockService.approve.mockResolvedValue(candidatura);

      const result = await controller.approve("test-id");

      expect(result).toEqual(candidatura);
      expect(mockService.approve).toHaveBeenCalledWith("test-id");
    });
  });

  describe("reject", () => {
    it("should reject candidatura", async () => {
      const candidatura = createCandidaturaFixture({
        id: "test-id",
        status: "rejeitada",
      });
      mockService.reject.mockResolvedValue(candidatura);

      const result = await controller.reject("test-id");

      expect(result).toEqual(candidatura);
      expect(mockService.reject).toHaveBeenCalledWith("test-id");
    });
  });

  describe("remove", () => {
    it("should remove candidatura", async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove("test-id");

      expect(mockService.remove).toHaveBeenCalledWith("test-id");
    });
  });
});
