// ═══════════════════════════════════════════════════════════
// In-App Adapter — creates notification in Supabase notifications table
// No email trigger (is_emailed = false)
// ═══════════════════════════════════════════════════════════

/**
 * Create in-app notification for a user.
 *
 * @param {object} params
 * @param {string} params.userId - recipient UUID
 * @param {object} params.alert - full alert row
 * @param {string} params.title - notification title
 * @param {string} params.body - notification body
 * @param {string} params.supabaseUrl
 * @param {string} params.supabaseKey
 * @returns {{ status: 'sent'|'failed'|'skipped', response?: object, error?: string }}
 */
export async function createInAppNotification({ userId, alert, title, body, supabaseUrl, supabaseKey }) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: "return=representation",
  };

  const notification = {
    user_id: userId,
    type: "alert_dispatch",
    title,
    title_vi: title,
    body,
    entity_type: "alert",
    entity_id: alert.id,
    project_id: alert.entity_ref || null,
    is_emailed: false,
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify(notification),
    });

    if (!res.ok) {
      const err = await res.text();
      // Graceful: if notifications table doesn't exist, skip
      if (res.status === 404 || err.includes("relation") || err.includes("does not exist")) {
        console.warn("[inAppAdapter] notifications table not found, skipping");
        return { status: "skipped", error: "notifications table not available" };
      }
      return { status: "failed", error: `Insert failed: ${res.status} ${err}` };
    }

    const rows = await res.json();
    return { status: "sent", response: { notification_id: rows[0]?.id } };
  } catch (err) {
    return { status: "failed", error: err.message };
  }
}
