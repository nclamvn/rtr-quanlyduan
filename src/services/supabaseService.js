import { supabase, isSupabaseConnected } from '../lib/supabase';

// Generic query builder with error handling
export async function query(table, options = {}) {
  if (!isSupabaseConnected()) return { data: [], error: 'Offline mode' };

  let q = supabase.from(table).select(options.select || '*');

  if (options.eq) Object.entries(options.eq).forEach(([k, v]) => { q = q.eq(k, v); });
  if (options.in) Object.entries(options.in).forEach(([k, v]) => { q = q.in(k, v); });
  if (options.neq) Object.entries(options.neq).forEach(([k, v]) => { q = q.neq(k, v); });
  if (options.order) q = q.order(options.order.column, { ascending: options.order.asc ?? true });
  if (options.limit) q = q.limit(options.limit);

  const { data, error } = await q;
  if (error) console.error(`Query ${table} error:`, error);
  return { data: data || [], error };
}

// Generic insert
export async function insert(table, record) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline mode' };
  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) console.error(`Insert ${table} error:`, error);
  return { data, error };
}

// Generic insert many
export async function insertMany(table, records) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline mode' };
  const { data, error } = await supabase.from(table).insert(records).select();
  if (error) console.error(`InsertMany ${table} error:`, error);
  return { data, error };
}

// Generic update
export async function update(table, id, updates, idColumn = 'id') {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline mode' };
  const { data, error } = await supabase.from(table).update(updates).eq(idColumn, id).select().single();
  if (error) console.error(`Update ${table} error:`, error);
  return { data, error };
}

// Generic upsert
export async function upsert(table, record) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline mode' };
  const { data, error } = await supabase.from(table).upsert(record).select().single();
  if (error) console.error(`Upsert ${table} error:`, error);
  return { data, error };
}

export { supabase, isSupabaseConnected };
