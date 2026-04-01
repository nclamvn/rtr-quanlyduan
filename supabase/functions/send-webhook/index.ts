/**
 * Supabase Edge Function: send-webhook
 * Dispatches notifications to Slack and/or Microsoft Teams via incoming webhooks.
 *
 * POST body:
 * {
 *   event: "CRITICAL_ISSUE_CREATED" | "FLIGHT_TEST_FAIL" | "PHASE_TRANSITION" | "ISSUE_OVERDUE" | "CASCADE_DETECTED",
 *   title: string,
 *   message: string,
 *   severity: "critical" | "high" | "medium" | "low",
 *   metadata: { issueId?, projectName?, phase?, ... },
 *   webhookUrls: { slack?: string, teams?: string }
 * }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event: string;
  title: string;
  message: string;
  severity: string;
  metadata: Record<string, string>;
  webhookUrls: { slack?: string; teams?: string };
}

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

const EVENT_EMOJI: Record<string, string> = {
  CRITICAL_ISSUE_CREATED: "🚨",
  FLIGHT_TEST_FAIL: "✈️",
  PHASE_TRANSITION: "🔄",
  ISSUE_OVERDUE: "⏰",
  CASCADE_DETECTED: "⚡",
};

function buildSlackPayload(payload: WebhookPayload) {
  const emoji = EVENT_EMOJI[payload.event] || "📢";
  const sevEmoji = SEVERITY_EMOJI[payload.severity] || "";
  const fields = Object.entries(payload.metadata || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `*${k}:* ${v}`)
    .join(" | ");

  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} ${payload.title}`, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `${sevEmoji} ${payload.message}` },
      },
      ...(fields ? [{ type: "context", elements: [{ type: "mrkdwn", text: fields }] }] : []),
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `_RtR Control Tower • ${new Date().toISOString().split("T")[0]}_` }],
      },
    ],
  };
}

function buildTeamsPayload(payload: WebhookPayload) {
  const emoji = EVENT_EMOJI[payload.event] || "📢";
  const facts = Object.entries(payload.metadata || {})
    .filter(([, v]) => v)
    .map(([k, v]) => ({ name: k, value: v }));

  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: payload.title,
    themeColor: payload.severity === "critical" ? "FF0000" : payload.severity === "high" ? "FF8C00" : "3B82F6",
    title: `${emoji} ${payload.title}`,
    sections: [
      {
        text: payload.message,
        facts: facts.length > 0 ? facts : undefined,
      },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const results: { slack?: string; teams?: string } = {};

    // Send to Slack
    if (payload.webhookUrls?.slack) {
      try {
        const slackBody = buildSlackPayload(payload);
        const res = await fetch(payload.webhookUrls.slack, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackBody),
        });
        results.slack = res.ok ? "sent" : `error: ${res.status}`;
      } catch (e) {
        results.slack = `error: ${(e as Error).message}`;
      }
    }

    // Send to Teams
    if (payload.webhookUrls?.teams) {
      try {
        const teamsBody = buildTeamsPayload(payload);
        const res = await fetch(payload.webhookUrls.teams, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teamsBody),
        });
        results.teams = res.ok ? "sent" : `error: ${res.status}`;
      } catch (e) {
        results.teams = `error: ${(e as Error).message}`;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
