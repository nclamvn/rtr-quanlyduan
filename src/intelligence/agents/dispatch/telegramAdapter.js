// ═══════════════════════════════════════════════════════════
// Telegram Adapter — MOCK (not configured)
// TODO: When bot token is available, replace implementation:
//   1. Set TELEGRAM_BOT_TOKEN in .env
//   2. Replace body with:
//      fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify({ chat_id: to, text: message, parse_mode: 'HTML' })
//      })
//   3. Add telegram_chat_id field to profiles table
// ═══════════════════════════════════════════════════════════

/**
 * Send Telegram message. Currently throws — not configured.
 *
 * @param {object} params
 * @param {string} params.to - telegram chat_id
 * @param {string} params.message - formatted message text
 * @param {string} params.alertId - for logging
 * @returns {{ status: 'sent'|'failed', response?: object, error?: string }}
 */
export async function sendTelegram({ to, message, alertId }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return {
      status: "skipped",
      error: "TELEGRAM_NOT_CONFIGURED",
    };
  }

  // Future implementation when token is available
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: to,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { status: "failed", error: `Telegram API: ${res.status} ${err}` };
    }

    const data = await res.json();
    return { status: "sent", response: { message_id: data.result?.message_id } };
  } catch (err) {
    return { status: "failed", error: err.message };
  }
}
