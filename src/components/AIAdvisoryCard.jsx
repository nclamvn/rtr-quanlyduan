// ═══════════════════════════════════════════════════════════
// RtR Control Tower — AI Advisory Card
// Shows AI-generated task analysis in the detail panel
// ═══════════════════════════════════════════════════════════
import { Brain, RefreshCw, AlertTriangle, CheckCircle2, Flame, Shield, Lightbulb, Link2, Clock } from "lucide-react";
import { mono, sans } from "../constants";

const RISK_CONFIG = {
  critical: { color: "#EF4444", icon: Flame, labelVi: "Nghiêm trọng", labelEn: "Critical" },
  high: { color: "#F59E0B", icon: AlertTriangle, labelVi: "Cao", labelEn: "High" },
  medium: { color: "#3B82F6", icon: Shield, labelVi: "Trung bình", labelEn: "Medium" },
  low: { color: "#10B981", icon: CheckCircle2, labelVi: "Thấp", labelEn: "Low" },
};

export default function AIAdvisoryCard({ advisory, isLoading, error, onRefresh, lang }) {
  const vi = lang === "vi";

  // ── Loading state ──
  if (isLoading) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Brain size={13} color="#8B5CF6" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#8B5CF6",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: sans,
            }}
          >
            {vi ? "AI đang phân tích..." : "AI Analyzing..."}
          </span>
          <RefreshCw size={11} color="#8B5CF6" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="skeleton" style={{ height: 14, width: "90%", borderRadius: 3 }} />
          <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 3 }} />
          <div className="skeleton" style={{ height: 30, width: "100%", borderRadius: 4, marginTop: 4 }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Brain size={13} color="var(--text-faint)" />
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: sans }}>
              {vi ? "AI không khả dụng" : "AI unavailable"}
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "3px 8px",
                color: "var(--text-dim)",
                fontSize: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: sans,
              }}
            >
              <RefreshCw size={9} /> {vi ? "Thử lại" : "Retry"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── No advisory ──
  if (!advisory) return null;

  const risk = RISK_CONFIG[advisory.riskLevel] || RISK_CONFIG.medium;
  const RiskIcon = risk.icon;
  const timeAgo = advisory.generatedAt ? formatTimeAgo(advisory.generatedAt, vi) : "";

  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "#8B5CF608" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Brain size={13} color="#8B5CF6" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#8B5CF6",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: sans,
            }}
          >
            AI Advisory
          </span>
          {advisory.cached && <span style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: mono }}>cached</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {timeAgo && <span style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: mono }}>{timeAgo}</span>}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title={vi ? "Phân tích lại" : "Re-analyze"}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 2 }}
            >
              <RefreshCw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {advisory.summary && (
        <div
          style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10, fontFamily: sans }}
        >
          {advisory.summary}
        </div>
      )}

      {/* Risk Assessment */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          background: risk.color + "10",
          border: `1px solid ${risk.color}25`,
          borderRadius: 5,
          marginBottom: 10,
        }}
      >
        <RiskIcon size={13} color={risk.color} />
        <span
          style={{ fontSize: 11, fontWeight: 700, color: risk.color, fontFamily: mono, textTransform: "uppercase" }}
        >
          {vi ? risk.labelVi : risk.labelEn}
        </span>
        {advisory.riskExplanation && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: sans, flex: 1 }}>
            — {advisory.riskExplanation}
          </span>
        )}
      </div>

      {/* Recommendations */}
      {advisory.recommendations?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Lightbulb size={10} /> {vi ? "Đề xuất" : "Recommendations"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {advisory.recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 6,
                  fontSize: 11,
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                  fontFamily: sans,
                }}
              >
                <span style={{ color: "#8B5CF6", fontWeight: 700, fontFamily: mono, flexShrink: 0 }}>{i + 1}.</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Context */}
      {advisory.relatedContext && (
        <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <Link2 size={10} color="var(--text-faint)" style={{ marginTop: 2, flexShrink: 0 }} />
          <span
            style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, fontFamily: sans, fontStyle: "italic" }}
          >
            {advisory.relatedContext}
          </span>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr, vi) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  if (vi) {
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours}h trước`;
    return `${Math.floor(hours / 24)}d trước`;
  }
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
