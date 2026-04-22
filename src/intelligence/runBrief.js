#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// CEO Weekly Brief Runner
// Generates executive brief every Sunday 22:00 ICT (15:00 UTC)
// CEO reads Monday morning, picks scenario, records decision
// ═══════════════════════════════════════════════════════════

import { aggregateWeekData } from "./brief/aggregator.js";
import { generateBrief } from "./brief/briefGenerator.js";

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[brief] Missing required env var: ${key}`);
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

/**
 * Compute period: previous Monday → this Sunday.
 */
function computePeriod() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const thisSunday = new Date(now);
  thisSunday.setDate(now.getDate() - dayOfWeek);
  const prevMonday = new Date(thisSunday);
  prevMonday.setDate(thisSunday.getDate() - 6);

  return {
    start: prevMonday.toISOString().split("T")[0],
    end: thisSunday.toISOString().split("T")[0],
  };
}

async function logSyncRun(status, details, errorMessage, durationMs) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sync_runs`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        source_app: "brief_agent",
        status,
        entities_synced: details,
        error_message: errorMessage || null,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[brief] Failed to log sync_run: ${err.message}`);
  }
}

async function run() {
  const startTime = Date.now();
  const period = computePeriod();
  console.log(`[brief] Generating CEO weekly brief for ${period.start} → ${period.end}`);

  try {
    // Check duplicate
    const headers = supabaseHeaders();
    const checkUrl =
      `${SUPABASE_URL}/rest/v1/briefs` +
      `?brief_type=eq.ceo_weekly` +
      `&period_start=eq.${period.start}` +
      `&period_end=eq.${period.end}` +
      `&select=id` +
      `&limit=1`;
    const checkRes = await fetch(checkUrl, { headers });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.length > 0) {
        console.log(`[brief] Brief already exists for this period (${existing[0].id}). Skipping.`);
        await logSyncRun("success", { skipped: true, reason: "duplicate" }, null, Date.now() - startTime);
        return;
      }
    }

    // Aggregate data
    console.log("[brief] Aggregating week data...");
    const context = await aggregateWeekData(SUPABASE_URL, SUPABASE_KEY, period.start, period.end);

    // Generate brief via LLM
    console.log("[brief] Generating brief via Sonnet...");
    const result = await generateBrief(context);

    // Persist
    const briefRow = {
      brief_type: "ceo_weekly",
      period_start: period.start,
      period_end: period.end,
      executive_summary: result.brief.executive_summary,
      highlights: result.brief.highlights,
      scenarios: result.brief.scenarios,
      recommendations: result.brief.recommendations,
      risk_summary: result.brief.risk_summary,
      metrics_snapshot: context,
      model_used: result.model_used,
      cost_estimate_usd: result.cost_estimate_usd,
      status: "draft",
    };

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/briefs`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(briefRow),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Insert brief failed: ${insertRes.status} ${err}`);
    }

    const rows = await insertRes.json();
    const briefId = rows[0]?.id;

    const durationMs = Date.now() - startTime;
    await logSyncRun(
      "success",
      {
        brief_id: briefId,
        model: result.model_used,
        cost_usd: result.cost_estimate_usd,
        tokens: result.tokens,
      },
      null,
      durationMs,
    );

    console.log(
      `[brief] Done in ${durationMs}ms: brief ${briefId}, ` +
        `${result.model_used}, $${result.cost_estimate_usd.toFixed(4)}`,
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[brief] Fatal: ${err.message}`);
    await logSyncRun("failed", {}, err.message, durationMs);
    process.exit(1);
  }
}

run();
