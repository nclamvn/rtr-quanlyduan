// ═══════════════════════════════════════════════════════════
// RtR Control Tower — AI Advisor Edge Function
// Provides AI-powered task analysis using Claude Sonnet
// Caches responses in PostgreSQL to minimize API costs
// ═══════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "claude-sonnet-4-20250514";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // ── Build cache key ──
    const cacheKey = `${issue.id}:${issue.status}:${issue.severity || issue.sev}:${issue.impacts?.length || 0}:${issue.updates?.length || 0}:${lang}`;

    // ── Check cache ──
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

    // ── Build prompt ──
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
      `Status: ${issue.status}`,
      `Severity: ${issue.severity || issue.sev}`,
      `Phase: ${issue.phase}`,
      `Owner: ${issue.owner}`,
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
    ].filter(Boolean).join("\n") : "";

    const userPrompt = `${isVi ? "Phân tích vấn đề sau" : "Analyze this issue"}:\n\n${issueText}${contextText ? `\n\n${isVi ? "Bối cảnh dự án" : "Project Context"}:\n${contextText}` : ""}`;

    // ── Call Claude API ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ai-advisor] Claude API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable", detail: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "{}";
    const tokensUsed = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

    // ── Parse JSON response ──
    let advisory;
    try {
      // Strip any markdown code fences if present
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      advisory = JSON.parse(cleaned);
    } catch {
      advisory = {
        summary: text.slice(0, 200),
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
      model: MODEL,
      tokens_used: tokensUsed,
      lang,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "cache_key" });

    return new Response(
      JSON.stringify({ ...advisory, cached: false, generatedAt: new Date().toISOString(), model: MODEL }),
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
