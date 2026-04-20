// ═══════════════════════════════════════════════════════════
// LLM Router — Haiku default, Sonnet escalation
// Shared by all LLM-powered agents
// ═══════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-5-20250514";

const COST_PER_1K = {
  [HAIKU]: { input: 0.0008, output: 0.004 },
  [SONNET]: { input: 0.003, output: 0.015 },
};

let _client = null;

function getClient() {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

/**
 * Call LLM with auto-escalation.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} options
 * @param {string} options.model - override model (default Haiku)
 * @param {number} options.maxTokens - default 2048
 * @param {number} options.temperature - default 0.3
 * @param {boolean} options.jsonMode - expect JSON response
 * @returns {{content: string, modelUsed: string, costEstimateUsd: number, inputTokens: number, outputTokens: number}}
 */
export async function callLLM(systemPrompt, userPrompt, options = {}) {
  const model = options.model || HAIKU;
  const maxTokens = options.maxTokens || 2048;
  const temperature = options.temperature ?? 0.3;

  const client = getClient();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0]?.text || "";
  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;

  const rates = COST_PER_1K[model] || COST_PER_1K[HAIKU];
  const costEstimateUsd = (inputTokens * rates.input + outputTokens * rates.output) / 1000;

  return {
    content,
    modelUsed: model,
    costEstimateUsd: Math.round(costEstimateUsd * 1000000) / 1000000,
    inputTokens,
    outputTokens,
  };
}

/**
 * Call Haiku, then escalate to Sonnet if response signals needs_deep_analysis.
 */
export async function callWithEscalation(systemPrompt, userPrompt, deepSystemSuffix = "") {
  const haikuResult = await callLLM(systemPrompt, userPrompt);

  let parsed;
  try {
    parsed = JSON.parse(haikuResult.content);
  } catch {
    return { ...haikuResult, parsed: null, escalated: false };
  }

  if (parsed.needs_deep_analysis) {
    const deepSystem = systemPrompt + (deepSystemSuffix ? `\n\n${deepSystemSuffix}` : "");
    const sonnetResult = await callLLM(deepSystem, userPrompt, { model: SONNET });

    let deepParsed;
    try {
      deepParsed = JSON.parse(sonnetResult.content);
    } catch {
      deepParsed = parsed;
    }

    return {
      ...sonnetResult,
      costEstimateUsd: haikuResult.costEstimateUsd + sonnetResult.costEstimateUsd,
      parsed: deepParsed,
      escalated: true,
    };
  }

  return { ...haikuResult, parsed, escalated: false };
}

export { HAIKU, SONNET };
