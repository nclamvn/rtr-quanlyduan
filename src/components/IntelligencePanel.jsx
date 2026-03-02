/**
 * IntelligencePanel — SignalHub Intelligence Dashboard
 * Shows PHI scores, convergence alerts, anomaly detection, and freshness
 */
import { useState } from "react";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Shield, Zap, BarChart3, Clock, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, CircleAlert, Eye, Radio, RefreshCw,
} from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const SEV_COLORS = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#6B7280",
  info: "#9CA3AF",
};

const LEVEL_COLORS = {
  healthy: "#10B981",
  attention: "#F59E0B",
  warning: "#F97316",
  critical: "#EF4444",
  unknown: "#6B7280",
};

const HEALTH_COLORS = {
  healthy: "#10B981",
  degraded: "#F59E0B",
  critical: "#EF4444",
};

const FRESHNESS_COLORS = {
  fresh: "#10B981",
  stale: "#F59E0B",
  very_stale: "#F97316",
  no_data: "#6B7280",
  error: "#EF4444",
  disabled: "#4B5563",
};

function Badge({ label, color, size = "sm" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "sm" ? "1px 7px" : "3px 10px",
      borderRadius: 3, background: color + "15", color,
      fontSize: size === "sm" ? 9 : 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      border: `1px solid ${color}25`, fontFamily: mono,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function Section({ title, children, actions, icon: Icon, noPad }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            {Icon && <Icon size={14} />}
            {title}
          </div>
          {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : 16 }}>{children}</div>
    </div>
  );
}

function TrendIcon({ trend, size = 12 }) {
  if (trend === "rising") return <TrendingUp size={size} color="#EF4444" />;
  if (trend === "falling") return <TrendingDown size={size} color="#10B981" />;
  return <Minus size={size} color="var(--text-faint)" />;
}

// ── PHI Card ──────────────────────────────────────────────────────────

function PHICard({ score, project, t, convergences }) {
  const [expanded, setExpanded] = useState(false);
  const level = score?.level || "unknown";
  const color = LEVEL_COLORS[level] || LEVEL_COLORS.unknown;
  const value = score?.score ?? 0;
  const hasConvergence = convergences.length > 0;

  return (
    <div style={{
      background: "var(--bg-input)", border: `1px solid ${hasConvergence ? "#EF444440" : "var(--border)"}`,
      borderRadius: 8, padding: 14, position: "relative", overflow: "hidden",
      cursor: "pointer",
      boxShadow: hasConvergence ? "0 0 12px #EF444420" : "none",
    }} onClick={() => setExpanded(!expanded)}>
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: sans }}>
            {project?.name || score?.entityId}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, marginTop: 1 }}>
            {score?.entityId} / {project?.phase || "—"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasConvergence && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", animation: "pulse 1.5s infinite" }} />
          )}
          <TrendIcon trend={score?.trend} />
          {expanded ? <ChevronDown size={12} color="var(--text-faint)" /> : <ChevronRight size={12} color="var(--text-faint)" />}
        </div>
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: mono, color, lineHeight: 1 }}>
          {Math.round(value)}
        </div>
        <Badge label={t.intel?.levels?.[level] || level} color={color} />
      </div>

      {/* Score bar */}
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>

      {/* Expanded details */}
      {expanded && score?.components && (
        <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          {Object.entries(score.components).map(([id, comp]) => (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11, fontFamily: mono }}>
              <span style={{ color: "var(--text-dim)" }}>{id.replace(/_/g, " ")}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {comp.weighted.toFixed(1)} <span style={{ color: "var(--text-faint)", fontSize: 9 }}>({comp.signalCount} sig)</span>
              </span>
            </div>
          ))}
          {score.activeModifiers?.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 10, color: "#F59E0B", fontFamily: mono }}>
              {t.intel?.modifiersActive || "Modifiers active"}: {score.activeModifiers.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Convergence Alert Card ───────────────────────────────────────────

function ConvergenceCard({ alert, t }) {
  const [expanded, setExpanded] = useState(false);
  const color = SEV_COLORS[alert.severity] || SEV_COLORS.info;

  return (
    <div style={{
      background: "var(--bg-input)", border: `1px solid ${color}30`,
      borderRadius: 6, padding: 12, cursor: "pointer",
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Zap size={12} color={color} />
            <Badge label={alert.severity} color={color} />
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
              {alert.signalTypes.length} {t.intel?.signalTypes || "types"} / {alert.totalEvents} {t.intel?.events || "events"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600, fontFamily: sans }}>
            {Object.entries(alert.dimensionValues).map(([k, v]) => `${k}: ${v}`).join(" / ")}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: mono, color }}>
          {alert.score}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: sans, marginBottom: 6 }}>
            {t.intel?.contributingSignals || "Contributing signal types"}: {alert.signalTypes.join(", ")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {alert.signals.slice(0, 8).map((s, i) => (
              <span key={i} style={{
                fontSize: 9, fontFamily: mono, padding: "2px 6px",
                background: "var(--bg-secondary)", borderRadius: 3,
                color: "var(--text-dim)", border: "1px solid var(--border)",
              }}>
                {s.title.slice(0, 50)}
              </span>
            ))}
            {alert.signals.length > 8 && (
              <span style={{ fontSize: 9, fontFamily: mono, color: "var(--text-faint)" }}>
                +{alert.signals.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Anomaly Card ─────────────────────────────────────────────────────

function AnomalyCard({ anomaly, t }) {
  const color = SEV_COLORS[anomaly.severity] || SEV_COLORS.info;

  return (
    <div style={{
      background: "var(--bg-input)", border: `1px solid ${color}20`,
      borderRadius: 6, padding: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <BarChart3 size={12} color={color} />
            <Badge label={anomaly.severity} color={color} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600, fontFamily: sans }}>
            {anomaly.message}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: mono, color }}>
            {anomaly.multiplier}x
          </div>
          <div style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: mono }}>
            z={anomaly.zScore}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, fontFamily: mono, color: "var(--text-dim)" }}>
        <span>{t.intel?.observed || "Observed"}: {anomaly.observedValue}</span>
        <span>{t.intel?.expected || "Expected"}: {anomaly.expectedValue}</span>
      </div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────

