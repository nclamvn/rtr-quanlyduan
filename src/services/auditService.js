import { supabase, isSupabaseConnected } from '../lib/supabase';

const LS_KEY = 'rtr_audit_log';
const MAX_ENTRIES = 500;

export async function logAudit(entry) {
  if (!isSupabaseConnected()) {
    // Fallback: localStorage
    const logs = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    logs.unshift({ ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    localStorage.setItem(LS_KEY, JSON.stringify(logs.slice(0, MAX_ENTRIES)));
    return;
  }

  await supabase.from('audit_log').insert({
    user_id: entry.userId,
    user_name: entry.userName,
    user_role: entry.userRole,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    entity_title: entry.entityTitle,
    old_value: entry.oldValue,
    new_value: entry.newValue,
    metadata: entry.metadata,
  });
}

export async function fetchAuditLogs(filters = {}) {
  if (!isSupabaseConnected()) {
    const logs = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    let result = logs;
    if (filters.action && filters.action !== 'ALL') result = result.filter(l => l.action === filters.action);
    if (filters.userId && filters.userId !== 'ALL') result = result.filter(l => l.userId === filters.userId);
    if (filters.entityType) result = result.filter(l => l.entityType === filters.entityType);
    return { data: result, error: null };
  }

  let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(MAX_ENTRIES);

  if (filters.action && filters.action !== 'ALL') q = q.eq('action', filters.action);
  if (filters.userId && filters.userId !== 'ALL') q = q.eq('user_id', filters.userId);
  if (filters.entityType) q = q.eq('entity_type', filters.entityType);

  return await q;
}

export async function clearAuditLogs() {
  if (!isSupabaseConnected()) {
    localStorage.removeItem(LS_KEY);
    return;
  }
  // Delete all — admin only (RLS enforced)
  await supabase.from('audit_log').delete().gte('created_at', '1970-01-01');
}

export function exportAuditCSV(logs) {
  const BOM = "\uFEFF";
  const headers = ["ID", "Timestamp", "User", "Role", "Action", "Entity Type", "Entity ID", "Entity Title", "Old Value", "New Value"];
  const rows = logs.map(l => [
    l.id, l.created_at || l.timestamp, l.user_name || l.userName, l.user_role || l.userRole,
    l.action, l.entity_type || l.entityType, l.entity_id || l.entityId,
    l.entity_title || l.entityTitle, l.old_value || l.oldValue || "",
    l.new_value || l.newValue || "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return BOM + [headers.join(","), ...rows].join("\n");
}
