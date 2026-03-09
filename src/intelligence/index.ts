// Barrel export for intelligence module
export { useSignalHub } from './useSignalHub';
export type { IntelligenceState } from './useSignalHub';
export { RTR_CONFIG } from './rtr-config';
export {
  issueToSignal,
  gateToggleToSignal,
  flightTestToSignal,
  deliveryToSignal,
  bomChangeToSignal,
  importBatchToSignal,
  orderToSignal,
  productionToSignal,
  inventoryAlertToSignal,
  hydrateFromExistingData,
} from './transformers';

// Re-export kernel types commonly needed by UI
export type { ConvergenceAlert } from './kernel/convergence';
export type { AnomalyResult } from './kernel/anomaly';
export type { IndexScore } from './kernel/scoring';
export type { FreshnessSummary } from './kernel/freshness';
export type { HubEvent, HubState } from './kernel/hub';
export type { Signal, Severity } from './kernel/signal';
