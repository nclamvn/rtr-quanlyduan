/**
 * ForecastPanel — Milestone slip + Part EOL forecast views
 * Sub-tab inside IntelligencePanel
 */
import { useEffect, useState } from "react";
import { fetchLatestForecasts } from "../../services/forecastsService";
import { Calendar, AlertTriangle, Package, TrendingUp, Clock, ChevronDown, ChevronRight, Target } from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const RISK_COLORS = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const SEV_COLORS = { info: "#3B82F6", warning: "#F59E0B", critical: "#EF4444" };

export default function ForecastPanel({ lang, t }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const tFc = t.forecast || {};

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchLatestForecasts();
      setForecasts(data);
      setLoading(false);
    })();
  }, []);

  const milestoneForecasts = forecasts.filter((f) => f.forecast_type === "milestone_slip");
  const eolForecasts = forecasts.filter((f) => f.forecast_type === "part_eol");

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--text-faint)", fontSize: 12 }}>
        {tFc.loading || "Đang tải dự đoán..."}
      </div>
    );
  }

  if (forecasts.length === 0) {
    return <EmptyForecast t={tFc} lang={lang} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Milestone Slip Section */}
      {milestoneForecasts.length > 0 && (
        <Section
          title={tFc.milestoneSlip || (lang === "vi" ? "Xác suất trễ Milestone" : "Milestone Slip Forecast")}
          icon={Calendar}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestoneForecasts.map((f) => (
              <MilestoneCard key={f.id} forecast={f} tFc={tFc} />
            ))}
          </div>
        </Section>
      )}

      {/* Part EOL Section */}
      {eolForecasts.length > 0 && (
        <Section title={tFc.partEol || (lang === "vi" ? "Linh kiện hết hạn (EOL)" : "Part EOL Impact")} icon={Package}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eolForecasts.map((f) => (
              <EolCard key={f.id} forecast={f} lang={lang} tFc={tFc} />
            ))}
          </div>
        </Section>
      )}

      {/* Methodology note */}
      <div
        style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, textAlign: "center", padding: "8px 0" }}
      >
        {tFc.methodology ||
          (lang === "vi"
            ? "Dựa trên historical mean + trend adjustment, valid 24h. Cập nhật hàng ngày lúc 6h sáng."
            : "Based on historical mean + trend adjustment, valid 24h. Updated daily at 6 AM.")}
      </div>
    </div>
  );
}

function MilestoneCard({ forecast, tFc }) {
  const [expanded, setExpanded] = useState(false);
  const pred = forecast.prediction || {};
  const risk = pred.overall_project_risk || "low";
  const riskColor = RISK_COLORS[risk] || RISK_COLORS.low;
  const milestones = pred.milestones || [];

  return (
    <div
      style={{
        background: "var(--bg-input)",
        border: `1px solid ${riskColor}30`,
        borderRadius: 6,
        padding: 12,
        cursor: "pointer",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge label={risk} color={riskColor} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
            {forecast.entity_ref}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
            {milestones.length} {tFc.pendingMilestones || "milestones"}
          </span>
        </div>
        {expanded ? (
          <ChevronDown size={14} color="var(--text-faint)" />
        ) : (
          <ChevronRight size={14} color="var(--text-faint)" />
        )}
      </div>

      {expanded && milestones.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          {milestones.map((m) => {
            const slipColor = m.slip_probability >= 0.7 ? "#EF4444" : m.slip_probability >= 0.4 ? "#F59E0B" : "#10B981";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "4px 0",
                  fontSize: 11,
                  fontFamily: mono,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Target size={10} color={slipColor} />
                  <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{m.phase}</span>
                  <span style={{ color: "var(--text-faint)" }}>{m.target_date}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: slipColor, fontWeight: 700 }}>
                    {Math.round(m.slip_probability * 100)}% {tFc.slipChance || "slip"}
                  </span>
                  {m.expected_slip_days > 0 && (
                    <span style={{ color: "var(--text-dim)" }}>+{m.expected_slip_days}d</span>
                  )}
                </div>
              </div>
            );
          })}
          {pred.inputs && (
            <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
              {tFc.basedOn || "Based on"}: {pred.inputs.historical_slips} historical,{" "}
              {pred.inputs.open_issues?.critical || 0} critical + {pred.inputs.open_issues?.high || 0} high issues,{" "}
              {pred.inputs.unchecked_gates || 0} unchecked gates
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EolCard({ forecast, lang, tFc }) {
  const pred = forecast.prediction || {};
  const sevColor = SEV_COLORS[pred.severity] || SEV_COLORS.info;
  const daysLeft = pred.days_to_must_reorder ?? 999;

  return (
    <div style={{ background: "var(--bg-input)", border: `1px solid ${sevColor}30`, borderRadius: 6, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Badge label={pred.severity || "info"} color={sevColor} />
            <Badge label={pred.lifecycle_status || "EOL"} color="#6B7280" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
            {pred.part_name || forecast.entity_ref}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, marginTop: 2 }}>
            {pred.part_number} · {pred.available_qty} {tFc.remaining || "remaining"} · {pred.consumption_rate_per_day}/d
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: mono, color: sevColor, lineHeight: 1 }}>
            {daysLeft}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: mono }}>
            {tFc.daysToReorder || (lang === "vi" ? "ngày để đặt" : "days to reorder")}
          </div>
        </div>
      </div>
      {pred.affected_work_orders?.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-dim)", fontFamily: mono }}>
          <Clock size={9} style={{ display: "inline", verticalAlign: "middle" }} /> {pred.affected_work_orders.length}{" "}
          WO · {pred.affected_milestones?.length || 0} milestones {tFc.affected || "affected"}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: sans,
        }}
      >
        {Icon && <Icon size={14} />}
        {title}
      </div>
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

function EmptyForecast({ t, lang }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <TrendingUp size={36} color="var(--text-faint)" style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)", fontFamily: sans, marginBottom: 6 }}>
        {t.empty || (lang === "vi" ? "Chưa có dự đoán" : "No forecasts yet")}
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
            ? "Dự đoán được tạo hàng ngày lúc 6h sáng. Cần data MRP ≥ 7 ngày để baseline chính xác."
            : "Forecasts are generated daily at 6 AM. Need ≥ 7 days of MRP data for accurate baseline.")}
      </div>
    </div>
  );
}
