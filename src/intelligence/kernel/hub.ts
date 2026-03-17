/**
 * SignalHub Kernel — Hub Orchestrator
 * Adapted for client-side use (no ingestion adapters)
 */

import {
  type Signal,
  type SignalInput,
  type SignalStore,
  createSignal,
  InMemorySignalStore,
} from './signal';
import type { DomainConfig } from './config';
import { validateDomainConfig } from './config';
import { ConvergenceDetector, type ConvergenceAlert } from './convergence';
import { AnomalyDetector, type AnomalyResult } from './anomaly';
import { ScoringEngine, type IndexScore } from './scoring';
import { ClassificationEngine, type ClassificationResult } from './classification';
import { FreshnessTracker, type FreshnessSummary } from './freshness';

// ─── Hub Events ──────────────────────────────────────────────────────

export type HubEvent =
  | { type: 'signal_ingested'; signal: Signal }
  | { type: 'signal_reclassified'; signal: Signal; previous: ClassificationResult }
  | { type: 'convergence_detected'; alert: ConvergenceAlert }
  | { type: 'anomaly_detected'; anomaly: AnomalyResult }
  | { type: 'index_updated'; scores: IndexScore[] }
  | { type: 'source_error'; sourceId: string; error: string }
  | { type: 'source_recovered'; sourceId: string }
  | { type: 'freshness_changed'; summary: FreshnessSummary };

export type HubEventHandler = (event: HubEvent) => void;

// ─── Hub State ───────────────────────────────────────────────────────

export interface HubState {
  isRunning: boolean;
  signalCount: number;
  activeConvergences: ConvergenceAlert[];
  latestAnomalies: AnomalyResult[];
  indexScores: Map<string, IndexScore[]>;
  freshness: FreshnessSummary;
}

// ─── Hub ─────────────────────────────────────────────────────────────

export class SignalHub {
  private config: DomainConfig;
  private store: SignalStore;
  private classifier: ClassificationEngine;
  private convergence: ConvergenceDetector;
  private anomaly: AnomalyDetector;
  private scoring: ScoringEngine;
  private freshness: FreshnessTracker;
  private isRunning = false;
  private latestAnomalies: AnomalyResult[] = [];
  private eventHandlers: HubEventHandler[] = [];
  private anomalyCheckTimer?: ReturnType<typeof setInterval>;
  private scoringTimer?: ReturnType<typeof setInterval>;
  private pruneTimer?: ReturnType<typeof setInterval>;

  constructor(config: DomainConfig, store?: SignalStore) {
    const errors = validateDomainConfig(config);
    if (errors.length > 0) {
      const messages = errors.map((e) => `  ${e.path}: ${e.message}`).join('\n');
      throw new Error(`Invalid domain config:\n${messages}`);
    }

    this.config = config;
    this.store = store ?? new InMemorySignalStore();
    this.classifier = new ClassificationEngine(config.classification.rules);
    this.convergence = new ConvergenceDetector(config.convergence.spaces);
    this.anomaly = new AnomalyDetector(config.anomaly);
    this.scoring = new ScoringEngine(config.indexes);
    this.freshness = new FreshnessTracker();

    for (const source of config.sources) {
      this.freshness.registerSource(source.id, source.name, source.signalTypes, source.enabled);
    }

    for (const index of config.indexes) {
      const signalTypes = index.components.flatMap((c) => c.signalTypes);
      this.freshness.registerIndex(index.id, signalTypes);
    }
  }

  // ── Event System ───────────────────────────────────────────────────

  on(handler: HubEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  private emit(event: HubEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('[SignalHub] Event handler error:', e);
      }
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.anomalyCheckTimer = setInterval(() => this.runAnomalyCheck(), 5 * 60 * 1000);
    this.scoringTimer = setInterval(() => this.runScoring(), 2 * 60 * 1000);
    this.pruneTimer = setInterval(() => this.runPrune(), 10 * 60 * 1000);

    if (import.meta.env.DEV) console.log(`[SignalHub] Started domain "${this.config.name}" with ${this.config.sources.length} sources`);
  }

