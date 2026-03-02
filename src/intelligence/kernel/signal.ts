/**
 * SignalHub Kernel — Universal Signal Schema
 */

// ─── Severity ────────────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_PRIORITY: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_PRIORITY[b] - SEVERITY_PRIORITY[a];
}

export function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_PRIORITY[a] >= SEVERITY_PRIORITY[b] ? a : b;
}

// ─── Entity ──────────────────────────────────────────────────────────
export interface Entity {
  name: string;
  type: string;
  id?: string;
}

// ─── Geo (optional) ──────────────────────────────────────────────────
export interface GeoLocation {
  lat: number;
  lon: number;
  name?: string;
  accuracy?: 'exact' | 'approximate' | 'region';
}

// ─── Signal ──────────────────────────────────────────────────────────
export interface Signal {
  id: string;
  sourceId: string;
  signalType: string;
  title: string;
  body?: string;
  value?: number;
  prevValue?: number;
  entities: Entity[];
  severity: Severity;
  categories: string[];
  confidence: number;
  classifiedBy: 'rule' | 'ai' | 'manual' | 'default';
  dimensions: Record<string, string | number>;
  geo?: GeoLocation;
  timestamp: Date;
  ingestedAt: Date;
  ttl: number;
  sourceTier: 1 | 2 | 3 | 4;
  links: string[];
  raw?: unknown;
}

// ─── Signal Builder ──────────────────────────────────────────────────
export interface SignalInput {
  sourceId: string;
  signalType: string;
  title: string;
  body?: string;
  value?: number;
  prevValue?: number;
  entities?: Entity[];
  severity?: Severity;
  categories?: string[];
  confidence?: number;
  classifiedBy?: Signal['classifiedBy'];
  dimensions?: Record<string, string | number>;
  geo?: GeoLocation;
  timestamp?: Date;
  ttl?: number;
  sourceTier?: 1 | 2 | 3 | 4;
  links?: string[];
  raw?: unknown;
}

function computeSignalId(sourceId: string, title: string, timestamp: Date): string {
  const raw = `${sourceId}:${title}:${timestamp.getTime()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return `sig_${Math.abs(hash).toString(36)}`;
}

export function createSignal(input: SignalInput): Signal {
  const timestamp = input.timestamp ?? new Date();
  return {
    id: computeSignalId(input.sourceId, input.title, timestamp),
    sourceId: input.sourceId,
    signalType: input.signalType,
    title: input.title,
    body: input.body,
    value: input.value,
    prevValue: input.prevValue,
    entities: input.entities ?? [],
    severity: input.severity ?? 'info',
    categories: input.categories ?? [],
    confidence: input.confidence ?? 0.5,
    classifiedBy: input.classifiedBy ?? 'default',
    dimensions: input.dimensions ?? {},
    geo: input.geo,
    timestamp,
    ingestedAt: new Date(),
    ttl: input.ttl ?? 86400,
    sourceTier: input.sourceTier ?? 3,
    links: input.links ?? [],
    raw: input.raw,
  };
}

// ─── Signal Store interface ──────────────────────────────────────────
export interface SignalStore {
  put(signal: Signal): void;
  get(id: string): Signal | undefined;
  prune(): number;
  query(filter: SignalFilter): Signal[];
  count(filter?: SignalFilter): number;
  clear(): void;
}

export interface SignalFilter {
  signalTypes?: string[];
  severities?: Severity[];
  categories?: string[];
  sourceIds?: string[];
  dimensions?: Record<string, string | number>;
  since?: Date;
  until?: Date;
  limit?: number;
}

// ─── In-memory implementation ────────────────────────────────────────
export class InMemorySignalStore implements SignalStore {
  private signals = new Map<string, Signal>();

  put(signal: Signal): void {
    this.signals.set(signal.id, signal);
  }

  get(id: string): Signal | undefined {
    return this.signals.get(id);
  }

  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [id, signal] of this.signals) {
      if (signal.ttl > 0) {
        const expiresAt = signal.ingestedAt.getTime() + signal.ttl * 1000;
        if (now > expiresAt) {
          this.signals.delete(id);
          pruned++;
        }
      }
    }
    return pruned;
  }

  query(filter: SignalFilter): Signal[] {
    let results: Signal[] = [];

    for (const signal of this.signals.values()) {
      if (matchesFilter(signal, filter)) {
        results.push(signal);
      }
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter.limit && results.length > filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  count(filter?: SignalFilter): number {
    if (!filter) return this.signals.size;
    let count = 0;
    for (const signal of this.signals.values()) {
      if (matchesFilter(signal, filter)) count++;
    }
    return count;
  }

  clear(): void {
    this.signals.clear();
  }
}

function matchesFilter(signal: Signal, filter: SignalFilter): boolean {
  if (filter.signalTypes && !filter.signalTypes.includes(signal.signalType)) return false;
  if (filter.severities && !filter.severities.includes(signal.severity)) return false;
  if (filter.categories && !filter.categories.some((c) => signal.categories.includes(c)))
    return false;
  if (filter.sourceIds && !filter.sourceIds.includes(signal.sourceId)) return false;
  if (filter.since && signal.timestamp < filter.since) return false;
  if (filter.until && signal.timestamp > filter.until) return false;
  if (filter.dimensions) {
    for (const [key, value] of Object.entries(filter.dimensions)) {
      if (signal.dimensions[key] !== value) return false;
    }
  }
  return true;
}
