// ═══════════════════════════════════════════════════════════
// Causal Agent — LLM-powered root cause tracing
// Input: 1 MRP signal + context → Output: causal chain + alert
// ═══════════════════════════════════════════════════════════

import { callWithEscalation } from "./llmRouter.js";
import { SYSTEM_PROMPT, DEEP_ANALYSIS_SUFFIX, buildUserPrompt } from "./prompts/causalChain.js";

const SEVERITY_MAP = {
  low: "info",
  medium: "warning",
  high: "critical",
  critical: "critical",
};

/**
 * Analyze causal chain for a single signal.
 *
 * @param {object} signal - 1 row from cross_app_data
 * @param {object} context - { projectEntities: [], relatedParts: [], relatedOrders: [] }
 * @returns {{ alert: object|null, chain: object, modelUsed: string, costEstimateUsd: number, escalated: boolean }}
 */
export async function analyzeCausalChain(signal, context) {
  const userPrompt = buildUserPrompt(signal, context);

  const result = await callWithEscalation(SYSTEM_PROMPT, userPrompt, DEEP_ANALYSIS_SUFFIX);

  if (!result.parsed) {
    return {
      alert: {
        agent: "causal",
        severity: "info",
        entity_ref: signal.project_link || `${signal.source_app}:${signal.entity_type}:${signal.entity_id}`,
        summary: `Causal analysis inconclusive for ${signal.title || signal.entity_id}`,
        details: {
          raw_response: result.content.slice(0, 500),
          model_used: result.modelUsed,
          cost_usd: result.costEstimateUsd,
          parse_error: true,
        },
      },
      chain: null,
      modelUsed: result.modelUsed,
      costEstimateUsd: result.costEstimateUsd,
      escalated: result.escalated,
    };
  }

  const chain = result.parsed;
  const alertSeverity = SEVERITY_MAP[chain.impact_severity] || "info";

  return {
    alert: {
      agent: "causal",
      severity: alertSeverity,
      entity_ref: signal.project_link || `${signal.source_app}:${signal.entity_type}:${signal.entity_id}`,
      summary: chain.root_cause,
      details: {
        cascade: chain.cascade || [],
        cascade_depth: (chain.cascade || []).length,
        impact_severity: chain.impact_severity,
        recommended_action: chain.recommended_action,
        confidence: chain.confidence,
        signal_id: signal.entity_id,
        signal_title: signal.title,
        model_used: result.modelUsed,
        cost_usd: result.costEstimateUsd,
        escalated: result.escalated,
      },
    },
    chain,
    modelUsed: result.modelUsed,
    costEstimateUsd: result.costEstimateUsd,
    escalated: result.escalated,
  };
}

/**
 * Build context for a signal by querying related entities from cross_app_data.
 *
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @param {object} signal
 * @returns {object} context
 */
export async function buildContext(supabaseUrl, supabaseKey, signal) {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const context = { projectEntities: [], relatedParts: [], relatedOrders: [] };

  // Fetch entities from same project
  if (signal.project_link) {
    const params = new URLSearchParams({
      project_link: `eq.${signal.project_link}`,
      order: "synced_at.desc",
      limit: "50",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/cross_app_data?${params}`, { headers });
    if (res.ok) {
      context.projectEntities = await res.json();
    }
  }

  // If signal is a work_order, find related inventory alerts by part references
  if (signal.entity_type === "work_order" && signal.data?.productCode) {
    const params = new URLSearchParams({
      entity_type: "eq.inventory_alert",
      order: "synced_at.desc",
      limit: "20",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/cross_app_data?${params}`, { headers });
    if (res.ok) {
      const alerts = await res.json();
      context.relatedParts = alerts.filter(
        (a) =>
          a.data?.partNumber &&
          signal.data?.productCode &&
          a.title?.toLowerCase().includes(signal.data.productCode.toLowerCase()),
      );
      // Also include critical/urgent inventory alerts
      if (context.relatedParts.length === 0) {
        context.relatedParts = alerts.filter((a) => a.priority === "urgent").slice(0, 5);
      }
    }
  }

  // Fetch related sales orders
  if (signal.entity_type === "work_order") {
    const params = new URLSearchParams({
      entity_type: "eq.sales_order",
      order: "synced_at.desc",
      limit: "10",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/cross_app_data?${params}`, { headers });
    if (res.ok) {
      context.relatedOrders = await res.json();
    }
  }

  return context;
}
