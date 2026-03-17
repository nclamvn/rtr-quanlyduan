// ===================================================================
// RtR CONTROL TOWER V3 — Email Notification System
// Preferences UI, mock sending, toast feedback, templates
// ===================================================================
import { useState, useEffect, useCallback } from "react";
import {
  Mail, Bell, BellOff, Zap, Calendar, Clock,
  AlertTriangle, Plane, GitBranch, UserCheck, ShieldAlert,
  FileText, Check, X, Send, Eye,
} from "lucide-react";
import { supabase, isSupabaseConnected } from "../lib/supabase";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

// ── EVENT DEFINITIONS ─────────────────────────────────────────

export const EMAIL_EVENTS = [
  {
    id: "CRITICAL_ISSUE_CREATED", icon: ShieldAlert, color: "#EF4444",
    label: "Critical issue created", labelVi: "Tạo vấn đề nghiêm trọng",
    defaultFreq: "REALTIME", defaultEmail: true, defaultInApp: true,
  },
  {
    id: "FLIGHT_TEST_FAIL", icon: Plane, color: "#EF4444",
    label: "Flight test FAIL", labelVi: "Bay thử FAIL",
    defaultFreq: "REALTIME", defaultEmail: true, defaultInApp: true,
  },
  {
    id: "CASCADE_DELAY_DETECTED", icon: Zap, color: "#F59E0B",
    label: "Cascade delay detected", labelVi: "Phát hiện delay cascade",
    defaultFreq: "REALTIME", defaultEmail: true, defaultInApp: true,
  },
  {
    id: "ISSUE_ASSIGNED", icon: UserCheck, color: "#3B82F6",
    label: "Issue assigned to me", labelVi: "Gán vấn đề cho tôi",
    defaultFreq: "DIGEST", defaultEmail: true, defaultInApp: true,
  },
  {
    id: "PHASE_TRANSITION", icon: GitBranch, color: "#8B5CF6",
    label: "Phase transition", labelVi: "Chuyển phase",
    defaultFreq: "DIGEST", defaultEmail: true, defaultInApp: true,
  },
  {
    id: "ISSUE_OVERDUE", icon: Clock, color: "#F97316",
    label: "Issue overdue", labelVi: "Vấn đề quá hạn",
    defaultFreq: "DIGEST", defaultEmail: true, defaultInApp: true,
  },
  {
    id: "DRAFT_PENDING_REVIEW", icon: FileText, color: "var(--text-dim)",
    label: "DRAFT pending review", labelVi: "DRAFT chờ duyệt",
    defaultFreq: "DIGEST", defaultEmail: false, defaultInApp: true,
  },
];

// ── DEFAULT PREFERENCES ───────────────────────────────────────

function getDefaultPreferences() {
  const prefs = {};
  EMAIL_EVENTS.forEach((ev) => {
    prefs[ev.id] = {
      email: ev.defaultEmail,
      inApp: ev.defaultInApp,
      frequency: ev.defaultFreq,
    };
  });
  return prefs;
}

// ── NOTIFICATION ENGINE ───────────────────────────────────────

export class NotificationEngine {
  constructor() {
    this.preferences = this._loadPreferences();
    this.digestQueue = [];
    this.listeners = [];
  }

  _loadPreferences() {
    try {
      const saved = localStorage.getItem("rtr_email_prefs");
      return saved ? JSON.parse(saved) : getDefaultPreferences();
    } catch {
      return getDefaultPreferences();
    }
  }

  savePreferences(prefs, userId) {
    this.preferences = prefs;
    localStorage.setItem("rtr_email_prefs", JSON.stringify(prefs));
    // Persist to Supabase
    if (isSupabaseConnected() && userId) {
      const rows = Object.entries(prefs).map(([eventType, cfg]) => ({
        user_id: userId,
        event_type: eventType,
        email_enabled: cfg.email,
        in_app_enabled: cfg.inApp,
        frequency: cfg.frequency,
      }));
      supabase.from('email_preferences').upsert(rows, { onConflict: 'user_id,event_type' });
    }
  }

  async loadFromSupabase(userId) {
    if (!isSupabaseConnected() || !userId) return;
    const { data } = await supabase.from('email_preferences').select('*').eq('user_id', userId);
    if (data?.length) {
      const prefs = { ...this.preferences };
      data.forEach(row => {
        prefs[row.event_type] = {
          email: row.email_enabled,
          inApp: row.in_app_enabled,
          frequency: row.frequency,
        };
      });
      this.preferences = prefs;
      localStorage.setItem("rtr_email_prefs", JSON.stringify(prefs));
    }
  }

  onToast(callback) {
    this.listeners.push(callback);
  }

  _toast(message, type = "info") {
    this.listeners.forEach((cb) => cb(message, type));
  }

  // Check if a notification should be sent
  shouldNotify(eventType, channel) {
    const pref = this.preferences[eventType];
    if (!pref) return false;
    return channel === "email" ? pref.email : pref.inApp;
  }

