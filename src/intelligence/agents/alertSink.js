// ═══════════════════════════════════════════════════════════
// Alert Sink — Persist + deduplicate agent alerts to Supabase
// Shared by all agents (convergence, causal, allocation, dispatch)
// ═══════════════════════════════════════════════════════════

const SEVERITY_RANK = { info: 0, warning: 1, critical: 2 };
const DEDUP_HOURS = 24;

/**
 * Persist alerts to Supabase `alerts` table with deduplication.
 * For each (agent, entity_ref), at most 1 open alert exists at a time.
 * If an existing open alert is found within DEDUP_HOURS, severity is upgraded if higher.
 *
 * @param {string} supabaseUrl
 * @param {string} supabaseKey - service role key
 * @param {Array} alerts - [{agent, severity, entity_ref, summary, details}]
 * @returns {{inserted: number, updated: number, skipped: number}}
 */
export async function persistAlerts(supabaseUrl, supabaseKey, alerts) {
  if (!alerts.length) return { inserted: 0, updated: 0, skipped: 0 };

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const cutoff = new Date(Date.now() - DEDUP_HOURS * 3600 * 1000).toISOString();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const alert of alerts) {
    // Check for existing open alert with same (agent, entity_ref) in dedup window
    const params = new URLSearchParams({
      agent: `eq.${alert.agent}`,
      entity_ref: `eq.${alert.entity_ref}`,
      status: `eq.open`,
      created_at: `gte.${cutoff}`,
      order: "created_at.desc",
      limit: "1",
    });

    const checkRes = await fetch(`${supabaseUrl}/rest/v1/alerts?${params}`, { headers });
    const existing = checkRes.ok ? await checkRes.json() : [];

    if (existing.length > 0) {
      const ex = existing[0];
      const existingRank = SEVERITY_RANK[ex.severity] ?? 0;
      const newRank = SEVERITY_RANK[alert.severity] ?? 0;

      if (newRank > existingRank) {
        // Upgrade severity
        await fetch(`${supabaseUrl}/rest/v1/alerts?id=eq.${ex.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            severity: alert.severity,
            summary: alert.summary,
            details: alert.details,
          }),
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Insert new alert
      const res = await fetch(`${supabaseUrl}/rest/v1/alerts`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          agent: alert.agent,
          severity: alert.severity,
          entity_ref: alert.entity_ref,
          summary: alert.summary,
          details: alert.details,
        }),
      });

      if (res.ok) {
        inserted++;
      } else {
        console.error(`[alertSink] Insert failed: ${res.status} ${await res.text()}`);
      }
    }
  }

  return { inserted, updated, skipped };
}
