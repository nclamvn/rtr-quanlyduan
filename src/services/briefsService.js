/**
 * Briefs Service — reads CEO/PM briefs from Supabase
 */
import { supabase, isSupabaseConnected } from "../lib/supabase";

export async function fetchLatestBrief(briefType = "ceo_weekly") {
  if (!isSupabaseConnected()) return { data: null, error: "Offline mode" };

  const { data, error } = await supabase
    .from("briefs")
    .select("*")
    .eq("brief_type", briefType)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) console.error("[briefsService] fetchLatestBrief error:", error);
  return { data, error };
}

export async function fetchBriefHistory(briefType = "ceo_weekly", limit = 10) {
  if (!isSupabaseConnected()) return { data: [], error: "Offline mode" };

  const { data, error } = await supabase
    .from("briefs")
    .select("id,brief_type,period_start,period_end,executive_summary,status,generated_at,decided_at")
    .eq("brief_type", briefType)
    .order("period_end", { ascending: false })
    .limit(limit);

  if (error) console.error("[briefsService] fetchBriefHistory error:", error);
  return { data: data || [], error };
}

export async function recordDecision(briefId, scenarioIndex, note, userId) {
  if (!isSupabaseConnected()) return { data: null, error: "Offline mode" };

  const { data, error } = await supabase
    .from("briefs")
    .update({
      ceo_decision: { scenario_index: scenarioIndex, note },
      decided_by: userId,
      decided_at: new Date().toISOString(),
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", briefId)
    .eq("status", "draft")
    .select()
    .maybeSingle();

  if (error) console.error("[briefsService] recordDecision error:", error);
  return { data, error };
}
