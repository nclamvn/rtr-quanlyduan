#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// Allocation Agent Runner
// Fetches open alerts without assignee → suggests allocation → persists
// Run via cron: every hour (0 * * * *)
// ═══════════════════════════════════════════════════════════

import { buildAllocationContext } from "./agents/allocationContext.js";
import { suggestAllocation } from "./agents/allocationAgent.js";
import { persistAllocation } from "./agents/allocationSink.js";

const MAX_ALERTS_PER_RUN = 30;

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[allocation] Missing required env var: ${key}`);
  }
  return value;
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
requireEnv("ANTHROPIC_API_KEY");

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
        source_app: "allocation_agent",
        status,
        entities_synced: details,
        error_message: errorMessage || null,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[allocation] Failed to log sync_run: ${err.message}`);
  }
}

async function fetchUnallocatedAlerts() {
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const params = new URLSearchParams({
    status: "eq.open",
    suggested_assignee: "is.null",
    created_at: `gte.${twoDaysAgo}`,
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
  console.log("[allocation] Starting...");

  try {
    const alerts = await fetchUnallocatedAlerts();
    console.log(`[allocation] ${alerts.length} unallocated alerts (max ${MAX_ALERTS_PER_RUN})`);

    if (alerts.length === 0) {
      const durationMs = Date.now() - startTime;
      await logSyncRun("success", { alerts_processed: 0 }, null, durationMs);
      console.log(`[allocation] No alerts to process. Done in ${durationMs}ms`);
      return;
    }

    let processed = 0;
    let sonnetCount = 0;
    let haikuCount = 0;
    let heuristicCount = 0;
    let totalCost = 0;
    const errors = [];

    for (const alert of alerts) {
      try {
        const context = await buildAllocationContext(alert, SUPABASE_URL, SUPABASE_KEY);
        const allocation = await suggestAllocation(alert, context);

        // Track model usage
        if (allocation.model_used === "heuristic") heuristicCount++;
        else if (allocation.model_used?.includes("haiku")) haikuCount++;
        else sonnetCount++;

        totalCost += allocation.cost_estimate_usd;

        // Persist
        const result = await persistAllocation(alert.id, allocation, SUPABASE_URL, SUPABASE_KEY);
        processed++;

        console.log(
          `[allocation] alert ${alert.id.slice(0, 8)}...: ` +
            `→ ${allocation.suggested_assignee_id?.slice(0, 8) || "none"} ` +
            `(${allocation.model_used}, confidence=${allocation.confidence}, $${allocation.cost_estimate_usd.toFixed(4)})` +
            (result.updated ? "" : " [skipped-idempotent]"),
        );
      } catch (err) {
        errors.push(`${alert.id}: ${err.message}`);
        console.error(`[allocation] Error on ${alert.id}: ${err.message}`);
      }
    }

    const durationMs = Date.now() - startTime;
    const status = errors.length === 0 ? "success" : errors.length < alerts.length ? "partial" : "failed";

    await logSyncRun(
      status,
      {
        alerts_processed: processed,
        sonnet_count: sonnetCount,
        haiku_count: haikuCount,
        heuristic_count: heuristicCount,
        total_cost_usd: Math.round(totalCost * 10000) / 10000,
      },
      errors.length > 0 ? errors.join("; ") : null,
      durationMs,
    );

    console.log(
      `[allocation] ${status.toUpperCase()} in ${durationMs}ms: ${processed} alerts, ` +
        `${sonnetCount} Sonnet / ${haikuCount} Haiku / ${heuristicCount} heuristic, ` +
        `$${totalCost.toFixed(4)} cost`,
    );

    if (status === "failed") process.exit(1);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[allocation] Fatal: ${err.message}`);
    await logSyncRun("failed", {}, err.message, durationMs);
    process.exit(1);
  }
}

run();
