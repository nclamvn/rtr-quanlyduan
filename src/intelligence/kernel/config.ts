/**
 * SignalHub Kernel — Domain Configuration Schema
 */

import type { Severity } from './signal';
import type { ConvergenceSpaceConfig } from './convergence';
import type { AnomalyConfig } from './anomaly';
import type { IndexConfig } from './scoring';
import type { ClassificationRule } from './classification';

// ─── Top-level Config ────────────────────────────────────────────────

export interface SourceDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  signalTypes: string[];
  enabled: boolean;
}

export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  sources: SourceDef[];
  classification: {
    rules: ClassificationRule[];
  };
  anomaly: AnomalyConfig;
  convergence: {
    spaces: ConvergenceSpaceConfig[];
  };
  indexes: IndexConfig[];
  presentation: PresentationConfig;
}

export interface PresentationConfig {
  views: {
    map?: { enabled: boolean; primary?: boolean };
    dashboard?: { enabled: boolean; primary?: boolean };
    timeline?: { enabled: boolean };
    table?: { enabled: boolean };
  };
  severityColors?: Record<Severity, string>;
  signalTypeLabels?: Record<string, string>;
}

// ─── Config Validation ───────────────────────────────────────────────

export interface ValidationError {
  path: string;
  message: string;
}

export function validateDomainConfig(config: DomainConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.id) errors.push({ path: 'id', message: 'Domain ID is required' });
  if (!config.name) errors.push({ path: 'name', message: 'Domain name is required' });

  const sourceIds = new Set<string>();
  for (let i = 0; i < config.sources.length; i++) {
    const src = config.sources[i];
    if (sourceIds.has(src.id)) {
      errors.push({ path: `sources[${i}].id`, message: `Duplicate source ID: ${src.id}` });
    }
    sourceIds.add(src.id);
    if (src.signalTypes.length === 0) {
      errors.push({ path: `sources[${i}].signalTypes`, message: 'Must produce at least one signal type' });
    }
  }

  for (let i = 0; i < config.indexes.length; i++) {
    const idx = config.indexes[i];
    const totalWeight = idx.components.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push({
        path: `indexes[${i}].components`,
        message: `Component weights sum to ${totalWeight.toFixed(2)}, expected ~1.0`,
      });
    }
  }

  for (let i = 0; i < config.convergence.spaces.length; i++) {
    const space = config.convergence.spaces[i];
    if (space.dimensionKeys.length === 0) {
      errors.push({
        path: `convergence.spaces[${i}].dimensionKeys`,
        message: 'Must specify at least one dimension key',
      });
    }
  }

  return errors;
}

export function createMinimalConfig(id: string, name: string): DomainConfig {
  return {
    id,
    name,
    description: `${name} domain configuration`,
    version: '1.0.0',
    sources: [],
    classification: { rules: [] },
    anomaly: {
      baselineDimensions: [['signalType']],
      thresholds: { low: 1.5, medium: 2.0, high: 2.5, critical: 3.0 },
      minSamples: 10,
      windowDays: 90,
      seasonalWeekday: true,
      seasonalMonth: true,
    },
    convergence: { spaces: [] },
    indexes: [],
    presentation: {
      views: { dashboard: { enabled: true, primary: true } },
    },
  };
}
