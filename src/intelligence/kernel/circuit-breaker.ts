/**
 * SignalHub Kernel — Circuit Breaker
 */

export type BreakerState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  name: string;
  maxFailures: number;
  cooldownMs: number;
  cacheTtlMs: number;
}

const DEFAULTS: CircuitBreakerConfig = {
  name: 'unnamed',
  maxFailures: 2,
  cooldownMs: 5 * 60 * 1000,
  cacheTtlMs: 10 * 60 * 1000,
};

export class CircuitBreaker<T> {
  private config: CircuitBreakerConfig;
  private failures = 0;
  private cooldownUntil = 0;
  private cache: { data: T; timestamp: number } | null = null;
  private lastError?: string;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = { ...DEFAULTS, ...config };
  }

  get state(): BreakerState {
    if (this.failures >= this.config.maxFailures) {
      return Date.now() < this.cooldownUntil ? 'open' : 'half_open';
    }
    return 'closed';
  }

  get isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.config.cacheTtlMs;
  }

  async execute(fn: () => Promise<T>): Promise<{ data: T; fromCache: boolean }> {
    if (this.state === 'open') {
      if (this.cache) {
        return { data: this.cache.data, fromCache: true };
      }
      throw new Error(`[CircuitBreaker:${this.config.name}] Circuit open, no cache available`);
    }

    try {
      const data = await fn();
      this.onSuccess(data);
      return { data, fromCache: false };
    } catch (error) {
      this.onFailure(error);
      if (this.cache) {
        return { data: this.cache.data, fromCache: true };
      }
      throw error;
    }
  }

  setCache(data: T): void {
    this.cache = { data, timestamp: Date.now() };
  }

  getStatus(): {
    name: string;
    state: BreakerState;
    failures: number;
    hasCachedData: boolean;
    cacheAge: number | null;
    lastError?: string;
  } {
    return {
      name: this.config.name,
      state: this.state,
      failures: this.failures,
      hasCachedData: !!this.cache,
      cacheAge: this.cache ? Date.now() - this.cache.timestamp : null,
      lastError: this.lastError,
    };
  }

  reset(): void {
    this.failures = 0;
    this.cooldownUntil = 0;
    this.lastError = undefined;
  }

  private onSuccess(data: T): void {
    this.failures = 0;
    this.cooldownUntil = 0;
    this.cache = { data, timestamp: Date.now() };
    this.lastError = undefined;
  }

  private onFailure(error: unknown): void {
    this.failures++;
    this.lastError = error instanceof Error ? error.message : String(error);

    if (this.failures >= this.config.maxFailures) {
      this.cooldownUntil = Date.now() + this.config.cooldownMs;
    }
  }
}
