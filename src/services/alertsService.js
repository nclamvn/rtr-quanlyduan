/**
 * Alerts Service — reads agent-generated alerts from Supabase
 * Consumer-side only (no writes — agents write, UI reads)
 */
import { supabase, isSupabaseConnected } from "../lib/supabase";

/**
 * Fetch alerts with optional filters.
 */
export async function fetchAlerts({ status, severity, agent, limit = 50 } = {}) {
  if (!isSupabaseConnected()) return { data: [], error: "Offline mode" };

  let q = supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(limit);

  if (status && status !== "ALL") q = q.eq("status", status);
  if (severity && severity !== "ALL") q = q.eq("severity", severity);
  if (agent && agent !== "ALL") q = q.eq("agent", agent);

  const { data, error } = await q;
  if (error) console.error("[alertsService] fetchAlerts error:", error);
  return { data: data || [], error };
}

/**
 * Fetch a single alert by ID.
 */
export async function fetchAlertById(id) {
  if (!isSupabaseConnected()) return { data: null, error: "Offline mode" };

  const { data, error } = await supabase.from("alerts").select("*").eq("id", id).single();
  if (error) console.error("[alertsService] fetchAlertById error:", error);
  return { data, error };
}

/**
 * Fetch related alerts for the same entity_ref.
 */
export async function fetchAlertHistory(entityRef, limit = 10) {
  if (!isSupabaseConnected()) return { data: [], error: "Offline mode" };

  const { data, error } = await supabase
    .from("alerts")
    .select("id,agent,severity,summary,status,created_at")
    .eq("entity_ref", entityRef)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) console.error("[alertsService] fetchAlertHistory error:", error);
  return { data: data || [], error };
}

/**
 * Subscribe to real-time alert changes.
 * Returns unsubscribe function.
 */
export function subscribeToAlerts(callback) {
  if (!isSupabaseConnected()) return () => {};

  const channel = supabase
    .channel("alerts-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Count open alerts (for badge).
 */
export async function countOpenAlerts() {
  if (!isSupabaseConnected()) return 0;

  const { count, error } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  if (error) return 0;
  return count || 0;
}
