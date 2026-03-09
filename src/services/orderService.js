import { query, insert, insertMany, update } from './supabaseService';
import { supabase, isSupabaseConnected } from '../lib/supabase';

export async function fetchCustomers() {
  return query('customers', {
    order: { column: 'code', asc: true },
  });
}

export async function fetchOrders(projectId = null) {
  const options = {
    select: '*, customers(name, code), order_items(*)',
    order: { column: 'created_at', asc: false },
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('orders', options);
}

export async function fetchOrderById(orderId) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline' };
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(name, code, contact_name, contact_email, payment_terms), order_items(*)')
    .eq('id', orderId)
    .single();
  return { data, error };
}

export async function createOrder(orderData, items = []) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline' };

  const record = {
    order_number: orderData.orderNumber,
    customer_id: orderData.customerId || null,
    project_id: orderData.projectId || null,
    status: orderData.status || 'QUOTE',
    priority: orderData.priority || 'NORMAL',
    order_date: orderData.orderDate || new Date().toISOString().slice(0, 10),
    po_number: orderData.poNumber || null,
    po_date: orderData.poDate || null,
    required_delivery_date: orderData.requiredDeliveryDate || null,
    promised_delivery_date: orderData.promisedDeliveryDate || null,
    shipping_method: orderData.shippingMethod || null,
    total_amount: orderData.totalAmount || 0,
    currency: orderData.currency || 'USD',
    payment_status: orderData.paymentStatus || 'UNPAID',
    notes: orderData.notes || null,
    created_by: orderData.createdBy || null,
  };

  const result = await insert('orders', record);

  if (result.data && items.length) {
    const orderItems = items.map(item => ({
      order_id: result.data.id,
      product_name: item.productName,
      product_sku: item.productSku || null,
      description: item.description || null,
      quantity: item.quantity || 1,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent || 0,
      notes: item.notes || null,
    }));
    await insertMany('order_items', orderItems);
  }

  return result;
}

export async function updateOrderStatus(orderId, status) {
  return update('orders', orderId, { status, updated_at: new Date().toISOString() });
}

export async function updateOrder(orderId, updates) {
  const record = {};
  if (updates.status !== undefined) record.status = updates.status;
  if (updates.paymentStatus !== undefined) record.payment_status = updates.paymentStatus;
  if (updates.paidAmount !== undefined) record.paid_amount = updates.paidAmount;
  if (updates.trackingNumber !== undefined) record.tracking_number = updates.trackingNumber;
  if (updates.actualDeliveryDate !== undefined) record.actual_delivery_date = updates.actualDeliveryDate;
  if (updates.notes !== undefined) record.notes = updates.notes;
  record.updated_at = new Date().toISOString();
  return update('orders', orderId, record);
}

export async function createCustomer(data) {
  return insert('customers', {
    code: data.code,
    name: data.name,
    type: data.type || 'ENTERPRISE',
    country: data.country || 'US',
    contact_name: data.contactName || null,
    contact_email: data.contactEmail || null,
    contact_phone: data.contactPhone || null,
    payment_terms: data.paymentTerms || 'NET30',
    notes: data.notes || null,
  });
}