  // Send notification — creates Supabase row (triggers handle email)
  // Falls back to toast-only when offline
  async notify(eventType, data, { userId, projectId } = {}) {
    const pref = this.preferences[eventType];
    if (!pref) return;
    const eventDef = EMAIL_EVENTS.find((e) => e.id === eventType);

    // In-app toast (always, for immediate feedback)
    if (pref.inApp) {
      this._toast(
        `${eventDef?.label || eventType}: ${data.title || data.message || ""}`,
        eventType.includes("CRITICAL") || eventType.includes("FAIL") ? "warning" : "info"
      );
    }

    // Create notification row in Supabase → DB triggers handle email dispatch
    if (isSupabaseConnected() && userId) {
      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        type: eventType,
        title: data.title || eventDef?.label || eventType,
        title_vi: data.titleVi || eventDef?.labelVi || null,
        body: data.body || null,
        project_id: projectId || data.projectId || null,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
      });
      if (error) {
        console.warn("[NotificationEngine] Insert failed:", error.message);
      }
    }
  }

  getDigestQueue() {
    return [...this.digestQueue];
  }

  clearDigest() {
    this.digestQueue = [];
  }
}

// Singleton instance
export const notificationEngine = new NotificationEngine();

// ── EMAIL PREFERENCES UI ──────────────────────────────────────

