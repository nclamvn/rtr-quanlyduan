import { useState, useEffect, useCallback } from 'react';
import { fetchBomParts, fetchSuppliers, fetchDeliveryRecords } from '../services/bomService';
import { fetchFlightTests, fetchDecisions } from '../services/flightService';
import { isSupabaseConnected } from '../lib/supabase';

// Fallback imports for offline mode
import {
  BOM_DATA, SUPPLIERS_DATA, DELIVERY_RECORDS_DATA,
  FLIGHT_TESTS_DATA, DECISIONS_DATA,
} from '../data/v2Data';

// ─── Transform snake_case → camelCase for backward compat ───
function transformBomPart(row) {
  return {
    ...row,
    projectId: row.project_id,
    parentId: row.parent_id,
    partNumber: row.part_number,
    description: row.name,
    descriptionVi: row.name_vi,
    unitCost: row.unit_cost,
    totalCost: row.total_cost,
    supplierId: row.supplier_id,
    leadTimeDays: row.lead_time_days,
    lifecycleStatus: row.lifecycle,
    // Keep suppliers join data accessible
    supplierName: row.suppliers?.name,
    supplierCode: row.suppliers?.code,
  };
}

function transformDelivery(row) {
  return {
    ...row,
    supplierId: row.supplier_id,
    bomPartId: row.bom_part_id,
    bomPartName: row.bom_part_name,
    orderDate: row.order_date,
    promisedDate: row.promised_date,
    actualDate: row.actual_date,
    unitPrice: row.unit_price,
    delayDays: row.delay_days,
  };
}

function transformSupplier(row) {
  return {
    ...row,
    nameVi: row.name_vi,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    qualityRating: row.quality_rating,
    deliveryOnTimeRate: row.delivery_on_time_rate,
    totalOrders: row.total_orders,
    lateDeliveries: row.late_deliveries,
    defectRate: row.defect_rate,
    qualificationStatus: row.qualification_status,
    lastAuditDate: row.last_audit_date,
    nextAuditDate: row.next_audit_date,
    paymentTerms: row.payment_terms,
  };
}

function transformFlight(row) {
  return {
    ...row,
    projectId: row.project_id,
    testNumber: row.test_number,
    locationVi: row.location_vi,
    pilot: row.pilot_name,
    droneUnit: row.drone_unit,
    testType: row.test_type,
    testPhase: row.test_phase,
    duration: row.duration_seconds,
    sensorData: row.sensor_data || {},
    maxAltitude: row.sensor_data?.maxAltitude,
    maxSpeed: row.sensor_data?.maxSpeed,
    distanceCovered: row.sensor_data?.distanceCovered,
    anomalies: (row.flight_anomalies || []).map(a => ({
      ...a,
      timestamp: a.timestamp_seconds,
      descriptionVi: a.description_vi,
    })),
    attachments: (row.flight_attachments || []).map(a => ({
      ...a,
      type: a.file_type,
      name: a.file_name,
    })),
    notes: row.notes,
    notesVi: row.notes_vi,
    autoIssueId: row.auto_issue_id,
  };
}

function transformDecision(row) {
  return {
    ...row,
    projectId: row.project_id,
    titleVi: row.title_vi,
    decisionMaker: row.decision_maker_name,
    chosenOption: row.chosen_option,
    rationaleVi: row.rationale_vi,
    impactDescription: row.impact_description,
    costImpact: row.cost_impact,
    linkedIssueIds: row.linked_issue_ids || [],
    linkedFlightTestIds: row.linked_flight_test_ids || [],
    linkedGateConditions: row.linked_gate_condition_ids || [],
  };
}

// ═══ HOOKS ═══

export function useBomData(projectId) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConnected()) {
      const { data } = await fetchBomParts(projectId);
      setParts((data || []).map(transformBomPart));
    } else {
      setParts(BOM_DATA.filter(b => !projectId || b.projectId === projectId));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { parts, loading, refetch };
}

export function useSupplierData() {
  const [suppliers, setSuppliers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConnected()) {
      const [supRes, delRes] = await Promise.all([
        fetchSuppliers(),
        fetchDeliveryRecords(),
      ]);
      setSuppliers((supRes.data || []).map(transformSupplier));
      setDeliveries((delRes.data || []).map(transformDelivery));
    } else {
      setSuppliers(SUPPLIERS_DATA);
      setDeliveries(DELIVERY_RECORDS_DATA);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { suppliers, deliveries, loading, refetch };
}

export function useFlightData(projectId) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConnected()) {
      const { data } = await fetchFlightTests(projectId);
      setTests((data || []).map(transformFlight));
    } else {
      setTests(FLIGHT_TESTS_DATA.filter(t => !projectId || t.projectId === projectId));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { tests, loading, refetch };
}

export function useDecisionData(projectId) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConnected()) {
      const { data } = await fetchDecisions(projectId);
      setDecisions((data || []).map(transformDecision));
    } else {
      setDecisions(DECISIONS_DATA.filter(d => !projectId || d.projectId === projectId));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { decisions, loading, refetch };
}
