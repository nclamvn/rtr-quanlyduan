/**
 * RtR Control Tower — Domain Configuration for SignalHub Kernel
 * 6 signal types, 8 classification rules, 2 convergence spaces, PHI scoring
 */

import type { DomainConfig } from './kernel/config';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const RTR_CONFIG: DomainConfig = {
  id: 'rtr-pm',
  name: 'RtR Project Management',
  description: 'Intelligence layer for RtR Control Tower — drone hardware development tracking',
  version: '1.0.0',

  // ── Data Sources (client-side, no adapters) ──
  sources: [
    { id: 'src-issues', name: 'Issue Tracker', tier: 1, signalTypes: ['issue_event'], enabled: true },
    { id: 'src-gates', name: 'Phase Gates', tier: 1, signalTypes: ['gate_toggle'], enabled: true },
    { id: 'src-bom', name: 'BOM Management', tier: 2, signalTypes: ['bom_change'], enabled: true },
    { id: 'src-flights', name: 'Flight Tests', tier: 1, signalTypes: ['flight_result'], enabled: true },
    { id: 'src-delivery', name: 'Supplier Deliveries', tier: 2, signalTypes: ['delivery_event'], enabled: true },
    { id: 'src-import', name: 'Data Import', tier: 3, signalTypes: ['import_batch'], enabled: true },
  ],

  // ── Classification Rules (8 rules) ──
  classification: {
    rules: [
      {
        id: 'crit_blocked_issue',
        priority: 1,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'issue_event' },
          { field: 'dimension', key: 'status', op: 'equals', value: 'BLOCKED' },
          { field: 'dimension', key: 'severity', op: 'in', values: ['CRITICAL', 'HIGH'] },
        ],
        assign: { severity: 'critical', categories: ['blocking', 'escalation'] },
        confidence: 0.95,
        terminal: true,
      },
      {
        id: 'crit_cascade',
        priority: 2,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'issue_event' },
          { field: 'value', op: 'gt', threshold: 1 }, // value = impacts.length
        ],
        assign: { severity: 'critical', categories: ['cascade', 'schedule_risk'] },
        confidence: 0.9,
        terminal: false,
      },
      {
        id: 'high_flight_fail',
        priority: 3,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'flight_result' },
          { field: 'dimension', key: 'result', op: 'equals', value: 'FAIL' },
        ],
        assign: { severity: 'high', categories: ['quality', 'testing'] },
        confidence: 0.95,
        terminal: true,
      },
      {
        id: 'high_overdue',
        priority: 4,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'issue_event' },
          { field: 'value', op: 'gte', threshold: 3 }, // value = overdue days
        ],
        assign: { severity: 'high', categories: ['schedule', 'overdue'] },
        confidence: 0.9,
        terminal: false,
      },
      {
        id: 'high_delivery_late',
        priority: 5,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'delivery_event' },
          { field: 'dimension', key: 'status', op: 'equals', value: 'DELIVERED_LATE' },
          { field: 'value', op: 'gt', threshold: 3 }, // value = delayDays
        ],
        assign: { severity: 'high', categories: ['supply_chain'] },
        confidence: 0.85,
        terminal: false,
      },
      {
        id: 'med_eol_part',
        priority: 6,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'bom_change' },
          { field: 'dimension', key: 'lifecycle', op: 'in', values: ['EOL', 'OBSOLETE'] },
        ],
        assign: { severity: 'medium', categories: ['supply_chain', 'lifecycle'] },
        confidence: 0.9,
        terminal: false,
      },
      {
        id: 'med_multiple_issues',
        priority: 7,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'issue_event' },
          { field: 'value', op: 'gte', threshold: 3 }, // aggregation check in transformer
        ],
        assign: { severity: 'medium', categories: ['workload'] },
        confidence: 0.7,
        terminal: false,
      },
      {
        id: 'low_gate_progress',
        priority: 8,
        conditions: [
          { field: 'signalType', op: 'equals', value: 'gate_toggle' },
        ],
        assign: { severity: 'low', categories: ['milestone', 'progress'] },
        confidence: 0.8,
        terminal: false,
      },
    ],
  },

  // ── Anomaly Detection ──
  anomaly: {
    baselineDimensions: [
      ['signalType'],
      ['signalType', 'project'],
      ['signalType', 'project', 'phase'],
    ],
    thresholds: { low: 1.5, medium: 2.0, high: 2.5, critical: 3.0 },
    minSamples: 5, // demo mode (production: 10)
    windowDays: 90,
    seasonalWeekday: true,
    seasonalMonth: false, // not enough data for monthly patterns in demo
  },

  // ── Convergence Detection (2 spaces) ──
  convergence: {
    spaces: [
      {
        id: 'project_phase_convergence',
        dimensionKeys: ['project', 'phase'],
        windowMs: 72 * HOUR,
        minSignalTypes: 2,
        scorePerType: 15,
        scorePerEvent: 3,
        maxScore: 100,
        label: 'Project-Phase Crisis',
      },
      {
        id: 'owner_convergence',
        dimensionKeys: ['owner'],
        windowMs: 48 * HOUR,
        minSignalTypes: 3,
        scorePerType: 20,
        scorePerEvent: 5,
        maxScore: 100,
        label: 'Owner Overload',
      },
    ],
  },

  // ── Composite Indexes ──
  indexes: [
    {
      id: 'phi', // Project Health Index
      entityDimension: 'project',
      label: 'Project Health Index',
      range: [0, 100],
      thresholds: {
        healthy: [0, 30],
        attention: [30, 55],
        warning: [55, 75],
        critical: [75, 101],
      },
      components: [
        {
          id: 'issue_severity',
          weight: 0.30,
          signalTypes: ['issue_event'],
          aggregation: 'count_weighted',
          windowMs: 30 * DAY,
          scaling: 'logarithmic',
          invert: true,
          range: [0, 50],
        },
        {
          id: 'testing_health',
          weight: 0.25,
          signalTypes: ['flight_result'],
          aggregation: 'count', // ratio computed via value field
          windowMs: 30 * DAY,
          scaling: 'linear',
          invert: false,
          range: [0, 20],
        },
        {
          id: 'schedule',
          weight: 0.20,
          signalTypes: ['issue_event'],
          aggregation: 'count',
          windowMs: 14 * DAY,
          scaling: 'linear',
          invert: true,
          range: [0, 20],
        },
        {
          id: 'supply_chain',
          weight: 0.15,
          signalTypes: ['delivery_event', 'bom_change'],
          aggregation: 'count',
          windowMs: 30 * DAY,
          scaling: 'linear',
          invert: true,
          range: [0, 15],
        },
        {
          id: 'gate_progress',
          weight: 0.10,
          signalTypes: ['gate_toggle'],
          aggregation: 'count',
          windowMs: 90 * DAY,
          scaling: 'linear',
          invert: false,
          range: [0, 30],
        },
      ],
      modifiers: [
        {
          condition: {
            signalFilter: {
              signalTypes: ['issue_event'],
              categories: ['blocking'],
            },
          },
          effect: { floor: 50 },
        },
        {
          condition: {
            signalFilter: {
              signalTypes: ['issue_event'],
              categories: ['cascade'],
            },
          },
          effect: { boost: 15 },
        },
      ],
    },
  ],

  // ── Presentation ──
  presentation: {
    views: {
      dashboard: { enabled: true, primary: true },
    },
    severityColors: {
      critical: '#EF4444',
      high: '#F59E0B',
      medium: '#3B82F6',
      low: '#6B7280',
      info: '#9CA3AF',
    },
    signalTypeLabels: {
      issue_event: 'Issue',
      gate_toggle: 'Gate',
      bom_change: 'BOM',
      flight_result: 'Flight Test',
      delivery_event: 'Delivery',
      import_batch: 'Import',
    },
  },
};
