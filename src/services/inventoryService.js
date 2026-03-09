import { query, insert, update } from './supabaseService';

export async function fetchInventory(warehouse = null) {
  const options = {
    select: '*, suppliers(name, code)',
    order: { column: 'part_number', asc: true },
  };
  if (warehouse) options.eq = { warehouse };
  return query('inventory', options);
}

export async function fetchInventoryTransactions(inventoryId = null) {
  const options = {
    order: { column: 'transaction_date', asc: false },
    limit: 100,
  };
  if (inventoryId) options.eq = { inventory_id: inventoryId };
  return query('inventory_transactions', options);
}

export async function adjustInventory(inventoryId, type, quantity, reason, performedBy, referenceType = null, referenceId = null) {
  // 1. Log the transaction
  const txnResult = await insert('inventory_transactions', {
    inventory_id: inventoryId,
    type,
    quantity: type === 'OUT' || type === 'SCRAP' ? -Math.abs(quantity) : Math.abs(quantity),
    reference_type: referenceType,
    reference_id: referenceId,
    reason,
    performed_by: performedBy,
  });

  // 2. Update stock level
  if (txnResult.data) {
    const { data: inv } = await query('inventory', { eq: { id: inventoryId } });
    if (inv?.length) {
      const current = inv[0];
      const delta = type === 'OUT' || type === 'SCRAP' ? -Math.abs(quantity) : Math.abs(quantity);
      const newOnHand = Math.max(0, current.quantity_on_hand + delta);
      await update('inventory', inventoryId, {
        quantity_on_hand: newOnHand,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return txnResult;
}

export async function createInventoryItem(data) {
  return insert('inventory', {
    part_id: data.partId || null,
    part_number: data.partNumber,
    part_name: data.partName,
    category: data.category || null,
    warehouse: data.warehouse || 'HCM-MAIN',
    location: data.location || null,
    quantity_on_hand: data.quantityOnHand || 0,
    quantity_reserved: data.quantityReserved || 0,
    quantity_on_order: data.quantityOnOrder || 0,
    unit: data.unit || 'pcs',
    unit_cost: data.unitCost || 0,
    min_stock: data.minStock || 0,
    max_stock: data.maxStock || 0,
    reorder_quantity: data.reorderQuantity || 0,
    lead_time_days: data.leadTimeDays || 0,
    supplier_id: data.supplierId || null,
    notes: data.notes || null,
  });
}

export async function updateInventoryItem(id, updates) {
  const record = {};
  if (updates.quantityOnHand !== undefined) record.quantity_on_hand = updates.quantityOnHand;
  if (updates.quantityReserved !== undefined) record.quantity_reserved = updates.quantityReserved;
  if (updates.quantityOnOrder !== undefined) record.quantity_on_order = updates.quantityOnOrder;
  if (updates.minStock !== undefined) record.min_stock = updates.minStock;
  if (updates.unitCost !== undefined) record.unit_cost = updates.unitCost;
  if (updates.location !== undefined) record.location = updates.location;
  if (updates.notes !== undefined) record.notes = updates.notes;
  record.updated_at = new Date().toISOString();
  return update('inventory', id, record);
}
