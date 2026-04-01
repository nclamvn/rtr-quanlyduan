import { useState } from "react";
import { Globe, Check, Send, AlertTriangle } from "lucide-react";
import { Btn, Section } from "./ui";
import { getWebhookConfig, saveWebhookConfig, WEBHOOK_EVENTS, sendWebhook } from "../services/webhookService";
import { mono } from "../constants";

export default function WebhookSettings({ lang }) {
  const [config, setConfig] = useState(getWebhookConfig);
  const [testStatus, setTestStatus] = useState(null);

  const t = {
    title: lang === "vi" ? "Webhook Tích Hợp" : "Webhook Integration",
    desc:
      lang === "vi"
        ? "Gửi thông báo đến Slack hoặc Microsoft Teams khi có sự kiện quan trọng."
        : "Send notifications to Slack or Microsoft Teams when important events occur.",
    slack: "Slack Incoming Webhook URL",
    teams: "Microsoft Teams Webhook URL",
    events: lang === "vi" ? "Sự kiện kích hoạt" : "Trigger Events",
    save: lang === "vi" ? "Lưu cấu hình" : "Save Configuration",
    test: lang === "vi" ? "Gửi thử" : "Send Test",
    saved: lang === "vi" ? "Đã lưu!" : "Saved!",
    testSent: lang === "vi" ? "Đã gửi thử!" : "Test sent!",
    placeholder: lang === "vi" ? "Dán URL webhook vào đây..." : "Paste webhook URL here...",
  };

  const handleSave = () => {
    saveWebhookConfig(config);
    setTestStatus("saved");
    setTimeout(() => setTestStatus(null), 2000);
  };

  const handleTest = async () => {
    saveWebhookConfig(config);
    await sendWebhook(
      "CRITICAL_ISSUE_CREATED",
      "🧪 Test Notification — RtR Control Tower",
      "This is a test webhook notification. If you see this, webhook integration is working!",
      "medium",
      { source: "Webhook Settings", project: "Test" },
    );
    setTestStatus("testSent");
    setTimeout(() => setTestStatus(null), 3000);
  };

  const toggleEvent = (eventId) => {
    setConfig((prev) => ({
      ...prev,
      enabledEvents: prev.enabledEvents.includes(eventId)
        ? prev.enabledEvents.filter((e) => e !== eventId)
        : [...prev.enabledEvents, eventId],
    }));
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: mono,
    outline: "none",
  };

  return (
    <Section
      title={
        <>
          <Globe size={14} /> {t.title}
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{t.desc}</div>

        {/* Slack URL */}
        <div>
          <label
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}
          >
            {t.slack}
          </label>
          <input
            type="url"
            value={config.slack || ""}
            onChange={(e) => setConfig((p) => ({ ...p, slack: e.target.value }))}
            placeholder={t.placeholder}
            style={inputStyle}
          />
        </div>

        {/* Teams URL */}
        <div>
          <label
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}
          >
            {t.teams}
          </label>
          <input
            type="url"
            value={config.teams || ""}
            onChange={(e) => setConfig((p) => ({ ...p, teams: e.target.value }))}
            placeholder={t.placeholder}
            style={inputStyle}
          />
        </div>

        {/* Event toggles */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>{t.events}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {WEBHOOK_EVENTS.map((ev) => {
              const isEnabled = config.enabledEvents?.includes(ev.id);
              return (
                <div
                  key={ev.id}
                  onClick={() => toggleEvent(ev.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 4,
                    background: isEnabled ? "#10B98108" : "transparent",
                    border: `1px solid ${isEnabled ? "#10B98120" : "transparent"}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      border: `2px solid ${isEnabled ? "#10B981" : "var(--text-faint)"}`,
                      background: isEnabled ? "#10B981" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isEnabled && <Check size={10} color="#000" strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                      {lang === "vi" ? ev.labelVi : ev.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono }}>{ev.id}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="primary" onClick={handleSave}>
            <Check size={12} /> {t.save}
          </Btn>
          {(config.slack || config.teams) && (
            <Btn onClick={handleTest}>
              <Send size={12} /> {t.test}
            </Btn>
          )}
          {testStatus === "saved" && (
            <span style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>✓ {t.saved}</span>
          )}
          {testStatus === "testSent" && (
            <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>✓ {t.testSent}</span>
          )}
        </div>

        {/* Warning if no URL */}
        {!config.slack && !config.teams && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#F59E0B" }}>
            <AlertTriangle size={12} />
            {lang === "vi" ? "Chưa cấu hình webhook URL" : "No webhook URL configured"}
          </div>
        )}
      </div>
    </Section>
  );
}
