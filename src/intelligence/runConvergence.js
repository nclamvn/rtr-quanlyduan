#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// Convergence Agent Runner
// Fetches cross_app_data → detects convergence → persists alerts
// Run via cron: 0 * * * * node runConvergence.js (every hour)
// ═══════════════════════════════════════════════════════════

import { detectConvergence } from "./agents/convergenceAgent.js";
import { persistAlerts } from "./agents/alertSink.js";

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[convergence] Missing required env var: ${key}`);
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
        source_app: "convergence_agent",
        status,
        entities_synced: details,
        error_message: errorMessage || null,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[convergence] Failed to log sync_run: ${err.message}`);
  }
}

async function run() {
  const startTime = Date.now();
  console.log("[convergence] Starting...");

  try {
    // Fetch cross_app_data from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const params = new URLSearchParams({
      synced_at: `gte.${thirtyDaysAgo}`,
      order: "synced_at.desc",
      limit: "2000",
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/cross_app_data?${params}`, {
      headers: supabaseHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch cross_app_data: ${res.status} ${await res.text()}`);
    }

    const rows = await res.json();
    console.log(`[convergence] Fetched ${rows.length} cross_app_data rows`);

    // Detect
    const alerts = detectConvergence(rows);
    console.log(`[convergence] Detected ${alerts.length} alerts`);

    // Persist
    const result = await persistAlerts(SUPABASE_URL, SUPABASE_KEY, alerts);
    console.log(
      `[convergence] Persisted: ${result.inserted} new, ${result.updated} upgraded, ${result.skipped} deduped`,
    );

    const durationMs = Date.now() - startTime;
    await logSyncRun(
      "success",
      { rows_scanned: rows.length, alerts_detected: alerts.length, ...result },
      null,
      durationMs,
    );
    console.log(`[convergence] Done in ${durationMs}ms`);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[convergence] Error: ${err.message}`);
    await logSyncRun("failed", {}, err.message, durationMs);
    process.exit(1);
  }
}

run();
