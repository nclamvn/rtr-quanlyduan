import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase, getConnectionStatus } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import { fetchInventory, fetchInventoryTransactions } from '../services/inventoryService';

// ═══ Transform ═══

function transformInventoryItem(row) {
  const quantityAvailable = row.quantity_available ?? (row.quantity_on_hand - row.quantity_reserved);
  const minStock = row.min_stock || 0;
  let stockStatus = 'OK';
  if (quantityAvailable <= 0) stockStatus = 'CRITICAL';
  else if (minStock > 0 && quantityAvailable < minStock) stockStatus = 'LOW';

  return {
    id: row.id,
    partId: row.part_id,
    partNumber: row.part_number,
    partName: row.part_name,
    category: row.category,
    warehouse: row.warehouse,
    location: row.location,
    quantityOnHand: row.quantity_on_hand,
    quantityReserved: row.quantity_reserved,
    quantityOnOrder: row.quantity_on_order,
    quantityAvailable,
    unit: row.unit,
    unitCost: parseFloat(row.unit_cost) || 0,
    totalValue: parseFloat(row.total_value) || 0,
    minStock,
    maxStock: row.max_stock || 0,
    reorderQuantity: row.reorder_quantity || 0,
    leadTimeDays: row.lead_time_days || 0,
    lastCountedAt: row.last_counted_at,
    supplierId: row.supplier_id,
    supplierName: row.suppliers?.name || '',
    supplierCode: row.suppliers?.code || '',
    notes: row.notes,
    stockStatus,
  };
}

function transformTransaction(row) {
  return {
    id: row.id,
    inventoryId: row.inventory_id,
    type: row.type,
    quantity: row.quantity,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    reason: row.reason,
    performedBy: row.performed_by,
    transactionDate: row.transaction_date,
  };
}

// ═══ STATIC FALLBACK ═══
import { DEMO_INVENTORY } from '../data/businessDemoData';
const STATIC_INVENTORY = DEMO_INVENTORY;
const STATIC_TRANSACTIONS = [];

// ═══ HOOKS ═══

export function useInventory(warehouse) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_INVENTORY);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchInventory(warehouse));
      setData(rows?.length ? rows.map(transformInventoryItem) : STATIC_INVENTORY);
    } catch (err) {
      console.warn('Inventory fetch timeout:', err.message);
      setData(STATIC_INVENTORY);
    }
    setLoading(false);
  }, [warehouse]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  useRealtimeSubscription('inventory', {
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
    filter: warehouse ? { column: 'warehouse', value: warehouse } : undefined,
  });

  return { data, loading, refetch };
}

export function useInventoryTransactions(inventoryId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_TRANSACTIONS);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchInventoryTransactions(inventoryId));
      setData(rows?.length ? rows.map(transformTransaction) : STATIC_TRANSACTIONS);
    } catch (err) {
      console.warn('Transactions fetch timeout:', err.message);
      setData(STATIC_TRANSACTIONS);
    }
    setLoading(false);
  }, [inventoryId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  return { data, loading, refetch };
}
