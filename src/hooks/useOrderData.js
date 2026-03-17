import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase, getConnectionStatus } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import { fetchOrders, fetchCustomers } from '../services/orderService';

// ═══ Transform Supabase snake_case → App camelCase ═══

function transformOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customers?.name || '',
    customerCode: row.customers?.code || '',
    projectId: row.project_id,
    status: row.status,
    priority: row.priority,
    orderDate: row.order_date,
    poNumber: row.po_number,
    poDate: row.po_date,
    requiredDeliveryDate: row.required_delivery_date,
    promisedDeliveryDate: row.promised_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    shippingMethod: row.shipping_method,
    trackingNumber: row.tracking_number,
    subtotal: parseFloat(row.subtotal) || 0,
    taxRate: parseFloat(row.tax_rate) || 0,
    taxAmount: parseFloat(row.tax_amount) || 0,
    discountAmount: parseFloat(row.discount_amount) || 0,
    totalAmount: parseFloat(row.total_amount) || 0,
    currency: row.currency,
    paymentStatus: row.payment_status,
    paidAmount: parseFloat(row.paid_amount) || 0,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    items: (row.order_items || []).map(item => ({
      id: item.id,
      productName: item.product_name,
      productSku: item.product_sku,
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price) || 0,
      discountPercent: parseFloat(item.discount_percent) || 0,
      lineTotal: parseFloat(item.line_total) || 0,
      notes: item.notes,
    })),
  };
}

function transformCustomer(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    country: row.country,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    billingAddress: row.billing_address,
    shippingAddress: row.shipping_address,
    paymentTerms: row.payment_terms,
    notes: row.notes,
    isActive: row.is_active,
  };
}

// ═══ STATIC FALLBACK DATA ═══
import { DEMO_ORDERS, DEMO_CUSTOMERS } from '../data/businessDemoData';
const STATIC_ORDERS = DEMO_ORDERS;
const STATIC_CUSTOMERS = DEMO_CUSTOMERS;

// ═══ HOOKS ═══

export function useOrders(projectId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_ORDERS);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchOrders(projectId));
      setData(rows?.length ? rows.map(transformOrder) : STATIC_ORDERS);
    } catch (err) {
      console.warn('Orders fetch timeout:', err.message);
      setData(STATIC_ORDERS);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  useRealtimeSubscription('orders', {
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
  });

  return { data, loading, refetch };
}

export function useCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setData(STATIC_CUSTOMERS);
      setLoading(false);
      return;
    }
    try {
      const { data: rows } = await withTimeout(fetchCustomers());
      setData(rows?.length ? rows.map(transformCustomer) : STATIC_CUSTOMERS);
    } catch (err) {
      console.warn('Customers fetch timeout:', err.message);
      setData(STATIC_CUSTOMERS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  return { data, loading, refetch };
}
