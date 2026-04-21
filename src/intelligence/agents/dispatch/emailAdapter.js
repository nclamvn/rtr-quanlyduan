// ═══════════════════════════════════════════════════════════
// Email Adapter — sends alert notification via Supabase notifications table
// The existing pg_net trigger (migration 011) fires send-email Edge Function
// on every INSERT into notifications, so we just insert.
// ═══════════════════════════════════════════════════════════

import { renderEmail } from "./emailTemplate.js";

/**
 * Send email notification for an alert by inserting into notifications table.
 * The DB trigger handles actual email delivery via Edge Function.
 *
 * @param {object} params
 * @param {string} params.to - recipient user UUID
 * @param {string} params.email - recipient email (for dispatch_log)
 * @param {object} params.alert - full alert row
 * @param {string} params.supabaseUrl
 * @param {string} params.supabaseKey
 * @returns {{ status: 'sent'|'failed', response?: object, error?: string }}
 */
export async function sendEmail({ to, email, alert, supabaseUrl, supabaseKey }) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: "return=representation",
  };

  const { subject, body } = renderEmail(alert);

  const notification = {
    user_id: to,
    type: "alert_dispatch",
    title: subject,
    title_vi: subject,
    body,
    entity_type: "alert",
    entity_id: alert.id,
    project_id: alert.entity_ref || null,
    is_emailed: true,
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify(notification),
    });

    if (!res.ok) {
      const err = await res.text();
      return { status: "failed", error: `Insert notification failed: ${res.status} ${err}` };
    }

    const rows = await res.json();
    return { status: "sent", response: { notification_id: rows[0]?.id } };
  } catch (err) {
    return { status: "failed", error: err.message };
  }
}
