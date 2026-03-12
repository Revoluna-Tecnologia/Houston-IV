import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthController } from "../health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  const mockHealthCheckService = {
    check: vi.fn(),
  };

  const mockPrismaHealthIndicator = {
    isHealthy: vi.fn(),
  };

  const mockDiskHealthIndicator = {
    checkStorage: vi.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: vi.fn(),
  };

  beforeEach(() => {
    controller = new HealthController(
      mockHealthCheckService as any,
      mockPrismaHealthIndicator as any,
      mockDiskHealthIndicator as any,
      mockMemoryHealthIndicator as any,
    );
  });

  describe("live", () => {
    it("should return status ok", () => {
      const result = controller.live();
      expect(result.status).toBe("ok");
    });
  });

  describe("check", () => {
    it("should call health check service with indicators", async () => {
      mockHealthCheckService.check.mockResolvedValue({
        status: "ok",
        details: {},
      });

      await controller.check();

      expect(mockHealthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Function)]),
      );
    });
  });

  describe("ready", () => {
    it("should call health check service with database indicator", async () => {
      mockHealthCheckService.check.mockResolvedValue({
        status: "ok",
        details: {},
      });

      await controller.ready();

      expect(mockHealthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Function)]),
      );
    });
  });
});
