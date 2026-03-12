import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
  Gauge,
} from "prom-client";

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestDuration: Histogram;
  readonly httpRequestTotal: Counter;
  readonly httpErrorTotal: Counter;
  readonly activeConnections: Gauge;

  constructor() {
    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"] as const,
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"] as const,
      registers: [this.registry],
    });

    this.httpErrorTotal = new Counter({
      name: "http_errors_total",
      help: "Total number of HTTP errors",
      labelNames: ["method", "route", "status_code"] as const,
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: "http_active_connections",
      help: "Number of active HTTP connections",
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