export default function EmailPreferences({ lang, currentUser }) {
  const vi = lang === "vi";
  const [prefs, setPrefs] = useState(() => notificationEngine._loadPreferences());
  const [saved, setSaved] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);

  const togglePref = (eventId, field) => {
    setPrefs((p) => ({
      ...p,
      [eventId]: { ...p[eventId], [field]: !p[eventId]?.[field] },
    }));
    setSaved(false);
  };

  const toggleFreq = (eventId) => {
    setPrefs((p) => ({
      ...p,
      [eventId]: {
        ...p[eventId],
        frequency: p[eventId]?.frequency === "REALTIME" ? "DIGEST" : "REALTIME",
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    notificationEngine.savePreferences(prefs, currentUser?.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={16} color="#3B82F6" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
            {vi ? "Cài Đặt Email" : "Email Preferences"}
          </span>
        </div>
        <button onClick={handleSave}
          style={{
            background: saved ? "#10B98120" : "#3B82F6", border: saved ? "1px solid #10B98140" : "none",
            borderRadius: 4, padding: "6px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, fontFamily: sans,
          }}>
          {saved ? <><Check size={12} /> {vi ? "Đã lưu" : "Saved"}</> : <>{vi ? "Lưu" : "Save Preferences"}</>}
        </button>
      </div>

      {/* Email address */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Email
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "var(--text-primary)", fontFamily: mono }}>
            {currentUser?.email || `${currentUser?.name?.toLowerCase().replace(/\s+/g, ".")}@rtr.vn`}
          </span>
        </div>
      </div>

      {/* Notification settings table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 90px 50px", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span>{vi ? "Sự kiện" : "Event"}</span>
          <span style={{ textAlign: "center" }}>Email</span>
          <span style={{ textAlign: "center" }}>In-App</span>
          <span style={{ textAlign: "center" }}>{vi ? "Tần suất" : "Frequency"}</span>
          <span style={{ textAlign: "center" }}>{vi ? "Xem" : "Preview"}</span>
        </div>
        {EMAIL_EVENTS.map((ev) => {
          const pref = prefs[ev.id] || {};
          const EvIcon = ev.icon;
          return (
            <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 90px 50px", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--bg-input)", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <EvIcon size={12} color={ev.color} />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {vi ? ev.labelVi : ev.label}
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => togglePref(ev.id, "email")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  {pref.email ? <Bell size={14} color="#3B82F6" /> : <BellOff size={14} color="var(--text-disabled)" />}
                </button>
              </div>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => togglePref(ev.id, "inApp")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  {pref.inApp ? <Bell size={14} color="#10B981" /> : <BellOff size={14} color="var(--text-disabled)" />}
                </button>
              </div>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => toggleFreq(ev.id)}
                  style={{
                    background: pref.frequency === "REALTIME" ? "#EF444415" : "#3B82F615",
                    border: `1px solid ${pref.frequency === "REALTIME" ? "#EF444430" : "#3B82F630"}`,
                    borderRadius: 3, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                    color: pref.frequency === "REALTIME" ? "#FCA5A5" : "#60A5FA",
                    cursor: "pointer", fontFamily: mono,
                  }}>
                  {pref.frequency === "REALTIME" ? <><Zap size={8} style={{ display: "inline", verticalAlign: "middle" }} /> RT</> : <><Calendar size={8} style={{ display: "inline", verticalAlign: "middle" }} /> Digest</>}
                </button>
              </div>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => setPreviewEvent(previewEvent === ev.id ? null : ev.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: previewEvent === ev.id ? "#3B82F6" : "var(--text-faint)" }}>
                  <Eye size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Email preview */}
      {previewEvent && (
        <EmailPreview eventType={previewEvent} lang={lang} currentUser={currentUser} onClose={() => setPreviewEvent(null)} />
      )}

      {/* Digest time */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: 12 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {vi ? "Giờ digest" : "Digest time"}
            </div>
            <span style={{ fontSize: 14, fontFamily: mono, color: "var(--text-primary)" }}>08:00 AM</span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {vi ? "Múi giờ" : "Timezone"}
            </div>
            <span style={{ fontSize: 14, fontFamily: mono, color: "var(--text-primary)" }}>Asia/Ho_Chi_Minh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EMAIL PREVIEW ─────────────────────────────────────────────

function EmailPreview({ eventType, lang, currentUser, onClose }) {
  const vi = lang === "vi";
  const ev = EMAIL_EVENTS.find((e) => e.id === eventType);
  const isDigest = ev?.defaultFreq === "DIGEST";

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
          {vi ? "Xem trước Email" : "Email Preview"} — {vi ? ev?.labelVi : ev?.label}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}>
          <X size={12} />
        </button>
      </div>

      {/* Mock email */}
      <div style={{ padding: 16, background: "var(--bg-input)", margin: 12, borderRadius: 6, border: "1px solid var(--border)" }}>
        {!isDigest ? (
          // Realtime template
          <>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>
              Subject: {ev?.id === "CRITICAL_ISSUE_CREATED" ? "🔴" : ev?.id === "FLIGHT_TEST_FAIL" ? "✈" : "⚡"} [RtR] {ev?.label} — RTR-X7
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontSize: 13, color: "#3B82F6", fontWeight: 700, marginBottom: 8 }}>RtR Control Tower</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {vi ? ev?.labelVi : ev?.label}
              </div>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{vi ? "Dự án" : "Project"}: <span style={{ color: "var(--text-primary)" }}>RTR-X7 Surveyor</span></div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Phase: <span style={{ color: "var(--text-primary)" }}>DVT</span></div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{vi ? "Mức độ" : "Severity"}: <span style={{ color: "#EF4444", fontWeight: 700 }}>CRITICAL</span></div>
              </div>
              <div style={{ fontSize: 12, color: "#3B82F6", textDecoration: "underline", cursor: "pointer" }}>
                [{vi ? "Xem chi tiết" : "View Details"}]
              </div>
            </div>
          </>
        ) : (
          // Digest template
          <>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>
              Subject: 📊 [RtR] {vi ? "Tổng hợp hàng ngày" : "Daily Digest"} — {new Date().toLocaleDateString(vi ? "vi-VN" : "en-US")}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontSize: 13, color: "#3B82F6", fontWeight: 700, marginBottom: 4 }}>RtR Control Tower — {vi ? "Tổng hợp hàng ngày" : "Daily Digest"}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                {vi ? "Chào" : "Hello"} {currentUser?.name}, {vi ? "đây là tổng hợp 24 giờ qua" : "here's your 24h summary"}:
              </div>
              <div style={{ marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>📌 {vi ? "Issues gán cho bạn" : "Issues assigned"}: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>1</span>
              </div>
              <div style={{ marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>⏰ {vi ? "Issues quá hạn" : "Overdue issues"}: </span>
                <span style={{ color: "#F97316", fontWeight: 700 }}>0</span>
              </div>
              <div style={{ marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>📋 {vi ? "DRAFT chờ duyệt" : "DRAFT pending"}: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>2</span>
              </div>
              <div style={{ fontSize: 12, color: "#3B82F6", textDecoration: "underline", cursor: "pointer", marginTop: 10 }}>
                [{vi ? "Mở Control Tower" : "Open Control Tower"}]
              </div>
            </div>
          </>
        )}
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 8, fontSize: 10, color: "var(--text-disabled)" }}>
          {vi ? "Tùy chỉnh tại Settings > Email Preferences" : "Manage notifications in Settings > Email Preferences"}
        </div>
      </div>
    </div>
  );
}

// ── TOAST NOTIFICATION COMPONENT ──────────────────────────────

export function NotificationToast({ message, type, onClose }) {
  const durations = { error: 6000, warning: 6000, success: 3000, info: 4000, email: 4000 };
  useEffect(() => {
    const timer = setTimeout(() => onClose(), durations[type] || 4000);
    return () => clearTimeout(timer);
  }, [message, type]);

  const colors = {
    info: { bg: "#3B82F615", border: "#3B82F640", text: "#60A5FA", icon: Bell },
    email: { bg: "#8B5CF615", border: "#8B5CF640", text: "#A78BFA", icon: Send },
    warning: { bg: "#F59E0B15", border: "#F59E0B40", text: "#FDE68A", icon: AlertTriangle },
    success: { bg: "#10B98115", border: "#10B98140", text: "#6EE7B7", icon: Check },
  };
  const c = colors[type] || colors.info;
  const Icon = c.icon;

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 99999,
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6,
      padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
      maxWidth: 360, boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      <Icon size={14} color={c.text} />
      <span style={{ fontSize: 13, color: c.text, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 0 }}>
        <X size={10} />
      </button>
    </div>
  );
}
