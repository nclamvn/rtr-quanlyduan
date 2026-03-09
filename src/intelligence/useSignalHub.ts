/**
 * React hook for SignalHub integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SignalHub } from './kernel/hub';
import type { HubState, HubEvent } from './kernel/hub';
import type { ConvergenceAlert } from './kernel/convergence';
import type { AnomalyResult } from './kernel/anomaly';
import type { IndexScore } from './kernel/scoring';
import type { FreshnessSummary } from './kernel/freshness';
import { RTR_CONFIG } from './rtr-config';
import {
  issueToSignal,
  gateToggleToSignal,
  flightTestToSignal,
  deliveryToSignal,
  bomChangeToSignal,
  orderToSignal,
  productionToSignal,
  inventoryAlertToSignal,
  hydrateFromExistingData,
} from './transformers';

export interface IntelligenceState {
  signalCount: number;
  convergences: ConvergenceAlert[];
  anomalies: AnomalyResult[];
  projectScores: IndexScore[];
  freshness: FreshnessSummary;
  isRunning: boolean;
  events: HubEvent[];
}

export function useSignalHub(
  issues: any[],
  projects: any[],
  flights: any[],
  deliveries: any[],
  bomItems: any[],
  orders: any[] = [],
  productionOrders: any[] = [],
  inventoryItems: any[] = [],
) {
  const hubRef = useRef<SignalHub | null>(null);
  const hydratedRef = useRef(false);
  const [state, setState] = useState<IntelligenceState>({
    signalCount: 0,
    convergences: [],
    anomalies: [],
    projectScores: [],
    freshness: {
      totalSources: 0,
      fresh: 0,
      stale: 0,
      error: 0,
      disabled: 0,
      overallHealth: 'healthy',
      coveragePercent: 100,
      degradedDecisions: [],
    },
    isRunning: false,
    events: [],
  });

  // Initialize hub once
  useEffect(() => {
    if (hubRef.current) return;

    try {
      const hub = new SignalHub(RTR_CONFIG);
      hubRef.current = hub;

      // Listen to events
      hub.on((event: HubEvent) => {
        setState((prev) => ({
          ...prev,
          events: [...prev.events.slice(-49), event], // keep last 50
        }));
      });

      hub.start();
      refreshState();
    } catch (err) {
      console.error('[useSignalHub] Init error:', err);
    }

    return () => {
      hubRef.current?.stop();
    };
  }, []);

  // Hydrate from existing data once issues/flights/deliveries are loaded
  useEffect(() => {
    if (hydratedRef.current || !hubRef.current) return;
    if (!issues.length && !flights.length) return; // wait for data

    const signals = hydrateFromExistingData(issues, flights, deliveries, bomItems, orders, productionOrders, inventoryItems);
    if (signals.length > 0) {
      hubRef.current.ingestBatch(signals);
      hydratedRef.current = true;

      // Run initial anomaly check and scoring
      hubRef.current.triggerAnomalyCheck();
      hubRef.current.triggerScoring();

      refreshState();
    }
  }, [issues, flights, deliveries, bomItems, orders, productionOrders, inventoryItems]);

  // ── Incremental ingest: detect new items after hydration ──
  const seenIssueIds = useRef(new Set<string>());
  const seenFlightIds = useRef(new Set<string>());
  const seenDeliveryIds = useRef(new Set<string>());
  const seenBomIds = useRef(new Set<string>());

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = issues.filter(i => !seenIssueIds.current.has(i.id));
    if (newItems.length > 0) {
      const signals = newItems.map(i => issueToSignal(i, i.status === 'CLOSED' ? 'closed' : 'created'));
      hubRef.current.ingestBatch(signals);
      newItems.forEach(i => seenIssueIds.current.add(i.id));
      refreshState();
    } else if (seenIssueIds.current.size === 0 && issues.length > 0) {
      // Seed seen set from initial hydration
      issues.forEach(i => seenIssueIds.current.add(i.id));
    }
  }, [issues]);

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = flights.filter(f => !seenFlightIds.current.has(f.id));
    if (newItems.length > 0) {
      const signals = newItems.filter(f => f.result).map(f => flightTestToSignal(f));
      hubRef.current.ingestBatch(signals);
      newItems.forEach(f => seenFlightIds.current.add(f.id));
      refreshState();
    } else if (seenFlightIds.current.size === 0 && flights.length > 0) {
      flights.forEach(f => seenFlightIds.current.add(f.id));
    }
  }, [flights]);

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = deliveries.filter(d => !seenDeliveryIds.current.has(d.id));
    if (newItems.length > 0) {
      const signals = newItems.filter(d => d.status !== 'IN_TRANSIT').map(d => deliveryToSignal(d));
      hubRef.current.ingestBatch(signals);
      newItems.forEach(d => seenDeliveryIds.current.add(d.id));
      refreshState();
    } else if (seenDeliveryIds.current.size === 0 && deliveries.length > 0) {
      deliveries.forEach(d => seenDeliveryIds.current.add(d.id));
    }
  }, [deliveries]);

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = bomItems.filter(b => !seenBomIds.current.has(b.id));
    if (newItems.length > 0) {
      const signals = newItems
        .filter(b => ['EOL', 'OBSOLETE', 'NRND'].includes(b.lifecycleStatus))
        .map(b => bomChangeToSignal(b, 'lifecycle_change'));
      if (signals.length > 0) hubRef.current.ingestBatch(signals);
      newItems.forEach(b => seenBomIds.current.add(b.id));
      refreshState();
    } else if (seenBomIds.current.size === 0 && bomItems.length > 0) {
      bomItems.forEach(b => seenBomIds.current.add(b.id));
    }
  }, [bomItems]);

  // ── Business Operations incremental ingest ──
  const seenOrderIds = useRef(new Set<string>());
  const seenProdIds = useRef(new Set<string>());
  const seenInvIds = useRef(new Set<string>());

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = orders.filter(o => !seenOrderIds.current.has(o.id));
    if (newItems.length > 0) {
      const signals = newItems
        .filter(o => o.priority === 'URGENT' || o.paymentStatus === 'OVERDUE')
        .map(o => orderToSignal(o, 'created'));
      if (signals.length > 0) hubRef.current.ingestBatch(signals);
      newItems.forEach(o => seenOrderIds.current.add(o.id));
      refreshState();
    } else if (seenOrderIds.current.size === 0 && orders.length > 0) {
      orders.forEach(o => seenOrderIds.current.add(o.id));
    }
  }, [orders]);

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = productionOrders.filter(w => !seenProdIds.current.has(w.id));
    if (newItems.length > 0) {
      const signals = newItems
        .filter(w => w.plannedEnd && new Date(w.plannedEnd) < new Date() && !['COMPLETED', 'SHIPPED', 'CANCELLED'].includes(w.status))
        .map(w => productionToSignal(w, 'delayed'));
      if (signals.length > 0) hubRef.current.ingestBatch(signals);
      newItems.forEach(w => seenProdIds.current.add(w.id));
      refreshState();
    } else if (seenProdIds.current.size === 0 && productionOrders.length > 0) {
      productionOrders.forEach(w => seenProdIds.current.add(w.id));
    }
  }, [productionOrders]);

  useEffect(() => {
    if (!hydratedRef.current || !hubRef.current) return;
    const newItems = inventoryItems.filter(i => !seenInvIds.current.has(i.id));
    if (newItems.length > 0) {
      const signals = newItems
        .filter(i => i.stockStatus === 'CRITICAL' || i.stockStatus === 'LOW')
        .map(i => inventoryAlertToSignal(i, i.stockStatus === 'CRITICAL' ? 'critical_stock' : 'low_stock'));
      if (signals.length > 0) hubRef.current.ingestBatch(signals);
      newItems.forEach(i => seenInvIds.current.add(i.id));
      refreshState();
    } else if (seenInvIds.current.size === 0 && inventoryItems.length > 0) {
      inventoryItems.forEach(i => seenInvIds.current.add(i.id));
    }
  }, [inventoryItems]);

  const refreshState = useCallback(() => {
    const hub = hubRef.current;
    if (!hub) return;

    const hubState = hub.getState();
    setState((prev) => ({
      ...prev,
      signalCount: hubState.signalCount,
      convergences: hubState.activeConvergences,
      anomalies: hubState.latestAnomalies,
      projectScores: hubState.indexScores.get('phi') || [],
      freshness: hubState.freshness,
      isRunning: hubState.isRunning,
    }));
  }, []);

  // Ingest functions
  const ingestIssue = useCallback((issue: any, action: 'created' | 'updated' | 'closed') => {
    if (!hubRef.current) return;
    const input = issueToSignal(issue, action);
    hubRef.current.ingest(input);
    refreshState();
  }, [refreshState]);

  const ingestGateToggle = useCallback((projectId: string, phase: string, condId: string, val: boolean) => {
    if (!hubRef.current) return;
    const input = gateToggleToSignal(projectId, phase, condId, val);
    hubRef.current.ingest(input);
    refreshState();
  }, [refreshState]);

  const ingestFlightResult = useCallback((flight: any) => {
    if (!hubRef.current) return;
    const input = flightTestToSignal(flight);
    hubRef.current.ingest(input);
    refreshState();
  }, [refreshState]);

  const ingestDelivery = useCallback((delivery: any) => {
    if (!hubRef.current) return;
    const input = deliveryToSignal(delivery);
    hubRef.current.ingest(input);
    refreshState();
  }, [refreshState]);

  const getProjectScore = useCallback((projectId: string): IndexScore | undefined => {
    return state.projectScores.find((s) => s.entityId === projectId);
  }, [state.projectScores]);

  const getProjectConvergences = useCallback((projectId: string): ConvergenceAlert[] => {
    return state.convergences.filter(
      (c) => c.dimensionValues.project === projectId,
    );
  }, [state.convergences]);

  return {
    hub: hubRef.current,
    state,
    convergences: state.convergences,
    anomalies: state.anomalies,
    projectScores: state.projectScores,
    freshness: state.freshness,
    events: state.events,
    ingestIssue,
    ingestGateToggle,
    ingestFlightResult,
    ingestDelivery,
    getProjectScore,
    getProjectConvergences,
    refreshState,
  };
}
