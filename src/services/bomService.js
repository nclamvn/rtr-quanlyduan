import { query } from './supabaseService';

export async function fetchBomParts(projectId = null) {
  const options = {
    select: '*, suppliers(name, code, country, qualification_status)',
    order: { column: 'sort_order', asc: true },
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('bom_parts', options);
}

export async function fetchSuppliers() {
  return query('suppliers', {
    order: { column: 'name', asc: true },
  });
}

export async function fetchDeliveryRecords(supplierId = null, limit = 500) {
  const options = {
    order: { column: 'order_date', asc: false },
    limit,
  };
  if (supplierId) options.eq = { supplier_id: supplierId };
  return query('delivery_records', options);
}
