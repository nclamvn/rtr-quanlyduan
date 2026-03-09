/**
 * RtR Data → Signal Transformers
 * Convert existing RtR mock data into SignalHub signals
 */

import type { SignalInput } from './kernel/signal';

// ── Issue → Signal ───────────────────────────────────────────────────

export function issueToSignal(
  issue: any,
  action: 'created' | 'updated' | 'closed',
): SignalInput {
  const overdueDays = issue.due
    ? Math.max(0, Math.floor((Date.now() - new Date(issue.due).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    sourceId: 'src-issues',
    signalType: 'issue_event',
    title: `[${issue.id}] ${issue.title} — ${action}`,
    body: issue.desc,
    value: action === 'closed' ? 0 : Math.max(issue.impacts?.length || 0, overdueDays),
    entities: [
      { name: issue.id, type: 'issue', id: issue.id },
      { name: issue.owner || 'unassigned', type: 'person' },
    ],
    dimensions: {
      project: issue.pid,
      phase: issue.phase,
      severity: issue.sev,
      owner: issue.owner || 'unassigned',
      status: issue.status,
      action,
    },
    timestamp: new Date(issue.created || Date.now()),
    ttl: 7 * 24 * 60 * 60, // 7 days
    sourceTier: 1,
  };
}

// ── Gate Toggle → Signal ─────────────────────────────────────────────

export function gateToggleToSignal(
  projectId: string,
  phase: string,
  conditionId: string,
  newValue: boolean,
): SignalInput {
  return {
    sourceId: 'src-gates',
    signalType: 'gate_toggle',
    title: `Gate ${phase}/${conditionId} → ${newValue ? 'completed' : 'unchecked'}`,
    value: newValue ? 1 : 0,
    dimensions: {
      project: projectId,
      phase,
      condition_id: conditionId,
    },
    timestamp: new Date(),
    ttl: 90 * 24 * 60 * 60, // 90 days
    sourceTier: 1,
  };
}

// ── Flight Test → Signal ─────────────────────────────────────────────

export function flightTestToSignal(flight: any): SignalInput {
  return {
    sourceId: 'src-flights',
    signalType: 'flight_result',
    title: `[${flight.id}] ${flight.testName || flight.testType || 'Flight Test'} — ${flight.result}`,
    body: flight.notes,
    value: flight.result === 'PASS' ? 1 : 0,
    entities: [
      { name: flight.id, type: 'flight_test', id: flight.id },
    ],
    dimensions: {
      project: flight.projectId,
      test_type: flight.testType || flight.category || 'general',
      result: flight.result,
      phase: flight.phase || 'DVT',
    },
    timestamp: new Date(flight.testDate || flight.date || Date.now()),
    ttl: 30 * 24 * 60 * 60,
    sourceTier: 1,
  };
}

// ── Delivery → Signal ────────────────────────────────────────────────

export function deliveryToSignal(delivery: any): SignalInput {
  return {
    sourceId: 'src-delivery',
    signalType: 'delivery_event',
    title: `[${delivery.id}] Delivery ${delivery.status} (${delivery.supplierId})`,
    value: delivery.delayDays || 0,
    entities: [
      { name: delivery.supplierId, type: 'supplier', id: delivery.supplierId },
    ],
    dimensions: {
      project: delivery.projectId,
      supplier: delivery.supplierId,
      status: delivery.status,
    },
    timestamp: new Date(delivery.actualDate || delivery.promisedDate || Date.now()),
    ttl: 30 * 24 * 60 * 60,
    sourceTier: 2,
  };
}

// ── BOM Change → Signal ──────────────────────────────────────────────

export function bomChangeToSignal(
  bomItem: any,
  change: 'added' | 'lifecycle_change',
): SignalInput {
  return {
    sourceId: 'src-bom',
    signalType: 'bom_change',
    title: `[${bomItem.id}] ${bomItem.description} — ${change}`,
    value: change === 'lifecycle_change' && ['EOL', 'OBSOLETE'].includes(bomItem.lifecycleStatus) ? 1 : 0,
    dimensions: {
      project: bomItem.projectId,
      category: bomItem.category,
      lifecycle: bomItem.lifecycleStatus,
    },
    timestamp: new Date(),
    ttl: 90 * 24 * 60 * 60,
    sourceTier: 2,
  };
}

// ── Import Batch → Signal ────────────────────────────────────────────

export function importBatchToSignal(
  importType: string,
  count: number,
  projectId: string,
): SignalInput {
  return {
    sourceId: 'src-import',
    signalType: 'import_batch',
    title: `Imported ${count} ${importType} records for ${projectId}`,
    value: count,
    dimensions: {
      project: projectId,
      import_type: importType,
      count,
    },
    timestamp: new Date(),
    ttl: 7 * 24 * 60 * 60,
    sourceTier: 3,
  };
}

// ── Order → Signal ──────────────────────────────────────────────────

export function orderToSignal(
  order: any,
  action: 'created' | 'updated' | 'status_changed',
): SignalInput {
  const isOverdue = order.requiredDeliveryDate
    ? Math.max(0, Math.floor((Date.now() - new Date(order.requiredDeliveryDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    sourceId: 'src-orders',
    signalType: 'order_event',
    title: `[${order.orderNumber}] ${order.customerName} — ${action}`,
    body: order.notes,
    value: isOverdue,
    entities: [
      { name: order.orderNumber, type: 'order', id: order.id },
      { name: order.customerName, type: 'customer' },
    ],
    dimensions: {
      project: order.projectId || 'global',
      status: order.status,
      priority: order.priority,
      payment_status: order.paymentStatus,
      customer: order.customerName,
      action,
    },
    timestamp: new Date(order.orderDate || Date.now()),
    ttl: 30 * 24 * 60 * 60,
    sourceTier: 1,
  };
}

// ── Production Order → Signal ───────────────────────────────────────

export function productionToSignal(
  wo: any,
  action: 'created' | 'updated' | 'completed' | 'delayed',
): SignalInput {
  const isLate = wo.plannedEnd
    ? Math.max(0, Math.floor((Date.now() - new Date(wo.plannedEnd).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const yieldRate = wo.quantity > 0 ? (wo.yieldQuantity || 0) / wo.quantity : 1;

  return {
    sourceId: 'src-production',
    signalType: 'production_event',
    title: `[${wo.woNumber}] ${wo.productName} — ${action}`,
    value: action === 'completed' ? (1 - yieldRate) * 100 : isLate, // defect% or delay days
    entities: [
      { name: wo.woNumber, type: 'work_order', id: wo.id },
      { name: wo.productName, type: 'product' },
    ],
    dimensions: {
      project: wo.projectId || 'global',
      status: wo.status,
      station: wo.currentStation || 'unknown',
      priority: wo.priority || 'NORMAL',
      action,
    },
    timestamp: new Date(wo.updatedAt || Date.now()),
    ttl: 30 * 24 * 60 * 60,
    sourceTier: 1,
  };
}

// ── Inventory Alert → Signal ────────────────────────────────────────

export function inventoryAlertToSignal(
  item: any,
  alertType: 'low_stock' | 'critical_stock' | 'reorder',
): SignalInput {
  return {
    sourceId: 'src-inventory',
    signalType: 'inventory_alert',
    title: `[${item.partNumber}] ${item.partName} — ${alertType}`,
    value: item.quantityAvailable || 0,
    entities: [
      { name: item.partNumber, type: 'inventory_item', id: item.id },
    ],
    dimensions: {
      project: 'global',
      warehouse: item.warehouse || 'unknown',
      category: item.category || 'OTHER',
      stock_status: item.stockStatus || alertType,
    },
    timestamp: new Date(),
    ttl: 7 * 24 * 60 * 60,
    sourceTier: 2,
  };
}

// ── Hydration: Convert all existing data to signals at startup ───────

export function hydrateFromExistingData(
  issues: any[],
  flights: any[],
  deliveries: any[],
  bomItems: any[],
  orders: any[] = [],
  productionOrders: any[] = [],
  inventoryItems: any[] = [],
): SignalInput[] {
  const signals: SignalInput[] = [];

  // Issues
  for (const issue of issues) {
    const action = issue.status === 'CLOSED' ? 'closed' : 'created';
    signals.push(issueToSignal(issue, action));
  }

  // Flights
  for (const flight of flights) {
    if (flight.result) {
      signals.push(flightTestToSignal(flight));
    }
  }

  // Deliveries
  for (const delivery of deliveries) {
    if (delivery.status !== 'IN_TRANSIT') {
      signals.push(deliveryToSignal(delivery));
    }
  }

  // BOM — only flag EOL/NRND/OBSOLETE parts
  for (const bom of bomItems) {
    if (['EOL', 'OBSOLETE', 'NRND'].includes(bom.lifecycleStatus)) {
      signals.push(bomChangeToSignal(bom, 'lifecycle_change'));
    }
  }

  // Orders — flag overdue or high-priority
  for (const order of orders) {
    if (order.priority === 'URGENT' || order.paymentStatus === 'OVERDUE') {
      signals.push(orderToSignal(order, 'created'));
    }
  }

  // Production — flag delayed or low yield
  for (const wo of productionOrders) {
    if (wo.plannedEnd && new Date(wo.plannedEnd) < new Date() && !['COMPLETED', 'SHIPPED', 'CANCELLED'].includes(wo.status)) {
      signals.push(productionToSignal(wo, 'delayed'));
    }
  }

  // Inventory — flag critical/low stock
  for (const item of inventoryItems) {
    if (item.stockStatus === 'CRITICAL') {
      signals.push(inventoryAlertToSignal(item, 'critical_stock'));
    } else if (item.stockStatus === 'LOW') {
      signals.push(inventoryAlertToSignal(item, 'low_stock'));
    }
  }

  return signals;
}
