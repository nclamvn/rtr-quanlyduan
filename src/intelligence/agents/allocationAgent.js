// ═══════════════════════════════════════════════════════════
// Allocation Agent — Suggest assignee + deadline for open alerts
// Input: alert + allocation context → Output: suggestion
// ═══════════════════════════════════════════════════════════

import { callLLM, HAIKU, SONNET } from "./llmRouter.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts/allocation.js";

/**
 * Suggest assignee + deadline for an alert.
 *
 * Model routing:
 * - Sonnet default (assignment is an important decision)
 * - Haiku only if urgency='low' AND candidates ≤ 3
 *
 * Falls back to heuristic if insufficient_data.
 *
 * @param {object} alert - row from alerts table
 * @param {object} context - from buildAllocationContext
 * @returns {{ suggested_assignee_id, suggested_deadline, rationale, confidence, alternative_assignees, model_used, cost_estimate_usd }}
 */
export async function suggestAllocation(alert, context) {
  // Heuristic fallback if no candidates
  if (context.insufficient_data || context.candidates.length === 0) {
    return heuristicFallback(alert, context);
  }

  // Model routing
  const useHaiku = context.urgency_hint === "low" && context.candidates.length <= 3;
  const model = useHaiku ? HAIKU : SONNET;

  const userPrompt = buildUserPrompt(alert, context);
  const result = await callLLM(SYSTEM_PROMPT, userPrompt, { model });

  let parsed;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    // LLM returned unparseable response — heuristic fallback
    return {
      ...heuristicFallback(alert, context),
      model_used: result.modelUsed,
      cost_estimate_usd: result.costEstimateUsd,
      _parse_error: true,
    };
  }

  // Validate suggested_assignee_id is in candidates
  const validIds = new Set(context.candidates.map((c) => c.id));
  const assigneeId = validIds.has(parsed.suggested_assignee_id) ? parsed.suggested_assignee_id : null;

  // Validate alternatives
  const alternatives = (parsed.alternative_assignees || []).filter((a) => validIds.has(a.id)).slice(0, 2);

  return {
    suggested_assignee_id: assigneeId,
    suggested_deadline: parsed.suggested_deadline || defaultDeadline(alert.severity),
    rationale: parsed.rationale || "No rationale provided",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    alternative_assignees: alternatives,
    model_used: result.modelUsed,
    cost_estimate_usd: result.costEstimateUsd,
  };
}

/**
 * Heuristic fallback when LLM can't be used (no candidates or insufficient data).
 * Round-robin: pick candidate with lowest current_load.
 */
function heuristicFallback(alert, context) {
  const candidates = context.candidates || [];

  // Sort by current_load ascending
  const sorted = [...candidates].sort((a, b) => a.current_load - b.current_load);
  const assignee = sorted[0] || null;

  return {
    suggested_assignee_id: assignee?.id || null,
    suggested_deadline: defaultDeadline(alert.severity),
    rationale: assignee
      ? `Heuristic: assigned to ${assignee.name} (lowest current load: ${assignee.current_load}). No LLM analysis — insufficient context data.`
      : "No candidates available. Escalate to project lead.",
    confidence: assignee ? 0.3 : 0.0,
    alternative_assignees: sorted.slice(1, 3).map((c) => ({
      id: c.id,
      why_considered: `Load: ${c.current_load}`,
    })),
    model_used: "heuristic",
    cost_estimate_usd: 0,
  };
}

function defaultDeadline(severity) {
  const days = severity === "critical" ? 2 : severity === "warning" ? 5 : 10;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
