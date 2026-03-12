import { CircuitBreakerService } from "../circuit-breaker.service";

describe("CircuitBreakerService", () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    service = new CircuitBreakerService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a circuit breaker", () => {
    const action = async () => "success";
    const breaker = service.create("test", action);
    expect(breaker).toBeDefined();
  });

  it("should retrieve created breaker by name", () => {
    const action = async () => "success";
    service.create("test", action);
    const breaker = service.get("test");
    expect(breaker).toBeDefined();
  });

  it("should return undefined for unknown breaker", () => {
    expect(service.get("unknown")).toBeUndefined();
  });

  it("should execute action through breaker", async () => {
    const action = async (x: number) => x * 2;
    const breaker = service.create("multiply", action);
    const result = await breaker.fire(5);
    expect(result).toBe(10);
  });

  it("should return stats for all breakers", () => {
    service.create("breaker1", async () => "a");
    service.create("breaker2", async () => "b");
    const stats = service.getStats();
    expect(stats).toHaveProperty("breaker1");
    expect(stats).toHaveProperty("breaker2");
    expect(stats.breaker1.state).toBe("closed");
  });
});
