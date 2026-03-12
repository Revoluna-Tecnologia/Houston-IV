import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { CorrelationIdMiddleware } from "../correlation-id.middleware";
import { Request, Response } from "express";

describe("CorrelationIdMiddleware", () => {
  let middleware: CorrelationIdMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockReq = { headers: {} };
    mockRes = { setHeader: vi.fn() };
    mockNext = vi.fn();
  });

  it("should generate correlation ID if not present", () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers!["x-correlation-id"]).toBeDefined();
    expect(typeof mockReq.headers!["x-correlation-id"]).toBe("string");
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "x-correlation-id",
      expect.any(String),
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it("should preserve existing correlation ID", () => {
    mockReq.headers = { "x-correlation-id": "existing-id" };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers["x-correlation-id"]).toBe("existing-id");
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "x-correlation-id",
      "existing-id",
    );
    expect(mockNext).toHaveBeenCalled();
  });
});