  stop(): void {
    this.isRunning = false;
    if (this.anomalyCheckTimer) clearInterval(this.anomalyCheckTimer);
    if (this.scoringTimer) clearInterval(this.scoringTimer);
    if (this.pruneTimer) clearInterval(this.pruneTimer);
    if (import.meta.env.DEV) console.log(`[SignalHub] Stopped domain "${this.config.name}"`);
  }

  // ── Signal Ingestion ───────────────────────────────────────────────

  ingest(input: SignalInput): Signal {
    const ruleResult = this.classifier.classifyByRules(input);

    const classifiedInput: SignalInput = {
      ...input,
      severity: ruleResult.severity,
      categories: ruleResult.categories,
      confidence: ruleResult.confidence,
      classifiedBy: ruleResult.source as Signal['classifiedBy'],
    };

    const signal = createSignal(classifiedInput);
    this.store.put(signal);

    const convergenceAlerts = this.convergence.ingest(signal);
    for (const alert of convergenceAlerts) {
      this.emit({ type: 'convergence_detected', alert });
    }

    this.anomaly.record(signal);
    this.freshness.recordSuccess(signal.sourceId, 1);

    this.emit({ type: 'signal_ingested', signal });

    return signal;
  }

  ingestBatch(inputs: SignalInput[]): Signal[] {
    return inputs.map((input) => this.ingest(input));
  }

  recordSourceError(sourceId: string, error: string): void {
    this.freshness.recordError(sourceId, error);
    this.emit({ type: 'source_error', sourceId, error });
  }

  // ── Query API ──────────────────────────────────────────────────────

  getState(): HubState {
    return {
      isRunning: this.isRunning,
      signalCount: this.store.count(),
      activeConvergences: this.convergence.getActiveConvergences(),
      latestAnomalies: this.latestAnomalies,
      indexScores: new Map(
        this.config.indexes.map((idx) => [idx.id, this.scoring.computeAll(idx.id, this.store)]),
      ),
      freshness: this.freshness.getSummary(),
    };
  }

  querySignals(filter: Parameters<SignalStore['query']>[0]): Signal[] {
    return this.store.query(filter);
  }

  getConvergences(): ConvergenceAlert[] {
    return this.convergence.getActiveConvergences();
  }

  getIndexScores(indexId: string): IndexScore[] {
    return this.scoring.computeAll(indexId, this.store);
  }

  getEntityScore(indexId: string, entityId: string): IndexScore {
    return this.scoring.computeOne(indexId, entityId, this.store);
  }

  getFreshness(): FreshnessSummary {
    return this.freshness.getSummary();
  }

  getAnomalies(): AnomalyResult[] {
    return this.latestAnomalies;
  }

  /** Manually trigger anomaly check (useful for demo) */
  triggerAnomalyCheck(): AnomalyResult[] {
    return this.runAnomalyCheck();
  }

  /** Manually trigger scoring (useful for demo) */
  triggerScoring(): void {
    this.runScoring();
  }

  // ── Accessors ──────────────────────────────────────────────────────

  get domainId(): string { return this.config.id; }
  get domainName(): string { return this.config.name; }
  get signalStore(): SignalStore { return this.store; }

  // ── Periodic Tasks ─────────────────────────────────────────────────

  private runAnomalyCheck(): AnomalyResult[] {
    const anomalies = this.anomaly.checkAndFlush();
    this.latestAnomalies = anomalies;
    for (const anomaly of anomalies) {
      this.emit({ type: 'anomaly_detected', anomaly });
    }
    return anomalies;
  }

  private runScoring(): void {
    for (const indexConfig of this.config.indexes) {
      const scores = this.scoring.computeAll(indexConfig.id, this.store);
      this.emit({ type: 'index_updated', scores });
    }
  }

  private runPrune(): void {
    const pruned = this.store.prune();
    if (pruned > 0) {
      if (import.meta.env.DEV) console.log(`[SignalHub] Pruned ${pruned} expired signals`);
    }
    this.convergence.resetAlerts();
  }
}
