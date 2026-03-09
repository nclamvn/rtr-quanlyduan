import { query, insert } from './supabaseService';

export async function fetchFinanceSummary() {
  return query('finance_summary', {
    order: { column: 'project_name', asc: true },
  });
}

export async function fetchInvoices(customerId = null) {
  const options = {
    select: '*, customers(name, code), orders(order_number)',
    order: { column: 'issue_date', asc: false },
  };
  if (customerId) options.eq = { customer_id: customerId };
  return query('invoices', options);
}

export async function fetchCostEntries(projectId = null) {
  const options = {
    select: '*, production_orders(wo_number)',
    order: { column: 'date', asc: false },
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('cost_entries', options);
}

export async function createInvoice(data) {
  return insert('invoices', {
    invoice_number: data.invoiceNumber,
    order_id: data.orderId || null,
    customer_id: data.customerId || null,
    issue_date: data.issueDate,
    due_date: data.dueDate,
    subtotal: data.subtotal || 0,
    tax_amount: data.taxAmount || 0,
    total_amount: data.totalAmount || 0,
    paid_amount: data.paidAmount || 0,
    status: data.status || 'DRAFT',
    currency: data.currency || 'USD',
    notes: data.notes || null,
  });
}

export async function createCostEntry(data) {
  return insert('cost_entries', {
    production_order_id: data.productionOrderId || null,
    project_id: data.projectId || null,
    category: data.category,
    description: data.description,
    amount: data.amount,
    currency: data.currency || 'USD',
    date: data.date || new Date().toISOString().slice(0, 10),
    vendor: data.vendor || null,
    receipt_ref: data.receiptRef || null,
    notes: data.notes || null,
    created_by: data.createdBy || null,
  });
}
