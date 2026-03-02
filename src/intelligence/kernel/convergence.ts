/**
 * SignalHub Kernel — Convergence Detector
 */

import type { Signal, Severity } from './signal';
import { SEVERITY_PRIORITY } from './signal';

// ─── Config ──────────────────────────────────────────────────────────

export interface ConvergenceSpaceConfig {
  id: string;
  dimensionKeys: string[];
  windowMs: number;
  minSignalTypes: number;
  scorePerType: number;
  scorePerEvent: number;
  maxScore: number;
  numericBinSize?: Record<string, number>;
  label?: string;
}

// ─── Types ───────────────────────────────────────────────────────────

export interface ConvergenceCell {
  cellId: string;
  dimensionValues: Record<string, string | number>;
  byType: Map<string, Signal[]>;
  firstSeen: Date;
  lastSeen: Date;
}

export interface ConvergenceAlert {
  spaceId: string;
  cellId: string;
  dimensionValues: Record<string, string | number>;
  signalTypes: string[];
  totalEvents: number;
  score: number;
  severity: Severity;
  signals: Signal[];
  description: string;
  detectedAt: Date;
}

// ─── Detector ────────────────────────────────────────────────────────

export class ConvergenceDetector {
  private spaces: Map<string, ConvergenceSpaceConfig> = new Map();
  private cells: Map<string, Map<string, ConvergenceCell>> = new Map();
  private seenAlerts: Set<string> = new Set();

  constructor(configs: ConvergenceSpaceConfig[]) {
    for (const config of configs) {
      this.spaces.set(config.id, config);
      this.cells.set(config.id, new Map());
    }
  }

  ingest(signal: Signal): ConvergenceAlert[] {
    const alerts: ConvergenceAlert[] = [];

    for (const [spaceId, config] of this.spaces) {
      const cellId = this.computeCellId(signal, config);
      if (!cellId) continue;

      const spaceCells = this.cells.get(spaceId)!;
      let cell = spaceCells.get(cellId);

      if (!cell) {
        cell = {
          cellId,
          dimensionValues: this.extractDimensions(signal, config),
          byType: new Map(),
          firstSeen: signal.timestamp,
          lastSeen: signal.timestamp,
        };
        spaceCells.set(cellId, cell);
      }

      const typeSignals = cell.byType.get(signal.signalType) ?? [];
      typeSignals.push(signal);
      cell.byType.set(signal.signalType, typeSignals);
      cell.lastSeen = signal.timestamp;

      if (cell.byType.size >= config.minSignalTypes) {
        const alertKey = `${spaceId}:${cellId}`;
        if (!this.seenAlerts.has(alertKey)) {
          const alert = this.buildAlert(spaceId, config, cell);
          alerts.push(alert);
          this.seenAlerts.add(alertKey);
        }
      }
    }

    return alerts;
  }

  detect(): ConvergenceAlert[] {
    const alerts: ConvergenceAlert[] = [];

    for (const [spaceId, config] of this.spaces) {
      this.pruneSpace(spaceId, config);

      const spaceCells = this.cells.get(spaceId)!;
      for (const [, cell] of spaceCells) {
        if (cell.byType.size >= config.minSignalTypes) {
          const alertKey = `${spaceId}:${cell.cellId}`;
          if (!this.seenAlerts.has(alertKey)) {
            alerts.push(this.buildAlert(spaceId, config, cell));
            this.seenAlerts.add(alertKey);
          }
        }
      }
    }

    return alerts.sort((a, b) => b.score - a.score);
  }

  getActiveConvergences(): ConvergenceAlert[] {
    const active: ConvergenceAlert[] = [];

    for (const [spaceId, config] of this.spaces) {
      this.pruneSpace(spaceId, config);
      const spaceCells = this.cells.get(spaceId)!;

      for (const cell of spaceCells.values()) {
        if (cell.byType.size >= config.minSignalTypes) {
          active.push(this.buildAlert(spaceId, config, cell));
        }
      }
    }

    return active.sort((a, b) => b.score - a.score);
  }

  resetAlerts(): void {
    this.seenAlerts.clear();
  }

  clear(): void {
    for (const spaceCells of this.cells.values()) {
      spaceCells.clear();
    }
    this.seenAlerts.clear();
  }

