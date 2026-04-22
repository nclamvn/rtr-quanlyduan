// ═══════════════════════════════════════════════════════════
// CEO Weekly Brief Generator — LLM-powered executive summary
// Uses Sonnet for reasoning depth on strategic decisions
// ═══════════════════════════════════════════════════════════

import { callLLM, SONNET } from "../agents/llmRouter.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts/ceoWeekly.js";

/**
 * Generate a CEO weekly brief from aggregated data.
 *
 * @param {object} context - from aggregateWeekData
 * @returns {{ brief: object, model_used: string, cost_estimate_usd: number, tokens: object }}
 */
export async function generateBrief(context) {
  const userPrompt = buildUserPrompt(context);

  const result = await callLLM(SYSTEM_PROMPT, userPrompt, {
    model: SONNET,
    maxTokens: 2048,
    temperature: 0.4, // slightly more creative than causal agent, but still deterministic-ish
  });

  let parsed;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    // LLM returned non-JSON — wrap as fallback
    return {
      brief: {
        executive_summary: "Không thể tạo báo cáo tự động. Vui lòng review data thủ công.",
        highlights: [{ icon: "⚠️", title: "LLM parse error", body: result.content.slice(0, 200) }],
        scenarios: [
          {
            title: "Kịch bản duy nhất",
            description: "Review thủ công cần thiết",
            trade_offs: { pros: [], cons: ["Không có AI analysis"] },
            probability_of_success: 0,
            resource_needed: "Manual review",
          },
          {
            title: "Kịch bản B",
            description: "Chờ brief tiếp theo",
            trade_offs: { pros: ["Không tốn effort"], cons: ["Mất 1 tuần insight"] },
            probability_of_success: 0.5,
            resource_needed: "None",
          },
          {
            title: "Kịch bản C",
            description: "Chạy lại brief",
            trade_offs: { pros: ["Có thể thành công"], cons: ["Tốn thêm API cost"] },
            probability_of_success: 0.7,
            resource_needed: "Re-run",
          },
        ],
        recommendations: [
          {
            action: "Review alert dashboard thủ công",
            impact: "medium",
            priority: 1,
            effort: "hours",
            owner_hint: "PM",
          },
          { action: "Kiểm tra LLM API status", impact: "low", priority: 2, effort: "hours", owner_hint: "Engineering" },
          { action: "Chờ brief tự động tuần sau", impact: "low", priority: 3, effort: "hours", owner_hint: "CEO" },
        ],
        risk_summary: { top_risks: ["Brief generation failed"], mitigations_in_flight: ["Auto-retry next week"] },
      },
      model_used: result.modelUsed,
      cost_estimate_usd: result.costEstimateUsd,
      tokens: { input: result.inputTokens, output: result.outputTokens },
      _parse_error: true,
    };
  }

  // Validate structure
  const brief = {
    executive_summary: parsed.executive_summary || "Không có tóm tắt.",
    highlights: (parsed.highlights || []).slice(0, 5),
    scenarios: (parsed.scenarios || []).slice(0, 3),
    recommendations: (parsed.recommendations || []).slice(0, 3),
    risk_summary: parsed.risk_summary || { top_risks: [], mitigations_in_flight: [] },
  };

  // Pad to exactly 3 if LLM returned fewer
  while (brief.scenarios.length < 3) {
    brief.scenarios.push({
      title: `Kịch bản ${brief.scenarios.length + 1}`,
      description: "Không đủ data để tạo kịch bản bổ sung.",
      trade_offs: { pros: [], cons: ["Insufficient data"] },
      probability_of_success: 0,
      resource_needed: "N/A",
    });
  }
  while (brief.recommendations.length < 3) {
    brief.recommendations.push({
      action: "Chờ thêm data tuần sau",
      impact: "low",
      priority: brief.recommendations.length + 1,
      effort: "hours",
      owner_hint: "PM",
    });
  }

  return {
    brief,
    model_used: result.modelUsed,
    cost_estimate_usd: result.costEstimateUsd,
    tokens: { input: result.inputTokens, output: result.outputTokens },
  };
}
