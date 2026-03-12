import { Injectable, Logger } from "@nestjs/common";
import CircuitBreaker from "opossum";

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

const DEFAULTS: CircuitBreakerOptions = {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, CircuitBreaker>();

  create<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker {
    const opts = { ...DEFAULTS, ...options };
    const breaker = new CircuitBreaker(action, {
      timeout: opts.timeout,
      errorThresholdPercentage: opts.errorThresholdPercentage,
      resetTimeout: opts.resetTimeout,
      volumeThreshold: opts.volumeThreshold,
    });

    breaker.on("open", () =>
      this.logger.warn(
        `Circuit breaker '${name}' OPENED — requests will be rejected`,
      ),
    );
    breaker.on("halfOpen", () =>
      this.logger.log(`Circuit breaker '${name}' HALF-OPEN — testing recovery`),
    );
    breaker.on("close", () =>
      this.logger.log(`Circuit breaker '${name}' CLOSED — back to normal`),
    );
    breaker.on("fallback", () =>
      this.logger.debug(`Circuit breaker '${name}' fallback triggered`),
    );

    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = {
        state: breaker.opened
          ? "open"
          : breaker.halfOpen
            ? "half-open"
            : "closed",
        stats: breaker.stats,
      };
    }
    return stats;
  }
}
