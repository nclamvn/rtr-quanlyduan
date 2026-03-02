/**
 * SignalHub Kernel — Composite Scoring Engine (Index Builder)
 */

import type { Signal, Severity, SignalStore, SignalFilter } from './signal';

// ─── Config ──────────────────────────────────────────────────────────

export type AggregationMethod =
  | 'count'
  | 'count_weighted'
  | 'sum_value'
  | 'avg_value'
  | 'max_value'
  | 'ratio_vs_target'
  | 'latest_value';

export interface IndexComponentConfig {
  id: string;
  weight: number;
  signalTypes: string[];
  aggregation: AggregationMethod;
  windowMs: number;
  scaling: 'linear' | 'logarithmic';
  invert: boolean;
  target?: number;
  severityWeights?: Record<Severity, number>;
  range: [number, number];
}

export interface IndexModifier {
  condition: {
    signalFilter?: SignalFilter;
    scoreAbove?: number;
    scoreBelow?: number;
  };
  effect: {
    floor?: number;
    ceiling?: number;
    boost?: number;
  };
}

export interface IndexConfig {
  id: string;
  entityDimension: string;
  components: IndexComponentConfig[];
  modifiers: IndexModifier[];
  range: [number, number];
  thresholds: Record<string, [number, number]>;
  label?: string;
}

// ─── Score Result ────────────────────────────────────────────────────

export interface IndexScore {
  indexId: string;
  entityId: string;
  score: number;
  level: string;
  components: Record<string, { raw: number; weighted: number; signalCount: number }>;
  activeModifiers: string[];
  trend: 'rising' | 'stable' | 'falling';
  previousScore?: number;
  computedAt: Date;
}

// ─── Severity weights default ────────────────────────────────────────

const DEFAULT_SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

// ─── Engine ──────────────────────────────────────────────────────────

export class ScoringEngine {
  private configs: Map<string, IndexConfig> = new Map();
  private history: Map<string, number[]> = new Map();
  private readonly MAX_HISTORY = 48;

  constructor(configs: IndexConfig[]) {
    for (const config of configs) {
      this.configs.set(config.id, config);
    }
  }

  computeAll(indexId: string, store: SignalStore): IndexScore[] {
    const config = this.configs.get(indexId);
    if (!config) return [];

    const entities = new Set<string>();
    const allSignals = store.query({});
    for (const signal of allSignals) {
      const entityValue = signal.dimensions[config.entityDimension];
      if (entityValue !== undefined) {
        entities.add(String(entityValue));
      }
    }

    return Array.from(entities).map((entityId) =>
      this.computeOne(indexId, entityId, store),
    );
  }

  computeOne(indexId: string, entityId: string, store: SignalStore): IndexScore {
    const config = this.configs.get(indexId)!;
    const now = Date.now();
    const components: IndexScore['components'] = {};
    const activeModifiers: string[] = [];

    let totalScore = 0;

    for (const comp of config.components) {
      const signals = store.query({
        signalTypes: comp.signalTypes,
        dimensions: { [config.entityDimension]: entityId },
        since: new Date(now - comp.windowMs),
      });

      const raw = this.aggregate(signals, comp);
      const normalized = this.normalize(raw, comp);
      const weighted = normalized * comp.weight;

      components[comp.id] = { raw, weighted, signalCount: signals.length };
      totalScore += weighted;
    }

    const [minRange, maxRange] = config.range;
    let finalScore = Math.max(minRange, Math.min(maxRange, totalScore));

    for (let i = 0; i < config.modifiers.length; i++) {
      const mod = config.modifiers[i];
      const conditionMet = this.checkModifierCondition(mod, finalScore, entityId, config, store);

      if (conditionMet) {
        if (mod.effect.floor !== undefined && finalScore < mod.effect.floor) {
          finalScore = mod.effect.floor;
        }
        if (mod.effect.ceiling !== undefined && finalScore > mod.effect.ceiling) {
          finalScore = mod.effect.ceiling;
        }
        if (mod.effect.boost !== undefined) {
          finalScore = Math.min(maxRange, finalScore + mod.effect.boost);
        }
        activeModifiers.push(`modifier_${i}`);
      }
    }

    finalScore = Math.round(finalScore * 100) / 100;

    let level = 'unknown';
    for (const [name, [low, high]] of Object.entries(config.thresholds)) {
      if (finalScore >= low && finalScore < high) {
        level = name;
        break;
      }
    }

    const historyKey = `${indexId}:${entityId}`;
    const prevScores = this.history.get(historyKey) ?? [];
    const trend = this.computeTrend(prevScores, finalScore);

    prevScores.push(finalScore);
    if (prevScores.length > this.MAX_HISTORY) prevScores.shift();
    this.history.set(historyKey, prevScores);

    return {
      indexId,
      entityId,
      score: finalScore,
      level,
      components,
      activeModifiers,
      trend,
      previousScore: prevScores.length > 1 ? prevScores[prevScores.length - 2] : undefined,
      computedAt: new Date(),
    };
  }

