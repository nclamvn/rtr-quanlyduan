// ═══════════════════════════════════════════════════════════
// RtR Control Tower — send-email Edge Function
// Sends realtime email notifications via Resend API
// Invoked by Database Webhook on notifications INSERT
// ═══════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://rtr-control.vercel.app";
const FROM_EMAIL = "RtR Control Tower <noreply@rtr.vn>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    // Webhook payload: { type: "INSERT", table: "notifications", record: {...} }
    const record = payload.record || payload;

    if (!record?.user_id || !record?.type) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Check user email preferences
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("email_enabled, frequency")
      .eq("user_id", record.user_id)
      .eq("event_type", record.type)
      .maybeSingle();

    // Skip if email explicitly disabled OR frequency = DIGEST (handled by send-digest)
    if (prefs && (!prefs.email_enabled || prefs.frequency === "DIGEST")) {
      return new Response(
        JSON.stringify({ skipped: true, reason: prefs.frequency === "DIGEST" ? "digest" : "disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", record.user_id)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Send via Resend API
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [profile.email],
        subject: `[RtR] ${record.title}`,
        html: buildEmailHtml(record, profile),
      }),
    });

    const emailResult = await emailRes.json();

    // 4. Mark notification as emailed
    if (emailRes.ok) {
      await supabase
        .from("notifications")
        .update({ is_emailed: true })
        .eq("id", record.id);
    }

    return new Response(
      JSON.stringify({ sent: emailRes.ok, resend: emailResult }),
      { status: emailRes.ok ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Email HTML template ──────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  CRITICAL_ISSUE_CREATED: "#EF4444",
  FLIGHT_TEST_FAIL: "#EF4444",
  CASCADE_DELAY_DETECTED: "#F59E0B",
  ISSUE_ASSIGNED: "#3B82F6",
  PHASE_TRANSITION: "#8B5CF6",
  ISSUE_OVERDUE: "#F97316",
  DRAFT_PENDING_REVIEW: "#6B7280",
};

function buildEmailHtml(
  notif: { type: string; title: string; title_vi?: string; body?: string; entity_id?: string },
  profile: { full_name: string }
): string {
  const color = TYPE_COLORS[notif.type] || "#3B82F6";
  const entityUrl = notif.entity_id
    ? `${APP_URL}?ref=${notif.entity_id}`
    : APP_URL;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;">
  <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:${color};color:white;padding:14px 20px;border-radius:8px 8px 0 0;font-weight:600;font-size:15px;">
      RtR Control Tower
    </div>
    <div style="background:white;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <p style="margin:0 0 8px;color:#374151;">Xin chào <strong>${profile.full_name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#111827;">${notif.title_vi || notif.title}</p>
      ${notif.body ? `<p style="color:#6b7280;font-size:13px;margin:0 0 16px;">${notif.body}</p>` : ""}
      <a href="${entityUrl}"
         style="display:inline-block;background:${color};color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:14px;">
        Xem chi tiết
      </a>
    </div>
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
      RtR Control Tower — Quản lý dự án Drone<br/>
      <a href="${APP_URL}" style="color:#9ca3af;">Mở Control Tower</a>
    </p>
  </div>
</body>
</html>`;
}