export default function IntelligencePanel({ intel, projects, lang, t, onNavigateIssue }) {
  const [subTab, setSubTab] = useState("overview");

  const { state, convergences, anomalies, projectScores, freshness } = intel;
  const healthColor = HEALTH_COLORS[freshness.overallHealth] || HEALTH_COLORS.degraded;

  const subTabs = [
    { id: "overview", label: t.intel?.overview || "Overview", Icon: Activity },
    { id: "convergence", label: t.intel?.convergence || (lang === "vi" ? "H\u1ED9i t\u1EE5" : "Convergence"), Icon: Zap, badge: convergences.length },
    { id: "anomaly", label: t.intel?.anomaly || (lang === "vi" ? "B\u1EA5t th\u01B0\u1EDDng" : "Anomaly"), Icon: BarChart3, badge: anomalies.length },
    { id: "freshness", label: t.intel?.freshness || (lang === "vi" ? "\u0110\u1ED9 t\u01B0\u01A1i" : "Freshness"), Icon: RefreshCw },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <Section
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <Shield size={16} color={healthColor} />
            <span>{t.intel?.title || (lang === "vi" ? "Tr\u00ED tu\u1EC7 D\u1EF1 \u00E1n" : "Project Intelligence")}</span>
            <Badge label={freshness.overallHealth} color={healthColor} />
            <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: mono, color: "var(--text-faint)" }}>
              {state.signalCount} {t.intel?.signals || "signals"}
            </span>
          </div>
        }
      >
        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
          {subTabs.map(st => (
            <button key={st.id} onClick={() => setSubTab(st.id)}
              style={{
                background: "none", border: "none",
                borderBottom: subTab === st.id ? "2px solid #3B82F6" : "2px solid transparent",
                padding: "6px 12px", color: subTab === st.id ? "var(--text-primary)" : "var(--text-dim)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, fontFamily: sans,
              }}>
              <st.Icon size={11} />
              {st.label}
              {st.badge > 0 && <span style={{
                background: "#EF4444", color: "#fff", borderRadius: 8,
                padding: "0 5px", fontSize: 10, fontWeight: 800, minWidth: 14, textAlign: "center",
              }}>{st.badge}</span>}
            </button>
          ))}
        </div>

        {/* Overview */}
        {subTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Summary metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
              <MetricBox
                label={t.intel?.signalCount || "Signals"}
                value={state.signalCount}
                icon={Activity}
                color="#3B82F6"
              />
              <MetricBox
                label={t.intel?.convergenceCount || (lang === "vi" ? "H\u1ED9i t\u1EE5" : "Convergences")}
                value={convergences.length}
                icon={Zap}
                color={convergences.length > 0 ? "#EF4444" : "#10B981"}
              />
              <MetricBox
                label={t.intel?.anomalyCount || (lang === "vi" ? "B\u1EA5t th\u01B0\u1EDDng" : "Anomalies")}
                value={anomalies.length}
                icon={BarChart3}
                color={anomalies.length > 0 ? "#F59E0B" : "#10B981"}
              />
              <MetricBox
                label={t.intel?.dataFreshness || (lang === "vi" ? "\u0110\u1ED9 t\u01B0\u01A1i" : "Freshness")}
                value={`${freshness.coveragePercent}%`}
                icon={RefreshCw}
                color={healthColor}
              />
            </div>

            {/* PHI Scores */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={13} />
                {t.intel?.projectHealth || (lang === "vi" ? "S\u1EE9c kh\u1ECFe D\u1EF1 \u00E1n (PHI)" : "Project Health Index (PHI)")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {projects.map(p => {
                  const score = projectScores.find(s => s.entityId === p.id);
                  const projConvergences = convergences.filter(c => c.dimensionValues.project === p.id);
                  return (
                    <PHICard
                      key={p.id}
                      score={score}
                      project={p}
                      t={t}
                      convergences={projConvergences}
                    />
                  );
                })}
              </div>
            </div>

            {/* Recent convergences (top 3) */}
            {convergences.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={13} color="#EF4444" />
                  {t.intel?.recentConvergences || (lang === "vi" ? "H\u1ED9i t\u1EE5 g\u1EA7n \u0111\u00E2y" : "Recent Convergences")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {convergences.slice(0, 3).map((c, i) => (
                    <ConvergenceCard key={i} alert={c} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Convergence tab */}
        {subTab === "convergence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {convergences.length === 0 ? (
              <EmptyState
                icon={Zap}
                text={t.intel?.noConvergences || (lang === "vi" ? "Kh\u00F4ng ph\u00E1t hi\u1EC7n h\u1ED9i t\u1EE5 n\u00E0o" : "No convergences detected")}
                sub={t.intel?.noConvergencesSub || (lang === "vi" ? "H\u1EC7 th\u1ED1ng s\u1EBD ph\u00E1t hi\u1EC7n khi nhi\u1EC1u lo\u1EA1i t\u00EDn hi\u1EC7u xu\u1EA5t hi\u1EC7n c\u00F9ng v\u1ECB tr\u00ED" : "System will detect when multiple signal types converge in the same space")}
              />
            ) : (
              convergences.map((c, i) => <ConvergenceCard key={i} alert={c} t={t} />)
            )}
          </div>
        )}

        {/* Anomaly tab */}
        {subTab === "anomaly" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {anomalies.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                text={t.intel?.noAnomalies || (lang === "vi" ? "Kh\u00F4ng ph\u00E1t hi\u1EC7n b\u1EA5t th\u01B0\u1EDDng" : "No anomalies detected")}
                sub={t.intel?.noAnomaliesSub || (lang === "vi" ? "H\u1EC7 th\u1ED1ng c\u1EA7n t\u00EDch l\u0169y d\u1EEF li\u1EC7u baseline \u0111\u1EC3 so s\u00E1nh" : "System needs to accumulate baseline data for comparison")}
              />
            ) : (
              anomalies.map((a, i) => <AnomalyCard key={i} anomaly={a} t={t} />)
            )}
          </div>
        )}

        {/* Freshness tab */}
        {subTab === "freshness" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
              <MetricBox label={t.intel?.freshSources || "Fresh"} value={freshness.fresh} icon={CheckCircle2} color="#10B981" />
              <MetricBox label={t.intel?.staleSources || "Stale"} value={freshness.stale} icon={Clock} color="#F59E0B" />
              <MetricBox label={t.intel?.errorSources || "Error"} value={freshness.error} icon={XCircle} color="#EF4444" />
              <MetricBox label={t.intel?.coverage || "Coverage"} value={`${freshness.coveragePercent}%`} icon={Radio} color={healthColor} />
            </div>

            {/* Degraded decisions */}
            {freshness.degradedDecisions.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", fontFamily: sans, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={12} />
                  {t.intel?.degradedDecisions || (lang === "vi" ? "Quy\u1EBFt \u0111\u1ECBnh b\u1ECB suy gi\u1EA3m" : "Degraded Decisions")}
                </div>
                {freshness.degradedDecisions.map((d, i) => (
                  <div key={i} style={{
                    background: "#F59E0B08", border: "1px solid #F59E0B20",
                    borderRadius: 4, padding: "6px 10px", marginBottom: 4,
                    fontSize: 11, fontFamily: mono, color: "var(--text-dim)",
                  }}>
                    <span style={{ fontWeight: 600, color: "#F59E0B" }}>{d.indexId}</span>: {d.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* CSS animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function MetricBox({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: "var(--bg-input)", border: "1px solid var(--border)",
      borderRadius: 6, padding: "10px 12px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: sans, display: "flex", alignItems: "center", gap: 4 }}>
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: mono, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 20px" }}>
      <Icon size={32} color="var(--text-faint)" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)", fontFamily: sans, marginBottom: 4 }}>{text}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: sans }}>{sub}</div>}
    </div>
  );
}
