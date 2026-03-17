import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase, getConnectionStatus } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import { fetchBomParts, fetchSuppliers, fetchDeliveryRecords } from '../services/bomService';
import { fetchFlightTests, fetchDecisions } from '../services/flightService';
import { insert as sbInsert, update as sbUpdate } from '../services/supabaseService';
import {
  BOM_DATA, FLIGHT_TESTS_DATA, SUPPLIERS_DATA,
  DELIVERY_RECORDS_DATA, DECISIONS_DATA, calcBomCosts,
} from '../data/v2Data';

// ═══ Transform Supabase snake_case → App camelCase ═══

function transformBomPart(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    parentId: row.parent_id,
    level: row.level,
    partNumber: row.part_number,
    description: row.description,
    descriptionVi: row.description_vi,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    unitCost: row.unit_cost,
    currency: row.currency,
    supplierId: row.supplier_id,
    leadTimeDays: row.lead_time_days,
    lifecycleStatus: row.lifecycle_status,
    alternatePartIds: row.alternate_part_ids || [],
    designator: row.designator || '',
    sortOrder: row.sort_order,
    // Preserve nested supplier join if present
    _supplier: row.suppliers || null,
  };
}

function transformFlightTest(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    testNumber: row.test_number,
    date: row.date,
    location: row.location,
    locationVi: row.location_vi,
    pilot: row.pilot,
    droneUnit: row.drone_unit,
    testType: row.test_type,
    testPhase: row.test_phase,
    relatedGateCondition: row.related_gate_condition,
    result: row.result,
    duration: row.duration,
    maxAltitude: row.max_altitude,
    maxSpeed: row.max_speed,
    distanceCovered: row.distance_covered,
    sensorData: row.sensor_data || {},
    anomalies: (row.flight_anomalies || []).map(a => ({
      timestamp: a.timestamp,
      description: a.description,
      descriptionVi: a.description_vi,
      severity: a.severity,
    })),
    attachments: (row.flight_attachments || []).map(a => ({
      type: a.type,
      name: a.name,
    })),
    notes: row.notes,
    notesVi: row.notes_vi,
    autoIssueId: row.auto_issue_id,
    createdBy: row.created_by,
  };
}

function transformSupplier(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nameVi: row.name_vi,
    country: row.country,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    website: row.website,
    partCategories: row.part_categories || [],
    qualityRating: row.quality_rating,
    deliveryOnTimeRate: row.delivery_on_time_rate,
    totalOrders: row.total_orders,
    lateDeliveries: row.late_deliveries,
    defectRate: row.defect_rate,
    qualificationStatus: row.qualification_status,
    certifications: row.certifications || [],
    lastAuditDate: row.last_audit_date,
    nextAuditDate: row.next_audit_date,
    paymentTerms: row.payment_terms,
    currency: row.currency,
  };
}

function transformDelivery(row) {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    bomPartId: row.bom_part_id,
    projectId: row.project_id,
    orderDate: row.order_date,
    promisedDate: row.promised_date,
    actualDate: row.actual_date,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    status: row.status,
    delayDays: row.delay_days,
  };
}

function transformDecision(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    titleVi: row.title_vi,
    date: row.date,
    decisionMaker: row.decision_maker,
    phase: row.phase,
    options: row.options || [],
    chosenOption: row.chosen_option,
    rationale: row.rationale,
    rationaleVi: row.rationale_vi,
    impactDescription: row.impact_description,
    impactDescriptionVi: row.impact_description_vi,
    costImpact: row.cost_impact,
    linkedIssueIds: row.linked_issue_ids || [],
    linkedFlightTestIds: row.linked_flight_test_ids || [],
    linkedGateConditions: row.linked_gate_conditions || [],
    status: row.status,
    createdBy: row.created_by,
  };
}

// ═══ HOOKS ═══

/**
 * Fetch BOM parts for a project (or all projects if projectId is null).
 * Falls back to static BOM_DATA when offline.
 */
export function useBomData(projectId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      const items = projectId
        ? BOM_DATA.filter(b => b.projectId === projectId)
        : BOM_DATA;
      setData(calcBomCosts(items));
      setLoading(false);
      return;
    }

    try {
      const { data: rows } = await withTimeout(fetchBomParts(projectId));
      if (rows?.length) {
        const transformed = rows.map(transformBomPart);
        setData(calcBomCosts(transformed));
      } else {
        const items = projectId
          ? BOM_DATA.filter(b => b.projectId === projectId)
          : BOM_DATA;
        setData(calcBomCosts(items));
      }
    } catch (err) {
      console.warn('BOM fetch timeout, using static fallback:', err.message);
      const items = projectId
        ? BOM_DATA.filter(b => b.projectId === projectId)
        : BOM_DATA;
      setData(calcBomCosts(items));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  // Realtime: refresh on BOM changes
  useRealtimeSubscription('bom_parts', {
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
  });

  return { data, loading, refetch };
}

/**
 * Fetch flight tests for a project (or all if projectId is null).
 * Falls back to static FLIGHT_TESTS_DATA when offline.
 */
export function useFlightTestData(projectId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      const items = projectId
        ? FLIGHT_TESTS_DATA.filter(ft => ft.projectId === projectId)
        : FLIGHT_TESTS_DATA;
      setData(items);
      setLoading(false);
      return;
    }

    try {
      const { data: rows } = await withTimeout(fetchFlightTests(projectId));
      if (rows?.length) {
        setData(rows.map(transformFlightTest));
      } else {
        const items = projectId
          ? FLIGHT_TESTS_DATA.filter(ft => ft.projectId === projectId)
          : FLIGHT_TESTS_DATA;
        setData(items);
      }
    } catch (err) {
      console.warn('FlightTests fetch timeout, using static fallback:', err.message);
      const items = projectId
        ? FLIGHT_TESTS_DATA.filter(ft => ft.projectId === projectId)
        : FLIGHT_TESTS_DATA;
      setData(items);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  // Realtime: refresh on flight test changes
  useRealtimeSubscription('flight_tests', {
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
  });

  return { data, loading, refetch };
}

