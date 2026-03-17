import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase, getConnectionStatus } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import { fetchProductionOrders } from '../services/productionService';

// ═══ Transform ═══

function transformProductionOrder(row) {
  return {
    id: row.id,
    woNumber: row.wo_number,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || '',
    customerName: row.orders?.customers?.name || '',
    projectId: row.project_id,
    productName: row.product_name,
    quantity: row.quantity,
    status: row.status,
    priority: row.priority,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    currentStation: row.current_station,
    assignedTo: row.assigned_to,
    yieldQuantity: row.yield_quantity,
    defectQuantity: row.defect_quantity,
    defectNotes: row.defect_notes,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    logs: (row.production_logs || []).map(log => ({
      id: log.id,
      station: log.station,
      action: log.action,
      quantityProcessed: log.quantity_processed,
      quantityPassed: log.quantity_passed,
      quantityFailed: log.quantity_failed,
      operator: log.operator,
      durationMinutes: log.duration_minutes,
      notes: log.notes,
      loggedAt: log.logged_at,
    })).sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt)),
  };
}

// ═══ STATIC FALLBACK ═══
import { DEMO_PRODUCTION_ORDERS } from '../data/businessDemoData';
const STATIC_PRODUCTION = DEMO_PRODUCTION_ORDERS;

// ═══ HOOK ═══

export function useProductionOrders(projectId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_PRODUCTION);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchProductionOrders(projectId));
      setData(rows?.length ? rows.map(transformProductionOrder) : STATIC_PRODUCTION);
    } catch (err) {
      console.warn('Production fetch timeout:', err.message);
      setData(STATIC_PRODUCTION);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  useRealtimeSubscription('production_orders', {
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
  });

  return { data, loading, refetch };
}
