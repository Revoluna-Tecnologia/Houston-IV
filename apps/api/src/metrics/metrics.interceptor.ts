import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Request, Response } from "express";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const stopTimer = this.metricsService.httpRequestDuration.startTimer();

    this.metricsService.activeConnections.inc();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<Response>();
          const route = request.route?.path || request.path;
          const labels = {
            method: request.method,
            route,
            status_code: String(response.statusCode),
          };
          stopTimer(labels);
          this.metricsService.httpRequestTotal.inc(labels);
          this.metricsService.activeConnections.dec();
        },
        error: () => {
          const response = ctx.getResponse<Response>();
          const route = request.route?.path || request.path;
          const labels = {
            method: request.method,
            route,
            status_code: String(response.statusCode || 500),
          };
          stopTimer(labels);
          this.metricsService.httpRequestTotal.inc(labels);
          this.metricsService.httpErrorTotal.inc(labels);
          this.metricsService.activeConnections.dec();
        },
      }),
    );
  }
}
