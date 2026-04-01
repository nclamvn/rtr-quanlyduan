import { getConnectionStatus } from "../lib/supabase";

const WEBHOOK_STORAGE_KEY = "rtr-webhook-config";

const WEBHOOK_EVENTS = [
  {
    id: "CRITICAL_ISSUE_CREATED",
    label: "Critical Issue Created",
    labelVi: "Vấn đề nghiêm trọng được tạo",
    default: true,
  },
  { id: "FLIGHT_TEST_FAIL", label: "Flight Test Failed", labelVi: "Bay thử thất bại", default: true },
  { id: "PHASE_TRANSITION", label: "Phase Transition", labelVi: "Chuyển đổi giai đoạn", default: true },
  { id: "ISSUE_OVERDUE", label: "Issue Overdue", labelVi: "Vấn đề quá hạn", default: false },
  {
    id: "CASCADE_DETECTED",
    label: "Cascade Impact Detected",
    labelVi: "Phát hiện ảnh hưởng lan truyền",
    default: false,
  },
];

export { WEBHOOK_EVENTS };

export function getWebhookConfig() {
  try {
    const raw = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    if (!raw) return { slack: "", teams: "", enabledEvents: WEBHOOK_EVENTS.filter((e) => e.default).map((e) => e.id) };
    return JSON.parse(raw);
  } catch {
    return { slack: "", teams: "", enabledEvents: [] };
  }
}

export function saveWebhookConfig(config) {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, JSON.stringify(config));
}

export async function sendWebhook(event, title, message, severity = "medium", metadata = {}) {
  const config = getWebhookConfig();

  // Check if event is enabled
  if (!config.enabledEvents?.includes(event)) return;

  // Check if any webhook URL configured
  if (!config.slack && !config.teams) return;

  const payload = {
    event,
    title,
    message,
    severity,
    metadata,
    webhookUrls: { slack: config.slack || undefined, teams: config.teams || undefined },
  };

  // Try Edge Function first (if online), fallback to direct send
  if (getConnectionStatus() === "online") {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/functions/v1/send-webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify(payload),
        });
        return;
      }
    } catch {
      // Fallback to direct
    }
  }

  // Direct send (client-side fallback — less ideal but works for dev)
  if (config.slack) {
    try {
      await fetch(config.slack, { method: "POST", body: JSON.stringify({ text: `${title}\n${message}` }) });
    } catch {
      /* silent */
    }
  }
}