/**
 * Fetch all suppliers.
 * Falls back to static SUPPLIERS_DATA when offline.
 */
export function useSupplierData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(SUPPLIERS_DATA);
      setLoading(false);
      return;
    }

    try {
      const { data: rows } = await withTimeout(fetchSuppliers());
      if (rows?.length) {
        setData(rows.map(transformSupplier));
      } else {
        setData(SUPPLIERS_DATA);
      }
    } catch (err) {
      console.warn('Suppliers fetch timeout, using static fallback:', err.message);
      setData(SUPPLIERS_DATA);
    }
    setLoading(false);
  }, []);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  return { data, loading, refetch };
}

/**
 * Fetch delivery records for a supplier (or all if supplierId is null).
 * Falls back to static DELIVERY_RECORDS_DATA when offline.
 */
export function useDeliveryData(supplierId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      const items = supplierId
        ? DELIVERY_RECORDS_DATA.filter(d => d.supplierId === supplierId)
        : DELIVERY_RECORDS_DATA;
      setData(items);
      setLoading(false);
      return;
    }

    try {
      const { data: rows } = await withTimeout(fetchDeliveryRecords(supplierId));
      if (rows?.length) {
        setData(rows.map(transformDelivery));
      } else {
        const items = supplierId
          ? DELIVERY_RECORDS_DATA.filter(d => d.supplierId === supplierId)
          : DELIVERY_RECORDS_DATA;
        setData(items);
      }
    } catch (err) {
      console.warn('Deliveries fetch timeout, using static fallback:', err.message);
      const items = supplierId
        ? DELIVERY_RECORDS_DATA.filter(d => d.supplierId === supplierId)
        : DELIVERY_RECORDS_DATA;
      setData(items);
    }
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  // Realtime: refresh on delivery changes
  useRealtimeSubscription('delivery_records', {
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    filter: supplierId ? { column: 'supplier_id', value: supplierId } : undefined,
  });

  return { data, loading, refetch };
}

/**
 * Fetch decisions for a project (or all if projectId is null).
 * Falls back to static DECISIONS_DATA when offline.
 */
export function useDecisionData(projectId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      const items = projectId
        ? DECISIONS_DATA.filter(d => d.projectId === projectId)
        : DECISIONS_DATA;
      setData(items);
      setLoading(false);
      return;
    }

    try {
      const { data: rows } = await withTimeout(fetchDecisions(projectId));
      if (rows?.length) {
        setData(rows.map(transformDecision));
      } else {
        const items = projectId
          ? DECISIONS_DATA.filter(d => d.projectId === projectId)
          : DECISIONS_DATA;
        setData(items);
      }
    } catch (err) {
      console.warn('Decisions fetch timeout, using static fallback:', err.message);
      const items = projectId
        ? DECISIONS_DATA.filter(d => d.projectId === projectId)
        : DECISIONS_DATA;
      setData(items);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  const createDecision = useCallback(async (decision) => {
    if (getConnectionStatus() === 'online') {
      const insert = sbInsert;
      const row = {
        project_id: decision.projectId,
        title: decision.title,
        title_vi: decision.titleVi || null,
        phase: decision.phase,
        status: decision.status || 'PROPOSED',
        date: decision.date || new Date().toISOString().split('T')[0],
        decision_maker: decision.decisionMaker,
        chosen_option: decision.chosenOption || null,
        rationale: decision.rationale,
        rationale_vi: decision.rationaleVi || null,
        cost_impact: decision.costImpact || null,
        impact_description: decision.impactDescription || null,
        impact_description_vi: decision.impactDescriptionVi || null,
        options: decision.options || [],
        linked_issue_ids: decision.linkedIssueIds || [],
        linked_flight_test_ids: decision.linkedFlightTestIds || [],
        linked_gate_conditions: decision.linkedGateConditions || [],
      };
      const { data: created } = await insert('decisions', row);
      if (created) {
        setData(prev => [transformDecision(created), ...prev]);
        return created;
      }
    }
    // Offline: add to local state
    const localDec = {
      ...decision,
      id: `DEC-${Date.now()}`,
      date: decision.date || new Date().toISOString().split('T')[0],
    };
    setData(prev => [localDec, ...prev]);
    return localDec;
  }, []);

  const updateDecision = useCallback(async (decisionId, updates) => {
    if (getConnectionStatus() === 'online') {
      const update = sbUpdate;
      const row = {};
      if (updates.status !== undefined) row.status = updates.status;
      if (updates.chosenOption !== undefined) row.chosen_option = updates.chosenOption;
      if (updates.rationale !== undefined) row.rationale = updates.rationale;
      if (updates.decisionMaker !== undefined) row.decision_maker = updates.decisionMaker;
      const { data: updated } = await update('decisions', decisionId, row);
      if (updated) {
        setData(prev => prev.map(d => d.id === decisionId ? transformDecision(updated) : d));
        return updated;
      }
    }
    // Offline: update local state
    setData(prev => prev.map(d => d.id === decisionId ? { ...d, ...updates } : d));
  }, []);

  return { data, loading, refetch, createDecision, updateDecision };
}
