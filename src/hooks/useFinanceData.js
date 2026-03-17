import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase, getConnectionStatus } from '../lib/supabase';
import { fetchFinanceSummary, fetchInvoices, fetchCostEntries } from '../services/financeService';

// ═══ Transform ═══

function transformFinanceSummary(row) {
  return {
    projectId: row.project_id,
    projectName: row.project_name,
    totalRevenue: parseFloat(row.total_revenue) || 0,
    totalCollected: parseFloat(row.total_collected) || 0,
    outstandingAr: parseFloat(row.outstanding_ar) || 0,
    totalCosts: parseFloat(row.total_costs) || 0,
    grossMargin: parseFloat(row.gross_margin) || 0,
    orderCount: row.order_count || 0,
    overdueCount: row.overdue_count || 0,
    marginPercent: row.total_revenue > 0
      ? ((row.gross_margin / row.total_revenue) * 100)
      : 0,
  };
}

function transformInvoice(row) {
  const today = new Date();
  const dueDate = new Date(row.due_date);
  const daysPastDue = row.status !== 'PAID' && row.status !== 'CANCELLED'
    ? Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || '',
    customerId: row.customer_id,
    customerName: row.customers?.name || '',
    customerCode: row.customers?.code || '',
    issueDate: row.issue_date,
    dueDate: row.due_date,
    subtotal: parseFloat(row.subtotal) || 0,
    taxAmount: parseFloat(row.tax_amount) || 0,
    totalAmount: parseFloat(row.total_amount) || 0,
    paidAmount: parseFloat(row.paid_amount) || 0,
    balance: (parseFloat(row.total_amount) || 0) - (parseFloat(row.paid_amount) || 0),
    status: row.status,
    currency: row.currency,
    notes: row.notes,
    daysPastDue,
    agingBucket: daysPastDue === 0 ? 'CURRENT'
      : daysPastDue <= 30 ? '1-30'
      : daysPastDue <= 60 ? '31-60'
      : daysPastDue <= 90 ? '61-90'
      : '90+',
  };
}

function transformCostEntry(row) {
  return {
    id: row.id,
    productionOrderId: row.production_order_id,
    woNumber: row.production_orders?.wo_number || '',
    projectId: row.project_id,
    category: row.category,
    description: row.description,
    amount: parseFloat(row.amount) || 0,
    currency: row.currency,
    date: row.date,
    vendor: row.vendor,
    receiptRef: row.receipt_ref,
    notes: row.notes,
    createdBy: row.created_by,
  };
}

// ═══ STATIC FALLBACK ═══
import { DEMO_FINANCE_SUMMARY, DEMO_INVOICES, DEMO_COST_ENTRIES } from '../data/businessDemoData';
const STATIC_SUMMARY = DEMO_FINANCE_SUMMARY;
const STATIC_INVOICES = DEMO_INVOICES;
const STATIC_COSTS = DEMO_COST_ENTRIES;

// ═══ HOOKS ═══

export function useFinanceSummary() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_SUMMARY);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchFinanceSummary());
      setData(rows?.length ? rows.map(transformFinanceSummary) : STATIC_SUMMARY);
    } catch (err) {
      console.warn('Finance summary fetch timeout:', err.message);
      setData(STATIC_SUMMARY);
    }
    setLoading(false);
  }, []);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  return { data, loading, refetch };
}

export function useInvoices(customerId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_INVOICES);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchInvoices(customerId));
      setData(rows?.length ? rows.map(transformInvoice) : STATIC_INVOICES);
    } catch (err) {
      console.warn('Invoices fetch timeout:', err.message);
      setData(STATIC_INVOICES);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  return { data, loading, refetch };
}

export function useCostEntries(projectId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_COSTS);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchCostEntries(projectId));
      setData(rows?.length ? rows.map(transformCostEntry) : STATIC_COSTS);
    } catch (err) {
      console.warn('Cost entries fetch timeout:', err.message);
      setData(STATIC_COSTS);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  return { data, loading, refetch };
}
