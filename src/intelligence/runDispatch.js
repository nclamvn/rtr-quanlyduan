#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// Dispatch Agent Runner
// Fetches open alerts with assignee but not yet dispatched
// → routes notifications via confidence-gated channels
// Run via cron: every 15 minutes (*/15 * * * *)
// ═══════════════════════════════════════════════════════════

import { dispatchAlert } from "./agents/dispatchAgent.js";

const MAX_ALERTS_PER_RUN = 50;

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[dispatch] Missing required env var: ${key}`);
  }
  return value;
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_KEY = requireEnv("SUPABASE_SERVICE_KEY");

function supabaseHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

async function logSyncRun(status, details, errorMessage, durationMs) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sync_runs`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        source_app: "dispatch_agent",
        status,
        entities_synced: details,
        error_message: errorMessage || null,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[dispatch] Failed to log sync_run: ${err.message}`);
  }
}

async function fetchPendingAlerts() {
  const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

  const params = new URLSearchParams({
    status: "eq.open",
    suggested_assignee: "not.is.null",
    dispatched_at: "is.null",
    created_at: `gte.${threeDaysAgo}`,
    order: "created_at.desc",
    limit: String(MAX_ALERTS_PER_RUN),
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/alerts?${params}`, {
    headers: supabaseHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
  return res.json();
}

async function run() {
  const startTime = Date.now();
  console.log("[dispatch] Starting...");

  try {
    const alerts = await fetchPendingAlerts();
    console.log(`[dispatch] ${alerts.length} pending alerts (max ${MAX_ALERTS_PER_RUN})`);

    if (alerts.length === 0) {
      const durationMs = Date.now() - startTime;
      await logSyncRun("success", { dispatched: 0 }, null, durationMs);
      console.log(`[dispatch] No alerts to dispatch. Done in ${durationMs}ms`);
      return;
    }

    let dispatched = 0;
    let skipped = 0;
    let failed = 0;
    const byGate = { auto: 0, cc_lead: 0, queued_review: 0, skipped: 0 };
    const errors = [];

    for (const alert of alerts) {
      try {
        const result = await dispatchAlert(alert, SUPABASE_URL, SUPABASE_KEY);

        if (result.skipped) {
          skipped++;
          byGate[result.gate === "already_dispatched" ? "skipped" : result.gate]++;
        } else {
          dispatched++;
          byGate[result.gate]++;
        }

        console.log(
          `[dispatch] alert ${alert.id.slice(0, 8)}...: ` +
            `gate=${result.gate}, sent=[${result.channels_sent.join(",")}]` +
            (result.channels_failed.length ? `, failed=[${result.channels_failed.join(",")}]` : ""),
        );
      } catch (err) {
        failed++;
        errors.push(`${alert.id}: ${err.message}`);
        console.error(`[dispatch] Error on ${alert.id}: ${err.message}`);
      }
    }

    const durationMs = Date.now() - startTime;
    const status = failed === 0 ? "success" : failed < alerts.length ? "partial" : "failed";

    await logSyncRun(
      status,
      { dispatched, skipped, failed, by_gate: byGate },
      errors.length > 0 ? errors.join("; ") : null,
      durationMs,
    );

    console.log(
      `[dispatch] ${status.toUpperCase()} in ${durationMs}ms: ` +
        `${dispatched} dispatched, ${skipped} skipped, ${failed} failed ` +
        `(auto=${byGate.auto}, cc=${byGate.cc_lead}, queued=${byGate.queued_review})`,
    );

    if (status === "failed") process.exit(1);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[dispatch] Fatal: ${err.message}`);
    await logSyncRun("failed", {}, err.message, durationMs);
    process.exit(1);
  }
}

run();
