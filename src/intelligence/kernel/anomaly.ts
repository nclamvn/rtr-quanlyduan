/**
 * SignalHub Kernel — Anomaly Detector (Welford's algorithm)
 */

import type { Signal, Severity } from './signal';

// ─── Config ──────────────────────────────────────────────────────────

export interface AnomalyConfig {
  baselineDimensions: string[][];
  thresholds: { low: number; medium: number; high: number; critical: number };
  minSamples: number;
  windowDays: number;
  seasonalWeekday: boolean;
  seasonalMonth: boolean;
}

export const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  baselineDimensions: [['signalType']],
  thresholds: { low: 1.5, medium: 2.0, high: 2.5, critical: 3.0 },
  minSamples: 10,
  windowDays: 90,
  seasonalWeekday: true,
  seasonalMonth: true,
};

// ─── Welford State ───────────────────────────────────────────────────

export interface WelfordState {
  count: number;
  mean: number;
  m2: number;
  lastUpdated: Date;
}

function newWelfordState(): WelfordState {
  return { count: 0, mean: 0, m2: 0, lastUpdated: new Date() };
}

function welfordUpdate(state: WelfordState, value: number): void {
  state.count++;
  const delta = value - state.mean;
  state.mean += delta / state.count;
  const delta2 = value - state.mean;
  state.m2 += delta * delta2;
  state.lastUpdated = new Date();
}

function welfordStdDev(state: WelfordState): number {
  if (state.count < 2) return 0;
  return Math.sqrt(state.m2 / (state.count - 1));
}

function zScore(value: number, state: WelfordState): number {
  const std = welfordStdDev(state);
  if (std === 0) return 0;
  return (value - state.mean) / std;
}

// ─── Anomaly Result ──────────────────────────────────────────────────

export interface AnomalyResult {
  baselineKey: string;
  signalType: string;
  observedValue: number;
  expectedValue: number;
  zScore: number;
  multiplier: number;
  severity: Severity;
  message: string;
  detectedAt: Date;
  dimensions: Record<string, string | number>;
}

// ─── Storage Interface ───────────────────────────────────────────────

export interface BaselineStore {
  get(key: string): WelfordState | undefined;
  set(key: string, state: WelfordState): void;
  keys(): string[];
}

export class InMemoryBaselineStore implements BaselineStore {
  private data = new Map<string, WelfordState>();

  get(key: string): WelfordState | undefined {
    return this.data.get(key);
  }

  set(key: string, state: WelfordState): void {
    this.data.set(key, state);
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }
}

// ─── Anomaly Detector ────────────────────────────────────────────────

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export class AnomalyDetector {
  private config: AnomalyConfig;
  private store: BaselineStore;
  private accumulators = new Map<string, { count: number; dimensions: Record<string, string | number>; signalType: string }>();

  constructor(config: Partial<AnomalyConfig> = {}, store?: BaselineStore) {
    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };
    this.store = store ?? new InMemoryBaselineStore();
  }

  record(signal: Signal): void {
    for (const dimKeys of this.config.baselineDimensions) {
      const accKey = this.buildAccumulatorKey(signal, dimKeys);
      if (!accKey) continue;

      const existing = this.accumulators.get(accKey);
      if (existing) {
        existing.count++;
      } else {
        const dims: Record<string, string | number> = {};
        for (const k of dimKeys) {
          if (k === 'signalType') dims[k] = signal.signalType;
          else if (signal.dimensions[k] !== undefined) dims[k] = signal.dimensions[k];
        }
        this.accumulators.set(accKey, {
          count: 1,
          dimensions: dims,
          signalType: signal.signalType,
        });
      }
    }
  }

  checkAndFlush(): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const now = new Date();

    for (const [accKey, acc] of this.accumulators) {
      const baselineKeys = this.buildBaselineKeys(accKey, now);

      for (const bKey of baselineKeys) {
        let state = this.store.get(bKey);
        if (!state) {
          state = newWelfordState();
        }

        welfordUpdate(state, acc.count);
        this.store.set(bKey, state);

        if (state.count >= this.config.minSamples) {
          const z = zScore(acc.count, state);

          if (z >= this.config.thresholds.low) {
            const severity = this.zScoreToSeverity(z);
            const mult = state.mean > 0 ? acc.count / state.mean : acc.count;

            anomalies.push({
              baselineKey: bKey,
              signalType: acc.signalType,
              observedValue: acc.count,
              expectedValue: Math.round(state.mean),
              zScore: Math.round(z * 100) / 100,
              multiplier: Math.round(mult * 10) / 10,
              severity,
              message: this.formatMessage(acc.signalType, acc.count, state.mean, mult, now),
              detectedAt: now,
              dimensions: acc.dimensions,
            });
          }
        }
      }
    }

    this.accumulators.clear();
    return anomalies.sort((a, b) => b.zScore - a.zScore);
  }

  getBaselineStats(): Array<{ key: string; mean: number; stdDev: number; samples: number }> {
    return this.store.keys().map((key) => {
      const state = this.store.get(key)!;
      return {
        key,
        mean: Math.round(state.mean * 100) / 100,
        stdDev: Math.round(welfordStdDev(state) * 100) / 100,
        samples: state.count,
      };
    });
  }

  reconfigure(config: Partial<AnomalyConfig>): void {
    Object.assign(this.config, config);
  }

  // ── Private ────────────────────────────────────────────────────────

  private buildAccumulatorKey(signal: Signal, dimKeys: string[]): string | null {
    const parts: string[] = [];
    for (const key of dimKeys) {
      if (key === 'signalType') {
        parts.push(signal.signalType);
      } else {
        const val = signal.dimensions[key];
        if (val === undefined) return null;
        parts.push(`${key}:${val}`);
      }
    }
    return parts.join('|');
  }

  private buildBaselineKeys(accKey: string, now: Date): string[] {
    const keys: string[] = [accKey];

    if (this.config.seasonalWeekday) {
      keys.push(`${accKey}@wd=${WEEKDAY_NAMES[now.getUTCDay()]}`);
    }
    if (this.config.seasonalMonth) {
      keys.push(`${accKey}@mo=${MONTH_NAMES[now.getUTCMonth()]}`);
    }

    return keys;
  }

  private zScoreToSeverity(z: number): Severity {
    if (z >= this.config.thresholds.critical) return 'critical';
    if (z >= this.config.thresholds.high) return 'high';
    if (z >= this.config.thresholds.medium) return 'medium';
    return 'low';
  }

  private formatMessage(
    signalType: string,
    count: number,
    mean: number,
    multiplier: number,
    now: Date,
  ): string {
    const weekday = WEEKDAY_NAMES[now.getUTCDay()];
    const month = MONTH_NAMES[now.getUTCMonth()];
    const mult = multiplier < 10 ? `${multiplier.toFixed(1)}x` : `${Math.round(multiplier)}x`;
    return `${signalType} ${mult} normal for ${weekday} (${month}) — ${count} vs baseline ${Math.round(mean)}`;
  }
}
