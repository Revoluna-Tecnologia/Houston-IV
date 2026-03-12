import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaHealthIndicator } from "./prisma-health.indicator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: "Status detalhado da API (DB, disk, memory)" })
  @ApiResponse({ status: 200, description: "API está saudável" })
  @ApiResponse({ status: 503, description: "API não está saudável" })
  check() {
    return this.health.check([
      () => this.db.isHealthy("database"),
      () =>
        this.disk.checkStorage("storage", { path: "/", thresholdPercent: 0.9 }),
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024), // 300MB
    ]);
  }

  @Get("live")
  @Public()
  @ApiOperation({
    summary: "Liveness probe — sempre 200 se o processo está rodando",
  })
  @ApiResponse({ status: 200, description: "Processo vivo" })
  live() {
    return { status: "ok" };
  }

  @Get("ready")
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: "Readiness probe — verifica dependências externas" })
  @ApiResponse({ status: 200, description: "API pronta para receber tráfego" })
  @ApiResponse({ status: 503, description: "API não está pronta" })
  ready() {
    return this.health.check([() => this.db.isHealthy("database")]);
  }
}