  reconfigure(configs: ConvergenceSpaceConfig[]): void {
    this.spaces.clear();
    this.cells.clear();
    this.seenAlerts.clear();
    for (const config of configs) {
      this.spaces.set(config.id, config);
      this.cells.set(config.id, new Map());
    }
  }

  // ── Private ────────────────────────────────────────────────────────

  private computeCellId(signal: Signal, config: ConvergenceSpaceConfig): string | null {
    const parts: string[] = [];

    for (const key of config.dimensionKeys) {
      let value = signal.dimensions[key];
      if (value === undefined || value === null) {
        if (key === 'geo.lat' && signal.geo) value = signal.geo.lat;
        else if (key === 'geo.lon' && signal.geo) value = signal.geo.lon;
        else return null;
      }

      if (typeof value === 'number' && config.numericBinSize?.[key]) {
        value = Math.floor(value / config.numericBinSize[key]) * config.numericBinSize[key];
      }

      parts.push(`${key}=${value}`);
    }

    return parts.join('|');
  }

  private extractDimensions(
    signal: Signal,
    config: ConvergenceSpaceConfig,
  ): Record<string, string | number> {
    const dims: Record<string, string | number> = {};
    for (const key of config.dimensionKeys) {
      let value = signal.dimensions[key];
      if (value === undefined && key === 'geo.lat' && signal.geo) value = signal.geo.lat;
      if (value === undefined && key === 'geo.lon' && signal.geo) value = signal.geo.lon;
      if (value !== undefined) {
        if (typeof value === 'number' && config.numericBinSize?.[key]) {
          dims[key] = Math.floor(value / config.numericBinSize[key]) * config.numericBinSize[key];
        } else {
          dims[key] = value;
        }
      }
    }
    return dims;
  }

  private buildAlert(
    spaceId: string,
    config: ConvergenceSpaceConfig,
    cell: ConvergenceCell,
  ): ConvergenceAlert {
    const signalTypes = Array.from(cell.byType.keys());
    const allSignals: Signal[] = [];
    let totalEvents = 0;

    for (const signals of cell.byType.values()) {
      allSignals.push(...signals);
      totalEvents += signals.length;
    }

    const typeScore = cell.byType.size * config.scorePerType;
    const countScore = Math.min(config.maxScore / 2, totalEvents * config.scorePerEvent);
    const score = Math.min(config.maxScore, typeScore + countScore);

    const pct = score / config.maxScore;
    let severity: Severity;
    if (pct >= 0.8) severity = 'critical';
    else if (pct >= 0.6) severity = 'high';
    else if (pct >= 0.4) severity = 'medium';
    else severity = 'low';

    const maxSignalSeverity = allSignals.reduce(
      (max, s) => (SEVERITY_PRIORITY[s.severity] > SEVERITY_PRIORITY[max] ? s.severity : max),
      'info' as Severity,
    );
    if (SEVERITY_PRIORITY[maxSignalSeverity] > SEVERITY_PRIORITY[severity]) {
      severity = maxSignalSeverity;
    }

    const dimDescription = Object.entries(cell.dimensionValues)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    return {
      spaceId,
      cellId: cell.cellId,
      dimensionValues: cell.dimensionValues,
      signalTypes,
      totalEvents,
      score,
      severity,
      signals: allSignals,
      description: `Convergence [${config.label ?? spaceId}]: ${signalTypes.length} signal types (${signalTypes.join(', ')}) at {${dimDescription}} — ${totalEvents} events`,
      detectedAt: new Date(),
    };
  }

  private pruneSpace(spaceId: string, config: ConvergenceSpaceConfig): void {
    const cutoff = Date.now() - config.windowMs;
    const spaceCells = this.cells.get(spaceId)!;

    for (const [cellId, cell] of spaceCells) {
      for (const [type, signals] of cell.byType) {
        const fresh = signals.filter((s) => s.timestamp.getTime() > cutoff);
        if (fresh.length === 0) {
          cell.byType.delete(type);
        } else {
          cell.byType.set(type, fresh);
        }
      }

      if (cell.byType.size === 0) {
        spaceCells.delete(cellId);
        this.seenAlerts.delete(`${spaceId}:${cellId}`);
      }
    }
  }
}
