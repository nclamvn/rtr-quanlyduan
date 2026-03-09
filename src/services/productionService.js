import { query, insert, update } from './supabaseService';

export async function fetchProductionOrders(projectId = null) {
  const options = {
    select: '*, production_logs(*), orders(order_number, customers(name))',
    order: { column: 'created_at', asc: false },
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('production_orders', options);
}

export async function createProductionOrder(data) {
  return insert('production_orders', {
    wo_number: data.woNumber,
    order_id: data.orderId || null,
    project_id: data.projectId || null,
    product_name: data.productName,
    quantity: data.quantity || 1,
    status: data.status || 'PLANNED',
    priority: data.priority || 'NORMAL',
    planned_start: data.plannedStart || null,
    planned_end: data.plannedEnd || null,
    current_station: data.currentStation || null,
    assigned_to: data.assignedTo || null,
    notes: data.notes || null,
    created_by: data.createdBy || null,
  });
}

export async function updateProductionStatus(woId, status, station = null) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (station) updates.current_station = station;
  if (status === 'IN_PROGRESS' && !updates.actual_start) {
    updates.actual_start = new Date().toISOString().slice(0, 10);
  }
  if (status === 'COMPLETED' || status === 'SHIPPED') {
    updates.actual_end = new Date().toISOString().slice(0, 10);
  }
  return update('production_orders', woId, updates);
}

export async function addProductionLog(data) {
  return insert('production_logs', {
    production_order_id: data.productionOrderId,
    station: data.station,
    action: data.action,
    quantity_processed: data.quantityProcessed || 0,
    quantity_passed: data.quantityPassed || 0,
    quantity_failed: data.quantityFailed || 0,
    operator: data.operator || null,
    duration_minutes: data.durationMinutes || null,
    notes: data.notes || null,
  });
}

export async function updateProductionYield(woId, yieldQty, defectQty, defectNotes) {
  return update('production_orders', woId, {
    yield_quantity: yieldQty,
    defect_quantity: defectQty,
    defect_notes: defectNotes || null,
    updated_at: new Date().toISOString(),
  });
}
