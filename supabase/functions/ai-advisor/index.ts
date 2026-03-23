// ═══════════════════════════════════════════════════════════
// RtR Control Tower — AI Advisor Edge Function
// OpenAI (primary) → Anthropic (fallback)
// Caches responses in PostgreSQL to minimize API costs
// ═══════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── AI Provider abstraction ──
async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 600,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "{}",
    tokens: (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0),
    model: data.model || "gpt-4o-mini",
  };
}

async function callAnthropic(systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.content?.[0]?.text || "{}",
    tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    model: "claude-sonnet",
  };
}

async function callAI(systemPrompt: string, userPrompt: string) {
  // Primary: OpenAI
  if (OPENAI_API_KEY) {
    try {
      const result = await callOpenAI(systemPrompt, userPrompt);
      console.log("[ai-advisor] OpenAI success");
      return result;
    } catch (err) {
      console.warn("[ai-advisor] OpenAI failed, falling back to Anthropic:", (err as Error).message);
    }
  }
  // Fallback: Anthropic
  if (ANTHROPIC_API_KEY) {
    const result = await callAnthropic(systemPrompt, userPrompt);
    console.log("[ai-advisor] Anthropic fallback success");
    return result;
  }
  throw new Error("No AI provider configured");
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { issue, context, lang = "vi" } = await req.json();

    if (!issue?.id) {
      return new Response(
        JSON.stringify({ error: "Missing issue data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Cache check ──
    const cacheKey = `${issue.id}:${issue.status}:${issue.severity || issue.sev}:${issue.impacts?.length || 0}:${issue.updates?.length || 0}:${lang}`;

    const { data: cached } = await supabase
      .from("ai_advisor_cache")
      .select("response, created_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ ...cached.response, cached: true, generatedAt: cached.created_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build prompts ──
    const isVi = lang === "vi";
    const systemPrompt = isVi
      ? `Bạn là cố vấn kỹ thuật cho RtR (Real-time Robotics), công ty phát triển drone. Bạn phân tích các vấn đề R&D trong bối cảnh phát triển phần cứng drone theo 5 pha: CONCEPT → EVT → DVT → PVT → MP.

Trả lời bằng JSON với format chính xác sau (KHÔNG markdown, KHÔNG giải thích thêm):
{
  "summary": "1-2 câu tóm tắt vấn đề này là gì và tại sao quan trọng",
  "riskLevel": "low|medium|high|critical",
  "riskExplanation": "Giải thích hậu quả nếu vấn đề này bị delay hoặc không giải quyết",
  "recommendations": ["Đề xuất 1", "Đề xuất 2", "Đề xuất 3"],
  "relatedContext": "Liên quan đến các vấn đề/milestone/sản phẩm nào khác"
}`
      : `You are a technical advisor for RtR (Real-time Robotics), a drone development company. You analyze R&D issues in hardware drone development across 5 phases: CONCEPT → EVT → DVT → PVT → MP.

Respond in exact JSON format (NO markdown, NO extra text):
{
  "summary": "1-2 sentence summary of what this issue is and why it matters",
  "riskLevel": "low|medium|high|critical",
  "riskExplanation": "Impact explanation if this issue is delayed or unresolved",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "relatedContext": "How this relates to other issues/milestones/products"
}`;

    const issueText = [
      `ID: ${issue.id}`,
      `Title: ${issue.title}${issue.titleVi ? ` (${issue.titleVi})` : ""}`,
      `Status: ${issue.status}`, `Severity: ${issue.severity || issue.sev}`,
      `Phase: ${issue.phase}`, `Owner: ${issue.owner}`,
      issue.rootCause ? `Root Cause: ${issue.rootCause}` : null,
      issue.description || issue.desc ? `Description: ${issue.description || issue.desc}` : null,
      issue.due ? `Due: ${issue.due}` : null,
      issue.impacts?.length ? `Cascade Impacts: ${issue.impacts.map((i: any) => `${i.phase}+${Math.ceil(i.days/7)}w`).join(", ")}` : null,
    ].filter(Boolean).join("\n");

    const contextText = context ? [
      `Project: ${context.projectName} (${context.projectPhase})`,
      context.phiScore !== undefined ? `Project Health Index: ${context.phiScore}/100` : null,
      context.totalOpenIssues ? `Total Open Issues: ${context.totalOpenIssues}` : null,
      context.totalBlockedIssues ? `Blocked Issues: ${context.totalBlockedIssues}` : null,
      context.ownerWorkload ? `Owner Workload: ${context.ownerWorkload} open tasks` : null,
      context.convergences?.length ? `Active Alerts: ${context.convergences.join("; ")}` : null,
      context.mrpWorkOrders?.length ? `Related Production Orders (MRP): ${context.mrpWorkOrders.join("; ")}` : null,
      context.mrpInventoryAlerts?.length ? `Inventory Alerts (MRP): ${context.mrpInventoryAlerts.join("; ")}` : null,
    ].filter(Boolean).join("\n") : "";

    const userPrompt = `${isVi ? "Phân tích vấn đề sau" : "Analyze this issue"}:\n\n${issueText}${contextText ? `\n\n${isVi ? "Bối cảnh dự án" : "Project Context"}:\n${contextText}` : ""}`;

    // ── Call AI (OpenAI primary, Anthropic fallback) ──
    const result = await callAI(systemPrompt, userPrompt);

    // ── Parse JSON response ──
    let advisory;
    try {
      const cleaned = result.text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      advisory = JSON.parse(cleaned);
    } catch {
      advisory = {
        summary: result.text.slice(0, 200),
        riskLevel: "medium",
        riskExplanation: "",
        recommendations: [],
        relatedContext: "",
      };
    }

    // ── Store in cache ──
    await supabase.from("ai_advisor_cache").upsert({
      cache_key: cacheKey,
      issue_id: issue.id,
      response: advisory,
      model: result.model,
      tokens_used: result.tokens,
      lang,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "cache_key" });

    return new Response(
      JSON.stringify({ ...advisory, cached: false, generatedAt: new Date().toISOString(), model: result.model }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[ai-advisor] Error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
