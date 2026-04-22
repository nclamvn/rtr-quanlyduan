#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// Forecast Agent Runner
// Generates daily statistical forecasts (milestone slip + part EOL)
// Run via cron: daily at 6 AM ICT (23:00 UTC)
// ═══════════════════════════════════════════════════════════

import { runForecasts } from "./agents/forecastAgent.js";

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[forecast] Missing required env var: ${key}`);
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
        source_app: "forecast_agent",
        status,
        entities_synced: details,
        error_message: errorMessage || null,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[forecast] Failed to log sync_run: ${err.message}`);
  }
}

async function run() {
  const startTime = Date.now();
  console.log("[forecast] Starting daily forecast generation...");

  try {
    const result = await runForecasts(SUPABASE_URL, SUPABASE_KEY);
    const durationMs = Date.now() - startTime;

    await logSyncRun("success", result, null, durationMs);

    console.log(
      `[forecast] Done in ${durationMs}ms: ` +
        `${result.milestone_forecasts} milestone, ${result.eol_forecasts} EOL, ` +
        `${result.alerts_created} alerts created`,
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[forecast] Fatal: ${err.message}`);
    await logSyncRun("failed", {}, err.message, durationMs);
    process.exit(1);
  }
}

run();
