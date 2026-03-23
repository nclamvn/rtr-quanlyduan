// ═══════════════════════════════════════════════════════════
// RtR Control Tower — AI Daily Digest Edge Function
// Generates morning summary: changes, risks, patterns, recommendations
// Triggered by pg_cron at 01:00 UTC (08:00 ICT) or manually
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const today = new Date().toISOString().split("T")[0];

    // ── Check if digest already exists for today ──
    const { data: existing } = await supabase
      .from("ai_digests")
      .select("id")
      .eq("digest_date", today)
      .maybeSingle();

    if (existing) {
      const { data: digest } = await supabase
        .from("ai_digests")
        .select("content, created_at")
        .eq("digest_date", today)
        .single();
      return new Response(
        JSON.stringify({ ...digest?.content, cached: true, generatedAt: digest?.created_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Collect data for digest ──
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Issues overview
    const { data: allIssues } = await supabase
      .from("issues")
      .select("id, title, title_vi, status, severity, owner_name, phase, project_id, due_date, created_at, updated_at")
      .order("updated_at", { ascending: false });

    const issues = allIssues || [];
    const openIssues = issues.filter((i: any) => i.status !== "CLOSED");
    const criticalIssues = openIssues.filter((i: any) => i.severity === "CRITICAL");
    const blockedIssues = openIssues.filter((i: any) => i.status === "BLOCKED");
    const overdueIssues = openIssues.filter((i: any) => i.due_date && new Date(i.due_date) < new Date());
    const recentlyCreated = issues.filter((i: any) => i.created_at > yesterday);
    const recentlyUpdated = issues.filter((i: any) => i.updated_at > yesterday && i.created_at <= yesterday);
    const closedToday = issues.filter((i: any) => i.status === "CLOSED" && i.updated_at > yesterday);

    // 2. Owner workload analysis
    const ownerMap: Record<string, { open: number; critical: number; blocked: number; overdue: number }> = {};
    for (const issue of openIssues) {
      const owner = (issue as any).owner_name || "Unassigned";
      if (!ownerMap[owner]) ownerMap[owner] = { open: 0, critical: 0, blocked: 0, overdue: 0 };
      ownerMap[owner].open++;
      if ((issue as any).severity === "CRITICAL") ownerMap[owner].critical++;
      if ((issue as any).status === "BLOCKED") ownerMap[owner].blocked++;
      if ((issue as any).due_date && new Date((issue as any).due_date) < new Date()) ownerMap[owner].overdue++;
    }

    // 3. Project health
    const { data: projects } = await supabase.from("projects").select("id, name, phase");
    const projectStats = (projects || []).map((p: any) => {
      const pIssues = openIssues.filter((i: any) => i.project_id === p.id);
      return {
        name: p.name,
        phase: p.phase,
        openIssues: pIssues.length,
        critical: pIssues.filter((i: any) => i.severity === "CRITICAL").length,
        blocked: pIssues.filter((i: any) => i.status === "BLOCKED").length,
      };
    });

    // 4. Cross-app data (if available)
    const { data: crossApp } = await supabase
      .from("cross_app_data")
      .select("entity_type, status, priority, data")
      .eq("source_app", "MRP");

    const mrpSummary = {
      overdueWOs: (crossApp || []).filter((d: any) => d.entity_type === "work_order" && d.status !== "completed" && d.data?.dueDate && new Date(d.data.dueDate) < new Date()).length,
      urgentInventory: (crossApp || []).filter((d: any) => d.entity_type === "inventory_alert" && d.priority === "urgent").length,
      activeOrders: (crossApp || []).filter((d: any) => d.entity_type === "sales_order" && !["cancelled", "delivered"].includes(d.status)).length,
    };

    // ── Build prompt ──
    const dataText = `
=== RtR DAILY STATUS (${today}) ===

ISSUES OVERVIEW:
- Total open: ${openIssues.length}
- Critical: ${criticalIssues.length}
- Blocked: ${blockedIssues.length}
- Overdue: ${overdueIssues.length}
- Created today: ${recentlyCreated.length}
- Updated today: ${recentlyUpdated.length}
- Closed today: ${closedToday.length}

${overdueIssues.length > 0 ? `OVERDUE ISSUES:\n${overdueIssues.slice(0, 10).map((i: any) => `- ${i.id}: ${i.title} (Owner: ${i.owner_name}, Due: ${i.due_date}, Severity: ${i.severity})`).join("\n")}` : "No overdue issues."}

${criticalIssues.length > 0 ? `CRITICAL ISSUES:\n${criticalIssues.slice(0, 10).map((i: any) => `- ${i.id}: ${i.title} (Owner: ${i.owner_name}, Phase: ${i.phase})`).join("\n")}` : ""}

${blockedIssues.length > 0 ? `BLOCKED ISSUES:\n${blockedIssues.slice(0, 10).map((i: any) => `- ${i.id}: ${i.title} (Owner: ${i.owner_name})`).join("\n")}` : ""}

TEAM WORKLOAD:
${Object.entries(ownerMap)
  .sort(([, a], [, b]) => (b as any).open - (a as any).open)
  .slice(0, 10)
  .map(([name, stats]) => `- ${name}: ${(stats as any).open} open${(stats as any).critical > 0 ? `, ${(stats as any).critical} critical` : ""}${(stats as any).blocked > 0 ? `, ${(stats as any).blocked} blocked` : ""}${(stats as any).overdue > 0 ? `, ${(stats as any).overdue} overdue` : ""}`)
  .join("\n")}

PROJECT STATUS:
${projectStats.map((p: any) => `- ${p.name} (${p.phase}): ${p.openIssues} open${p.critical > 0 ? `, ${p.critical} critical` : ""}${p.blocked > 0 ? `, ${p.blocked} blocked` : ""}`).join("\n")}

${mrpSummary.overdueWOs > 0 || mrpSummary.urgentInventory > 0 ? `MRP ALERTS:\n- Overdue work orders: ${mrpSummary.overdueWOs}\n- Urgent inventory alerts: ${mrpSummary.urgentInventory}\n- Active sales orders: ${mrpSummary.activeOrders}` : ""}
`.trim();

    const systemPrompt = `Bạn là cố vấn quản lý dự án cấp cao cho RtR (Real-time Robotics), công ty phát triển drone quân sự/dân sự. Viết BÁO CÁO HÀNG NGÀY cho CEO bằng tiếng Việt.

Trả lời bằng JSON chính xác (KHÔNG markdown):
{
  "executiveSummary": "2-3 câu tổng quan tình hình hôm nay — điểm tích cực và điểm cần lưu ý",
  "criticalItems": [
    { "title": "Tiêu đề ngắn", "urgency": "high|medium", "detail": "Chi tiết + đề xuất hành động" }
  ],
  "patterns": [
    { "observation": "Quan sát pattern", "significance": "Tầm quan trọng", "suggestion": "Đề xuất" }
  ],
  "teamInsights": [
    { "person": "Tên", "observation": "Nhận xét workload/hiệu suất", "recommendation": "Đề xuất" }
  ],
  "todayPriorities": ["Ưu tiên 1 cần làm hôm nay", "Ưu tiên 2", "Ưu tiên 3"]
}

Quy tắc:
- Luôn viết tiếng Việt
- Cụ thể: nêu tên issue ID, tên người, tên dự án
- Actionable: mỗi item phải có đề xuất hành động cụ thể
- Ngắn gọn: mỗi field tối đa 2 câu
- Chỉ nêu items thực sự quan trọng (tối đa 5 critical items, 3 patterns, 3 team insights)`;

    // ── Call Claude ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: dataText }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ai-digest] Claude error:", errText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "{}";
    const tokensUsed = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

    let digest;
    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      digest = JSON.parse(cleaned);
    } catch {
      digest = { executiveSummary: text.slice(0, 300), criticalItems: [], patterns: [], teamInsights: [], todayPriorities: [] };
    }

    // ── Store digest ──
    await supabase.from("ai_digests").upsert({
      digest_date: today,
      content: digest,
      model: MODEL,
      tokens_used: tokensUsed,
    }, { onConflict: "digest_date" });

    // ── Store daily snapshot for trend comparison ──
    await supabase.from("ai_snapshots").upsert({
      snapshot_date: today,
      snapshot_type: "daily_counts",
      data: {
        totalOpen: openIssues.length,
        critical: criticalIssues.length,
        blocked: blockedIssues.length,
        overdue: overdueIssues.length,
        closed: closedToday.length,
        created: recentlyCreated.length,
        ownerWorkloads: ownerMap,
      },
    }, { onConflict: "snapshot_date,snapshot_type" });

    return new Response(
      JSON.stringify({ ...digest, cached: false, generatedAt: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[ai-digest] Error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
