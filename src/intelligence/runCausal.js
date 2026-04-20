#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// Causal Agent Runner
// Fetches high-priority MRP signals → LLM causal analysis → alerts
// Run via cron: every 2 hours (0 */2 * * *)
// ═══════════════════════════════════════════════════════════

import { analyzeCausalChain, buildContext } from "./agents/causalAgent.js";
import { persistAlerts } from "./agents/alertSink.js";

const MAX_SIGNALS_PER_RUN = 20;

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[causal] Missing required env var: ${key}`);
  }
  return value;
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
requireEnv("ANTHROPIC_API_KEY"); // Validated here, used by SDK via env

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
        source_app: "causal_agent",
        status,
        entities_synced: details,
        error_message: errorMessage || null,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[causal] Failed to log sync_run: ${err.message}`);
  }
}

async function fetchCandidateSignals() {
  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

  // Get high-priority MRP signals from last 2 hours
  const params = new URLSearchParams({
    source_app: "eq.MRP",
    priority: "in.(high,urgent)",
    synced_at: `gte.${twoHoursAgo}`,
    order: "synced_at.desc",
    limit: String(MAX_SIGNALS_PER_RUN * 2),
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/cross_app_data?${params}`, {
    headers: supabaseHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch signals: ${res.status}`);
  }

  const signals = await res.json();

  // Filter out signals that already have an open causal alert in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const alertParams = new URLSearchParams({
    agent: "eq.causal",
    status: "eq.open",
    created_at: `gte.${oneDayAgo}`,
    select: "entity_ref",
  });

  const alertRes = await fetch(`${SUPABASE_URL}/rest/v1/alerts?${alertParams}`, {
    headers: supabaseHeaders(),
  });

  const existingRefs = new Set();
  if (alertRes.ok) {
    const existing = await alertRes.json();
    for (const a of existing) {
      existingRefs.add(a.entity_ref);
    }
  }

  return signals
    .filter((s) => {
      const ref = s.project_link || `${s.source_app}:${s.entity_type}:${s.entity_id}`;
      return !existingRefs.has(ref);
    })
    .slice(0, MAX_SIGNALS_PER_RUN);
}

async function run() {
  const startTime = Date.now();
  console.log("[causal] Starting...");

  try {
    const signals = await fetchCandidateSignals();
    console.log(`[causal] ${signals.length} candidate signals (max ${MAX_SIGNALS_PER_RUN})`);

    if (signals.length === 0) {
      const durationMs = Date.now() - startTime;
      await logSyncRun("success", { signals_processed: 0 }, null, durationMs);
      console.log(`[causal] No signals to process. Done in ${durationMs}ms`);
      return;
    }

    let processed = 0;
    let sonnetEscalations = 0;
    let totalCost = 0;
    const alerts = [];
    const errors = [];

    for (const signal of signals) {
      try {
        const context = await buildContext(SUPABASE_URL, SUPABASE_KEY, signal);
        const result = await analyzeCausalChain(signal, context);

        if (result.alert) alerts.push(result.alert);
        if (result.escalated) sonnetEscalations++;
        totalCost += result.costEstimateUsd;
        processed++;

        console.log(
          `[causal] ${signal.title || signal.entity_id}: ${result.chain?.impact_severity || "unknown"} ` +
            `(${result.modelUsed}, $${result.costEstimateUsd.toFixed(4)})`,
        );
      } catch (err) {
        errors.push(`${signal.entity_id}: ${err.message}`);
        console.error(`[causal] Error on ${signal.entity_id}: ${err.message}`);
      }
    }

    // Persist all alerts
    const persistResult = await persistAlerts(SUPABASE_URL, SUPABASE_KEY, alerts);

    const durationMs = Date.now() - startTime;
    const status = errors.length === 0 ? "success" : errors.length < signals.length ? "partial" : "failed";

    await logSyncRun(
      status,
      {
        signals_processed: processed,
        sonnet_escalations: sonnetEscalations,
        alerts_created: persistResult.inserted,
        alerts_upgraded: persistResult.updated,
        total_cost_usd: Math.round(totalCost * 10000) / 10000,
      },
      errors.length > 0 ? errors.join("; ") : null,
      durationMs,
    );

    console.log(
      `[causal] ${status.toUpperCase()} in ${durationMs}ms: ${processed} signals, ` +
        `${sonnetEscalations} escalations, $${totalCost.toFixed(4)} total cost`,
    );

    if (status === "failed") process.exit(1);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[causal] Fatal: ${err.message}`);
    await logSyncRun("failed", {}, err.message, durationMs);
    process.exit(1);
  }
}

run();