  reconfigure(configs: IndexConfig[]): void {
    this.configs.clear();
    for (const config of configs) {
      this.configs.set(config.id, config);
    }
  }

  getHistory(indexId: string, entityId: string): number[] {
    return this.history.get(`${indexId}:${entityId}`) ?? [];
  }

  // ── Private ────────────────────────────────────────────────────────

  private aggregate(signals: Signal[], comp: IndexComponentConfig): number {
    if (signals.length === 0) return 0;

    switch (comp.aggregation) {
      case 'count':
        return signals.length;

      case 'count_weighted': {
        const weights = comp.severityWeights ?? DEFAULT_SEVERITY_WEIGHTS;
        return signals.reduce((sum, s) => sum + (weights[s.severity] ?? 1), 0);
      }

      case 'sum_value':
        return signals.reduce((sum, s) => sum + (s.value ?? 0), 0);

      case 'avg_value': {
        const total = signals.reduce((sum, s) => sum + (s.value ?? 0), 0);
        return total / signals.length;
      }

      case 'max_value':
        return Math.max(...signals.map((s) => s.value ?? 0));

      case 'ratio_vs_target': {
        const total = signals.reduce((sum, s) => sum + (s.value ?? 0), 0);
        const target = comp.target ?? 1;
        return (total / target) * 100;
      }

      case 'latest_value': {
        const sorted = [...signals].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
        return sorted[0]?.value ?? 0;
      }
    }
  }

  private normalize(raw: number, comp: IndexComponentConfig): number {
    const [min, max] = comp.range;

    let scaled = raw;

    if (comp.scaling === 'logarithmic' && scaled > 0) {
      scaled = Math.log1p(scaled);
      const logMax = Math.log1p(max);
      scaled = (scaled / logMax) * (max - min) + min;
    }

    scaled = Math.max(min, Math.min(max, scaled));
    const normalized = ((scaled - min) / (max - min || 1)) * 100;

    return comp.invert ? 100 - normalized : normalized;
  }

  private checkModifierCondition(
    mod: IndexModifier,
    currentScore: number,
    entityId: string,
    config: IndexConfig,
    store: SignalStore,
  ): boolean {
    if (mod.condition.scoreAbove !== undefined && currentScore <= mod.condition.scoreAbove) {
      return false;
    }
    if (mod.condition.scoreBelow !== undefined && currentScore >= mod.condition.scoreBelow) {
      return false;
    }
    if (mod.condition.signalFilter) {
      const filter = {
        ...mod.condition.signalFilter,
        dimensions: {
          ...mod.condition.signalFilter.dimensions,
          [config.entityDimension]: entityId,
        },
      };
      if (store.count(filter) === 0) return false;
    }
    return true;
  }

  private computeTrend(history: number[], current: number): 'rising' | 'stable' | 'falling' {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const diff = current - avg;

    if (diff > 2) return 'rising';
    if (diff < -2) return 'falling';
    return 'stable';
  }
}
