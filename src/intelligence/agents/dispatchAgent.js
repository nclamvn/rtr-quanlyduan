// ═══════════════════════════════════════════════════════════
// Dispatch Agent — Route alert notifications to assignees
// Confidence-gated: auto / cc_lead / queued_review / skipped
// ═══════════════════════════════════════════════════════════

import { computeDispatchPlan } from "./dispatch/dispatchGate.js";
import { sendEmail } from "./dispatch/emailAdapter.js";
import { sendTelegram } from "./dispatch/telegramAdapter.js";
import { createInAppNotification } from "./dispatch/inAppAdapter.js";
import { renderEmail } from "./dispatch/emailTemplate.js";

/**
 * Dispatch notifications for a single alert.
 * Idempotent: skips if alert already dispatched.
 *
 * @param {object} alert - full alert row (with suggested_assignee, allocation_confidence, severity)
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @returns {{ gate: string, channels_sent: string[], channels_failed: string[], skipped: boolean }}
 */
export async function dispatchAlert(alert, supabaseUrl, supabaseKey) {
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Idempotency check
  if (alert.dispatched_at) {
    return { gate: "already_dispatched", channels_sent: [], channels_failed: [], skipped: true };
  }

  const plan = computeDispatchPlan(alert);

  if (plan.gate === "skipped" && plan.channels.length === 0) {
    await markDispatched(alert.id, "skipped", [], supabaseUrl, headers);
    return { gate: "skipped", channels_sent: [], channels_failed: [], skipped: true };
  }

  // Lookup recipient info
  const recipient = await lookupRecipient(plan.recipient_user_id, supabaseUrl, headers);
  const { subject, body } = renderEmail(alert);

  // Lookup project lead if cc needed
  let leadRecipient = null;
  if (plan.cc_project_lead && alert.entity_ref) {
    leadRecipient = await lookupProjectLead(alert.entity_ref, supabaseUrl, headers);
  }

  // Execute all channels in parallel
  const channelResults = await Promise.allSettled(
    plan.channels.map((channel) =>
      executeChannel(channel, {
        alert,
        recipient,
        subject,
        body,
        supabaseUrl,
        supabaseKey,
      }),
    ),
  );

  const channelsSent = [];
  const channelsFailed = [];
  const logEntries = [];

  plan.channels.forEach((channel, i) => {
    const result = channelResults[i];
    const outcome = result.status === "fulfilled" ? result.value : { status: "failed", error: result.reason?.message };

    if (outcome.status === "sent") {
      channelsSent.push(channel);
    } else {
      channelsFailed.push(channel);
    }

    logEntries.push({
      alert_id: alert.id,
      channel,
      recipient: recipient?.email || recipient?.id || plan.recipient_user_id,
      status: outcome.status === "sent" ? "sent" : outcome.status === "skipped" ? "skipped" : "failed",
      response: outcome.response || {},
      error_message: outcome.error || null,
    });
  });

  // CC project lead if needed
  if (plan.cc_project_lead && leadRecipient && leadRecipient.id !== plan.recipient_user_id) {
    const ccResult = await executeChannel("email", {
      alert,
      recipient: leadRecipient,
      subject: `[CC] ${subject}`,
      body,
      supabaseUrl,
      supabaseKey,
    });

    logEntries.push({
      alert_id: alert.id,
      channel: "email",
      recipient: leadRecipient.email || leadRecipient.id,
      status: ccResult.status === "sent" ? "sent" : "failed",
      response: ccResult.response || {},
      error_message: ccResult.error || null,
    });

    if (ccResult.status === "sent") channelsSent.push("email_cc");
  }

  // Persist dispatch log
  await persistDispatchLog(logEntries, supabaseUrl, headers);

  // Mark alert as dispatched
  await markDispatched(alert.id, plan.gate, channelsSent, supabaseUrl, headers);

  return {
    gate: plan.gate,
    channels_sent: channelsSent,
    channels_failed: channelsFailed,
    skipped: false,
  };
}

async function executeChannel(channel, { alert, recipient, subject, body, supabaseUrl, supabaseKey }) {
  switch (channel) {
    case "email":
      return sendEmail({
        to: recipient.id,
        email: recipient.email,
        alert,
        supabaseUrl,
        supabaseKey,
      });

    case "telegram":
      return sendTelegram({
        to: recipient.telegram_chat_id || recipient.id,
        message: `<b>${subject}</b>\n\n${alert.summary}\n\nDeadline: ${alert.suggested_deadline || "N/A"}`,
        alertId: alert.id,
      });

    case "in_app":
      return createInAppNotification({
        userId: recipient.id,
        alert,
        title: subject,
        body,
        supabaseUrl,
        supabaseKey,
      });

    default:
      return { status: "skipped", error: `Unknown channel: ${channel}` };
  }
}

async function lookupRecipient(userId, supabaseUrl, headers) {
  try {
    const params = new URLSearchParams({
      id: `eq.${userId}`,
      select: "id,email,full_name,role",
      limit: "1",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?${params}`, { headers });
    if (!res.ok) return { id: userId, email: null, full_name: "Unknown" };
    const rows = await res.json();
    return rows[0] || { id: userId, email: null, full_name: "Unknown" };
  } catch {
    return { id: userId, email: null, full_name: "Unknown" };
  }
}

async function lookupProjectLead(projectLink, supabaseUrl, headers) {
  try {
    const params = new URLSearchParams({
      id: `eq.${projectLink}`,
      select: "phase_owner_id,phase_owner_name",
      limit: "1",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/projects?${params}`, { headers });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows[0]?.phase_owner_id) return null;

    // Get lead's full profile
    return lookupRecipient(rows[0].phase_owner_id, supabaseUrl, headers);
  } catch {
    return null;
  }
}

async function persistDispatchLog(entries, supabaseUrl, headers) {
  if (entries.length === 0) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/dispatch_log`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(entries),
    });
  } catch (err) {
    console.error(`[dispatch] Failed to log dispatch: ${err.message}`);
  }
}

async function markDispatched(alertId, gate, channelsSent, supabaseUrl, headers) {
  try {
    const successChannels = channelsSent.filter((c) => !c.endsWith("_cc"));
    await fetch(`${supabaseUrl}/rest/v1/alerts?id=eq.${alertId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        dispatched_at: new Date().toISOString(),
        dispatch_channels: successChannels,
        dispatch_gate: gate,
      }),
    });
  } catch (err) {
    console.error(`[dispatch] Failed to mark dispatched: ${err.message}`);
  }
}
