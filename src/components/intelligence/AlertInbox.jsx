/**
 * AlertInbox — Agent-generated alerts list + detail panel
 * Renders as sub-tab inside IntelligencePanel
 */
import { useEffect } from "react";
import { useAlertsStore } from "../../stores/alertsStore";
import AlertDetail from "./AlertDetail";
import { Inbox, AlertTriangle, Shield, Brain, UserCheck, Send, Clock, ChevronRight } from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const SEV_COLORS = { critical: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
const AGENT_COLORS = { convergence: "#8B5CF6", causal: "#F97316", allocation: "#06B6D4", dispatch: "#10B981" };
const AGENT_ICONS = { convergence: Shield, causal: Brain, allocation: UserCheck, dispatch: Send };
const STATUS_TABS = ["open", "acknowledged", "resolved", "ALL"];

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins}p trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days}d trước`;
}

export default function AlertInbox({ lang, t }) {
  const {
    alerts,
    filters,
    selectedAlertId,
    loading,
    loadAlerts,
    setFilter,
    selectAlert,
    clearSelection,
    setupRealtime,
    teardownRealtime,
  } = useAlertsStore();

  useEffect(() => {
    loadAlerts();
    setupRealtime();
    return () => teardownRealtime();
  }, []);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || null;
  const tInbox = t.inbox || {};

  return (
    <div style={{ display: "flex", gap: 0, minHeight: 400 }}>
      {/* ── Left: List ── */}
      <div
        style={{
          width: selectedAlert ? "40%" : "100%",
          borderRight: selectedAlert ? "1px solid var(--border)" : "none",
          overflow: "auto",
          maxHeight: 600,
          transition: "width 0.2s",
        }}
      >
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 4, padding: "0 0 10px 0", flexWrap: "wrap" }}>
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => setFilter("status", st)}
              style={{
                background: filters.status === st ? "#1D4ED820" : "transparent",
                border: `1px solid ${filters.status === st ? "#3B82F6" : "var(--border)"}`,
                borderRadius: 4,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: filters.status === st ? "#3B82F6" : "var(--text-dim)",
                cursor: "pointer",
                fontFamily: sans,
                textTransform: "capitalize",
              }}
            >
              {tInbox[st] || st}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {["ALL", "critical", "warning", "info"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter("severity", sev)}
                style={{
                  background: filters.severity === sev ? (SEV_COLORS[sev] || "#3B82F6") + "20" : "transparent",
                  border: `1px solid ${filters.severity === sev ? SEV_COLORS[sev] || "#3B82F6" : "var(--border)"}`,
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: filters.severity === sev ? SEV_COLORS[sev] || "#3B82F6" : "var(--text-faint)",
                  cursor: "pointer",
                  fontFamily: mono,
                  textTransform: "uppercase",
                }}
              >
                {sev === "ALL" ? tInbox.allSeverity || "All" : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-faint)", fontSize: 12 }}>
            {tInbox.loading || "Đang tải..."}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyInbox t={tInbox} lang={lang} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                selected={alert.id === selectedAlertId}
                onClick={() => selectAlert(alert.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Detail ── */}
      {selectedAlert && (
        <div style={{ flex: 1, overflow: "auto", maxHeight: 600, padding: "0 0 0 12px" }}>
          <AlertDetail alert={selectedAlert} lang={lang} t={t} onClose={clearSelection} />
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, selected, onClick }) {
  const sevColor = SEV_COLORS[alert.severity] || SEV_COLORS.info;
  const agentColor = AGENT_COLORS[alert.agent] || "#6B7280";
  const AgentIcon = AGENT_ICONS[alert.agent] || AlertTriangle;

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "#1D4ED810" : "var(--bg-input)",
        border: `1px solid ${selected ? "#3B82F640" : "var(--border)"}`,
        borderRadius: 6,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "1px 6px",
                borderRadius: 3,
                background: sevColor + "15",
                color: sevColor,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: mono,
                textTransform: "uppercase",
                border: `1px solid ${sevColor}25`,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: sevColor }} />
              {alert.severity}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "1px 6px",
                borderRadius: 3,
                background: agentColor + "15",
                color: agentColor,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: mono,
                border: `1px solid ${agentColor}25`,
              }}
            >
              <AgentIcon size={9} />
              {alert.agent}
            </span>
            {alert.dispatch_gate && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: mono,
                  color: "var(--text-faint)",
                  padding: "1px 4px",
                  background: "var(--hover-bg)",
                  borderRadius: 3,
                }}
              >
                {alert.dispatch_gate}
              </span>
            )}
          </div>

          {/* Summary */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: sans,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {alert.summary}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              fontSize: 10,
              color: "var(--text-faint)",
              fontFamily: mono,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} />
              {relativeTime(alert.created_at)}
            </span>
            {alert.entity_ref && <span>{alert.entity_ref}</span>}
            {alert.allocation_confidence != null && <ConfidenceBar value={alert.allocation_confidence} />}
          </div>
        </div>

        <ChevronRight size={14} color="var(--text-faint)" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? "#10B981" : value >= 0.7 ? "#F59E0B" : "#EF4444";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 30, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <span style={{ display: "block", width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </span>
      <span style={{ fontSize: 9, color }}>{pct}%</span>
    </span>
  );
}

function EmptyInbox({ t, lang }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <Inbox size={36} color="var(--text-faint)" style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)", fontFamily: sans, marginBottom: 6 }}>
        {t.empty || (lang === "vi" ? "Chưa có cảnh báo" : "No alerts yet")}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-faint)",
          fontFamily: sans,
          lineHeight: 1.6,
          maxWidth: 360,
          margin: "0 auto",
        }}
      >
        {t.emptySub ||
          (lang === "vi"
            ? "4 agent đang giám sát — cảnh báo sẽ xuất hiện khi phát hiện bất thường từ dữ liệu MRP."
            : "4 agents are monitoring — alerts will appear when anomalies are detected from MRP data.")}
      </div>
    </div>
  );
}
