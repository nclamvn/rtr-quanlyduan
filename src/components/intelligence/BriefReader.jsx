/**
 * BriefReader — CEO Weekly Brief viewer with decision capture
 * Sub-tab inside IntelligencePanel
 */
import { useEffect, useState } from "react";
import { fetchLatestBrief, recordDecision } from "../../services/briefsService";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileText,
  Star,
  GitBranch,
  Target,
  Shield,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const IMPACT_COLORS = { high: "#EF4444", medium: "#F59E0B", low: "#3B82F6" };
const PROB_COLORS = (p) => (p >= 0.7 ? "#10B981" : p >= 0.4 ? "#F59E0B" : "#EF4444");

export default function BriefReader({ lang, t }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const tBr = t.brief || {};

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchLatestBrief();
      setBrief(data);
      if (data?.ceo_decision) {
        setSelectedScenario(data.ceo_decision.scenario_index);
        setDecisionNote(data.ceo_decision.note || "");
      }
      setLoading(false);
    })();
  }, []);

  const handleDecision = async () => {
    if (selectedScenario == null || !brief) return;
    setSubmitting(true);
    const { data } = await recordDecision(brief.id, selectedScenario, decisionNote, user?.id);
    if (data) setBrief(data);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--text-faint)", fontSize: 12 }}>
        {tBr.loading || "Đang tải báo cáo..."}
      </div>
    );
  }

  if (!brief) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <FileText size={36} color="var(--text-faint)" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dim)", fontFamily: sans, marginBottom: 6 }}>
          {tBr.empty || (lang === "vi" ? "Chưa có báo cáo" : "No briefs yet")}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: sans }}>
          {tBr.emptySub ||
            (lang === "vi"
              ? "Báo cáo CEO tự động tạo mỗi Chủ nhật 22h."
              : "CEO brief auto-generates every Sunday 10 PM.")}
        </div>
      </div>
    );
  }

  const isDraft = brief.status === "draft";
  const scenarios = brief.scenarios || [];
  const recommendations = brief.recommendations || [];
  const highlights = brief.highlights || [];
  const risks = brief.risk_summary || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Period + status header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono }}>
          {brief.period_start} → {brief.period_end}
        </div>
        <Badge label={brief.status} color={isDraft ? "#F59E0B" : "#10B981"} />
      </div>

      {/* Executive summary */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, lineHeight: 1.6 }}>
          {brief.executive_summary}
        </div>
      </Card>

      {/* Highlights */}
      {highlights.length > 0 && (
        <Section title={tBr.highlights || (lang === "vi" ? "Điểm nổi bật" : "Highlights")} icon={Star}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{h.icon || "📌"}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
                    {h.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: sans, marginTop: 2 }}>{h.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Scenarios */}
      <Section title={tBr.scenarios || (lang === "vi" ? "3 Kịch bản" : "3 Scenarios")} icon={GitBranch}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scenarios.map((s, i) => (
            <ScenarioCard
              key={i}
              scenario={s}
              index={i}
              selected={selectedScenario === i}
              onSelect={isDraft ? () => setSelectedScenario(i) : undefined}
              tBr={tBr}
            />
          ))}
        </div>
      </Section>

      {/* Recommendations */}
      <Section title={tBr.recommendations || (lang === "vi" ? "Đề xuất hành động" : "Recommendations")} icon={Target}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {recommendations.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
                borderBottom: i < recommendations.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--hover-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: mono,
                  color: "var(--text-secondary)",
                  flexShrink: 0,
                }}
              >
                {r.priority}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: sans }}>
                  {r.action}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, marginTop: 2 }}>
                  {r.owner_hint} · {r.effort}
                </div>
              </div>
              <Badge label={r.impact} color={IMPACT_COLORS[r.impact] || "#6B7280"} />
            </div>
          ))}
        </div>
      </Section>

      {/* Risk summary */}
      {risks.top_risks?.length > 0 && (
        <Section title={tBr.risks || (lang === "vi" ? "Rủi ro" : "Risks")} icon={Shield}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontFamily: mono }}>
            {risks.top_risks.map((r, i) => (
              <div key={i} style={{ color: "var(--text-dim)", display: "flex", gap: 6 }}>
                <span style={{ color: "#EF4444" }}>●</span> {r}
              </div>
            ))}
            {risks.mitigations_in_flight?.length > 0 && (
              <div style={{ marginTop: 4, color: "var(--text-faint)" }}>
                {tBr.mitigations || "Mitigations"}: {risks.mitigations_in_flight.join("; ")}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Decision capture */}
      {isDraft && (
        <Card>
          <div
            style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, marginBottom: 10 }}
          >
            {tBr.decideTitle || (lang === "vi" ? "Chốt quyết định" : "Record Decision")}
          </div>
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            placeholder={tBr.notePlaceholder || (lang === "vi" ? "Ghi chú (không bắt buộc)..." : "Notes (optional)...")}
            style={{
              width: "100%",
              minHeight: 60,
              padding: 8,
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontFamily: sans,
              fontSize: 12,
              resize: "vertical",
            }}
          />
          <button
            onClick={handleDecision}
            disabled={selectedScenario == null || submitting}
            style={{
              marginTop: 8,
              background: selectedScenario != null ? "#1D4ED8" : "var(--hover-bg)",
              color: selectedScenario != null ? "#fff" : "var(--text-disabled)",
              border: `1px solid ${selectedScenario != null ? "#2563EB" : "var(--border)"}`,
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: selectedScenario != null ? "pointer" : "not-allowed",
              fontFamily: sans,
            }}
          >
            {submitting
              ? "..."
              : tBr.decideButton ||
                (lang === "vi"
                  ? `Chốt kịch bản ${selectedScenario != null ? selectedScenario + 1 : ""}`
                  : `Confirm scenario ${selectedScenario != null ? selectedScenario + 1 : ""}`)}
          </button>
        </Card>
      )}

      {/* Already decided */}
      {!isDraft && brief.ceo_decision && (
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#10B981",
              fontWeight: 700,
              fontFamily: sans,
            }}
          >
            <CheckCircle2 size={14} />
            {tBr.decided || (lang === "vi" ? "Đã chốt" : "Decision recorded")}: {tBr.scenario || "Scenario"}{" "}
            {(brief.ceo_decision.scenario_index || 0) + 1}
          </div>
          {brief.ceo_decision.note && (
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: sans, marginTop: 4 }}>
              {brief.ceo_decision.note}
            </div>
          )}
          <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, marginTop: 4 }}>
            <Clock size={9} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
            {new Date(brief.decided_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
          </div>
        </Card>
      )}

      {/* Meta */}
      <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, textAlign: "center" }}>
        {brief.model_used} · ${brief.cost_estimate_usd?.toFixed(4) || "0"} ��{" "}
        {new Date(brief.generated_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, selected, onSelect, tBr }) {
  const [expanded, setExpanded] = useState(false);
  const probColor = PROB_COLORS(scenario.probability_of_success || 0);

  return (
    <div
      onClick={() => {
        if (onSelect) onSelect();
        setExpanded(!expanded);
      }}
      style={{
        background: selected ? "#1D4ED810" : "var(--bg-input)",
        border: `1px solid ${selected ? "#3B82F6" : "var(--border)"}`,
        borderRadius: 6,
        padding: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onSelect && (
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `2px solid ${selected ? "#3B82F6" : "var(--border)"}`,
                background: selected ? "#3B82F6" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
            {scenario.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: mono, color: probColor }}>
            {Math.round((scenario.probability_of_success || 0) * 100)}%
          </span>
          {expanded ? (
            <ChevronDown size={12} color="var(--text-faint)" />
          ) : (
            <ChevronRight size={12} color="var(--text-faint)" />
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: sans, marginTop: 4 }}>
        {scenario.description}
      </div>

      {expanded && (
        <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", marginBottom: 4 }}>{tBr.pros || "Pros"}</div>
            {(scenario.trade_offs?.pros || []).map((p, i) => (
              <div key={i} style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: sans }}>
                + {p}
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", marginBottom: 4 }}>{tBr.cons || "Cons"}</div>
            {(scenario.trade_offs?.cons || []).map((c, i) => (
              <div key={i} style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: sans }}>
                − {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {scenario.resource_needed && expanded && (
        <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, marginTop: 6 }}>
          {tBr.resourceNeeded || "Resource"}: {scenario.resource_needed}
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

function Card({ children }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      {children}
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
