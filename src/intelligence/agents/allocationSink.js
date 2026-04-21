// ═══════════════════════════════════════════════════════════
// Allocation Sink — Persist assignee suggestions to alerts table
// Idempotent: won't overwrite if suggestion already exists
// ═══════════════════════════════════════════════════════════

/**
 * Update an alert with allocation suggestion.
 * Only writes if status='open' AND suggested_assignee IS NULL (idempotent).
 *
 * @param {string} alertId - UUID of the alert
 * @param {object} allocation - from suggestAllocation()
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @returns {{ updated: boolean }}
 */
export async function persistAllocation(alertId, allocation, supabaseUrl, supabaseKey) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const body = {
    suggested_assignee: allocation.suggested_assignee_id,
    suggested_deadline: allocation.suggested_deadline,
    allocation_rationale: allocation.rationale,
    allocation_confidence: allocation.confidence,
  };

  // Conditional update: only if open + no existing suggestion
  const params = new URLSearchParams({
    id: `eq.${alertId}`,
    status: "eq.open",
    suggested_assignee: "is.null",
  });

  const res = await fetch(`${supabaseUrl}/rest/v1/alerts?${params}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=headers-only" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[allocationSink] Update failed for alert ${alertId}: ${res.status}`);
    return { updated: false };
  }

  // Check content-range to see if any row was actually updated
  const range = res.headers.get("content-range");
  const updated = range ? !range.startsWith("*/0") : true;

  return { updated };
}
