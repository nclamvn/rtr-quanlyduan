// ═══════════════════════════════════════════════════════════
// RtR Control Tower — send-digest Edge Function
// Batches unsent DIGEST notifications and sends one email per user
// Scheduled via pg_cron daily at 01:00 UTC (08:00 ICT)
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Get all unsent notifications
    const { data: unsent, error: fetchErr } = await supabase
      .from("notifications")
      .select("*, profiles!notifications_user_id_fkey(email, full_name)")
      .eq("is_emailed", false)
      .order("created_at", { ascending: false });

    if (fetchErr || !unsent?.length) {
      return new Response(
        JSON.stringify({ message: "No digest items", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get DIGEST-preference users
    const { data: digestPrefs } = await supabase
      .from("email_preferences")
      .select("user_id, event_type")
      .eq("frequency", "DIGEST")
      .eq("email_enabled", true);

    const digestSet = new Set(
      (digestPrefs || []).map((p: { user_id: string; event_type: string }) =>
        `${p.user_id}:${p.event_type}`
      )
    );

    // 3. Group by user (only DIGEST-preference notifications)
    const byUser: Record<string, { email: string; name: string; items: typeof unsent }> = {};
    const notifIds: string[] = [];

    for (const n of unsent) {
      if (!digestSet.has(`${n.user_id}:${n.type}`)) continue;
      if (!byUser[n.user_id]) {
        byUser[n.user_id] = {
          email: (n as any).profiles?.email || "",
          name: (n as any).profiles?.full_name || "",
          items: [],
        };
      }
      byUser[n.user_id].items.push(n);
      notifIds.push(n.id);
    }

    // 4. Send one digest email per user
    let sent = 0;
    for (const [_userId, data] of Object.entries(byUser)) {
      if (!data.email || !data.items.length) continue;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [data.email],
          subject: `[RtR] Tổng hợp ${data.items.length} thông báo`,
          html: buildDigestHtml(data),
        }),
      });
      sent++;
    }

    // 5. Mark all as emailed
    if (notifIds.length) {
      await supabase
        .from("notifications")
        .update({ is_emailed: true })
        .in("id", notifIds);
    }

    return new Response(
      JSON.stringify({ sent, notifications: notifIds.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Digest email HTML template ───────────────────────────

function buildDigestHtml(data: { name: string; items: any[] }): string {
  const TYPE_COLORS: Record<string, string> = {
    CRITICAL_ISSUE_CREATED: "#EF4444",
    FLIGHT_TEST_FAIL: "#EF4444",
    CASCADE_DELAY_DETECTED: "#F59E0B",
    ISSUE_ASSIGNED: "#3B82F6",
    PHASE_TRANSITION: "#8B5CF6",
    ISSUE_OVERDUE: "#F97316",
    DRAFT_PENDING_REVIEW: "#6B7280",
  };

  const rows = data.items
    .map((n) => {
      const color = TYPE_COLORS[n.type] || "#6B7280";
      const time = new Date(n.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;"></span>
          <strong style="color:#111827;">${n.title_vi || n.title}</strong>
          <br/><span style="color:#9ca3af;font-size:12px;margin-left:16px;">${time}</span>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;">
  <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#1E293B;color:white;padding:14px 20px;border-radius:8px 8px 0 0;font-weight:600;">
      RtR Daily Digest — ${data.items.length} thông báo
    </div>
    <div style="background:white;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
      <p style="margin:0 0 16px;color:#374151;">Xin chào <strong>${data.name}</strong>,</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="margin-top:20px;">
        <a href="${APP_URL}"
           style="display:inline-block;background:#3B82F6;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:500;">
          Mở Control Tower
        </a>
      </div>
    </div>
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
      RtR Control Tower — Quản lý dự án Drone
    </p>
  </div>
</body>
</html>`;
}
