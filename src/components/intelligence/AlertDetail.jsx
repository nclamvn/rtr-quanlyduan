/**
 * AlertDetail — Full detail view for a single alert
 * Renders cascade chain, allocation, dispatch info based on agent type
 */
import {
  X,
  AlertTriangle,
  Shield,
  Brain,
  UserCheck,
  Send,
  ArrowRight,
  Clock,
  User,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";
const SEV_COLORS = { critical: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
const AGENT_COLORS = { convergence: "#8B5CF6", causal: "#F97316", allocation: "#06B6D4", dispatch: "#10B981" };
const GATE_COLORS = { auto: "#10B981", cc_lead: "#F59E0B", queued_review: "#3B82F6", skipped: "#6B7280" };

export default function AlertDetail({ alert, lang, t, onClose }) {
  if (!alert) return null;
  const sevColor = SEV_COLORS[alert.severity] || SEV_COLORS.info;
  const agentColor = AGENT_COLORS[alert.agent] || "#6B7280";
  const tInbox = t.inbox || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Badge label={alert.severity} color={sevColor} />
            <Badge label={alert.agent} color={agentColor} />
            <Badge label={alert.status} color={alert.status === "open" ? "#EF4444" : "#10B981"} />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
            {alert.entity_ref} · {new Date(alert.created_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "var(--text-dim)",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Summary */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, lineHeight: 1.5 }}>
          {alert.summary}
        </div>
      </Card>

      {/* Agent-specific details */}
      {alert.agent === "causal" && <CausalDetails details={alert.details} tInbox={tInbox} lang={lang} />}
      {alert.agent === "convergence" && <ConvergenceDetails details={alert.details} tInbox={tInbox} lang={lang} />}

      {/* Allocation section */}
      {alert.suggested_assignee && <AllocationSection alert={alert} tInbox={tInbox} lang={lang} />}

      {/* Dispatch section */}
      {alert.dispatched_at && <DispatchSection alert={alert} tInbox={tInbox} lang={lang} />}

      {/* Action buttons (disabled — Phase B) */}
      <div style={{ display: "flex", gap: 6, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        {["acknowledge", "override", "dismiss"].map((action) => (
          <button
            key={action}
            disabled
            title={tInbox.phaseB || "Coming in Phase B"}
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-disabled)",
              cursor: "not-allowed",
              fontFamily: sans,
              textTransform: "capitalize",
            }}
          >
            {tInbox[action] || action}
          </button>
        ))}
      </div>
    </div>
  );
}

function CausalDetails({ details, tInbox, lang }) {
  if (!details) return null;
  const cascade = details.cascade || [];
  const action = details.recommended_action;

  return (
    <>
      {cascade.length > 0 && (
        <Card title={tInbox.cascadeChain || (lang === "vi" ? "Chuỗi cascade" : "Cascade Chain")} icon={Brain}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cascade.map((hop, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: mono }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {hop.entity_type || hop.entity}
                  {hop.entity_id ? `:${hop.entity_id}` : ""}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    padding: "1px 6px",
                    background: "#F9731520",
                    color: "#F97316",
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  <ArrowRight size={8} />
                  {hop.relationship}
                </span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {hop.next_entity_type || hop.next_entity}
                  {hop.next_entity_id ? `:${hop.next_entity_id}` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {action && (
        <Card
          title={tInbox.recommendedAction || (lang === "vi" ? "Hành động đề xuất" : "Recommended Action")}
          icon={Target}
        >
          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: sans }}>{action}</div>
        </Card>
      )}
    </>
  );
}

function ConvergenceDetails({ details, tInbox, lang }) {
  if (!details) return null;
  const rule = details.rule || details.rule_triggered;
  const signalCount = details.signal_count || details.signalCount;

  return (
    <Card title={tInbox.convergenceInfo || (lang === "vi" ? "Chi tiết hội tụ" : "Convergence Info")} icon={Shield}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontFamily: mono }}>
        {rule && <Row label={tInbox.rule || "Rule"} value={rule} />}
        {signalCount != null && <Row label={tInbox.signals || "Signals"} value={signalCount} />}
        {details.z_score != null && <Row label="Z-score" value={details.z_score.toFixed(2)} />}
      </div>
    </Card>
  );
}

function AllocationSection({ alert, tInbox, lang }) {
  const conf = alert.allocation_confidence;
  const confColor = conf >= 0.85 ? "#10B981" : conf >= 0.7 ? "#F59E0B" : "#EF4444";

  return (
    <Card title={tInbox.allocation || (lang === "vi" ? "Phân bổ đề xuất" : "Suggested Allocation")} icon={UserCheck}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Row
          label={tInbox.assignee || (lang === "vi" ? "Người nhận" : "Assignee")}
          value={alert.suggested_assignee?.slice(0, 8) + "..."}
          icon={User}
        />
        <Row label={tInbox.deadline || "Deadline"} value={alert.suggested_deadline || "—"} icon={Calendar} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: mono }}>
          <span style={{ color: "var(--text-dim)", minWidth: 80 }}>
            {tInbox.confidence || (lang === "vi" ? "Độ tin cậy" : "Confidence")}
          </span>
          <span style={{ width: 60, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                width: `${Math.round(conf * 100)}%`,
                height: "100%",
                background: confColor,
                borderRadius: 3,
              }}
            />
          </span>
          <span style={{ color: confColor, fontWeight: 700 }}>{Math.round(conf * 100)}%</span>
        </div>
        {alert.allocation_rationale && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: sans, lineHeight: 1.5, marginTop: 4 }}>
            {alert.allocation_rationale}
          </div>
        )}
      </div>
    </Card>
  );
}

function DispatchSection({ alert, tInbox, lang }) {
  const gateColor = GATE_COLORS[alert.dispatch_gate] || "#6B7280";
  const channels = alert.dispatch_channels || [];

  return (
    <Card title={tInbox.dispatch || (lang === "vi" ? "Thông báo đã gửi" : "Dispatch Status")} icon={Send}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontFamily: mono }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--text-dim)", minWidth: 80 }}>Gate</span>
          <Badge label={alert.dispatch_gate || "—"} color={gateColor} />
        </div>
        <Row
          label={tInbox.channels || (lang === "vi" ? "Kênh" : "Channels")}
          value={channels.length > 0 ? channels.join(", ") : "—"}
        />
        <Row
          label={tInbox.sentAt || (lang === "vi" ? "Gửi lúc" : "Sent at")}
          value={new Date(alert.dispatched_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
          icon={Clock}
        />
      </div>
    </Card>
  );
}

// ── Shared helpers ──

function Card({ title, icon: Icon, children }) {
  return (
    <div
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-secondary)",
            fontFamily: sans,
          }}
        >
          {Icon && <Icon size={12} />}
          {title}
        </div>
      )}
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 7px",
        borderRadius: 3,
        background: color + "15",
        color,
        fontSize: 9,
        fontWeight: 700,
        fontFamily: mono,
        textTransform: "uppercase",
        border: `1px solid ${color}25`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function Row({ label, value, icon: Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: mono }}>
      {Icon && <Icon size={10} color="var(--text-faint)" />}
      <span style={{ color: "var(--text-dim)", minWidth: 80 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
