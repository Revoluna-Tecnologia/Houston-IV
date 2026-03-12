import { MetricsService } from "../metrics.service";

describe("MetricsService", () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
    service.onModuleInit();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should have all metric instances", () => {
    expect(service.httpRequestDuration).toBeDefined();
    expect(service.httpRequestTotal).toBeDefined();
    expect(service.httpErrorTotal).toBeDefined();
    expect(service.activeConnections).toBeDefined();
  });

  it("should return metrics string", async () => {
    const metrics = await service.getMetrics();
    expect(typeof metrics).toBe("string");
    expect(metrics).toContain("http_request_duration_seconds");
    expect(metrics).toContain("http_requests_total");
    expect(metrics).toContain("process_cpu_"); // default metrics
  });

  it("should increment request counter", async () => {
    service.httpRequestTotal.inc({
      method: "GET",
      route: "/test",
      status_code: "200",
    });
    const metrics = await service.getMetrics();
    expect(metrics).toContain("http_requests_total");
  });

  it("should track active connections", async () => {
    service.activeConnections.inc();
    service.activeConnections.inc();
    service.activeConnections.dec();
    const metrics = await service.getMetrics();
    expect(metrics).toContain("http_active_connections 1");
  });
});
