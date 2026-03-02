/**
 * SignalHub Kernel — Freshness Tracker
 */

export type FreshnessStatus = 'fresh' | 'stale' | 'very_stale' | 'no_data' | 'error' | 'disabled';

export interface SourceHealth {
  sourceId: string;
  name: string;
  status: FreshnessStatus;
  lastUpdate: Date | null;
  lastError: string | null;
  signalCount: number;
  enabled: boolean;
  dependentIndexes: string[];
}

export interface FreshnessSummary {
  totalSources: number;
  fresh: number;
  stale: number;
  error: number;
  disabled: number;
  overallHealth: 'healthy' | 'degraded' | 'critical';
  coveragePercent: number;
  degradedDecisions: Array<{
    indexId: string;
    reason: string;
    staleSources: string[];
  }>;
}

export interface FreshnessConfig {
  freshThresholdMs: number;
  staleThresholdMs: number;
  veryStaleThresholdMs: number;
}

const DEFAULT_CONFIG: FreshnessConfig = {
  freshThresholdMs: 15 * 60 * 1000,
  staleThresholdMs: 2 * 60 * 60 * 1000,
  veryStaleThresholdMs: 6 * 60 * 60 * 1000,
};

export class FreshnessTracker {
  private sources = new Map<string, SourceHealth>();
  private config: FreshnessConfig;
  private sourceSignalTypes = new Map<string, string[]>();
  private indexDependencies = new Map<string, string[]>();

  constructor(config?: Partial<FreshnessConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  registerSource(sourceId: string, name: string, signalTypes: string[], enabled = true): void {
    this.sources.set(sourceId, {
      sourceId,
      name,
      status: enabled ? 'no_data' : 'disabled',
      lastUpdate: null,
      lastError: null,
      signalCount: 0,
      enabled,
      dependentIndexes: [],
    });
    this.sourceSignalTypes.set(sourceId, signalTypes);
    this.recomputeDependencies();
  }

  registerIndex(indexId: string, signalTypes: string[]): void {
    this.indexDependencies.set(indexId, signalTypes);
    this.recomputeDependencies();
  }

  recordSuccess(sourceId: string, signalCount: number): void {
    const source = this.sources.get(sourceId);
    if (!source) return;
    source.lastUpdate = new Date();
    source.signalCount = signalCount;
    source.lastError = null;
    source.status = 'fresh';
  }

  recordError(sourceId: string, error: string): void {
    const source = this.sources.get(sourceId);
    if (!source) return;
    source.lastError = error;
    source.status = 'error';
  }

  refresh(): void {
    const now = Date.now();
    for (const source of this.sources.values()) {
      if (!source.enabled) {
        source.status = 'disabled';
        continue;
      }
      if (source.status === 'error') continue;
      if (!source.lastUpdate) {
        source.status = 'no_data';
        continue;
      }
      const age = now - source.lastUpdate.getTime();
      if (age < this.config.freshThresholdMs) source.status = 'fresh';
      else if (age < this.config.staleThresholdMs) source.status = 'stale';
      else source.status = 'very_stale';
    }
  }

  getAllHealth(): SourceHealth[] {
    this.refresh();
    return Array.from(this.sources.values());
  }

  getSummary(): FreshnessSummary {
    this.refresh();

    let fresh = 0, stale = 0, error = 0, disabled = 0;
    const staleSources: string[] = [];

    for (const source of this.sources.values()) {
      switch (source.status) {
        case 'fresh': fresh++; break;
        case 'stale':
        case 'very_stale':
        case 'no_data':
          stale++;
          staleSources.push(source.sourceId);
          break;
        case 'error': error++; staleSources.push(source.sourceId); break;
        case 'disabled': disabled++; break;
      }
    }

    const total = this.sources.size;
    const active = total - disabled;
    const coverage = active > 0 ? Math.round((fresh / active) * 100) : 0;

    const degradedDecisions: FreshnessSummary['degradedDecisions'] = [];
    const staleSignalTypes = new Set<string>();

    for (const sourceId of staleSources) {
      const types = this.sourceSignalTypes.get(sourceId) ?? [];
      types.forEach((t) => staleSignalTypes.add(t));
    }

    for (const [indexId, requiredTypes] of this.indexDependencies) {
      const affectedTypes = requiredTypes.filter((t) => staleSignalTypes.has(t));
      if (affectedTypes.length > 0) {
        const affectedSources = staleSources.filter((sid) => {
          const types = this.sourceSignalTypes.get(sid) ?? [];
          return types.some((t) => affectedTypes.includes(t));
        });
        degradedDecisions.push({
          indexId,
          reason: `Signal types [${affectedTypes.join(', ')}] are stale`,
          staleSources: affectedSources,
        });
      }
    }

    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (coverage >= 80 && error === 0) overallHealth = 'healthy';
    else if (coverage >= 50) overallHealth = 'degraded';
    else overallHealth = 'critical';

    return {
      totalSources: total,
      fresh,
      stale,
      error,
      disabled,
      overallHealth,
      coveragePercent: coverage,
      degradedDecisions,
    };
  }

  private recomputeDependencies(): void {
    for (const source of this.sources.values()) {
      source.dependentIndexes = [];
      const types = this.sourceSignalTypes.get(source.sourceId) ?? [];

      for (const [indexId, requiredTypes] of this.indexDependencies) {
        if (types.some((t) => requiredTypes.includes(t))) {
          source.dependentIndexes.push(indexId);
        }
      }
    }
  }
}
