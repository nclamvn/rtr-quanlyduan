// ═══════════════════════════════════════════════════════════
// RtR Control Tower — AI Daily Digest Card
// Shows AI-generated morning briefing on dashboard
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import {
  Brain, ChevronDown, ChevronRight, RefreshCw,
  AlertTriangle, TrendingUp, Users, Target,
  Flame, Clock, Lightbulb, Zap,
} from "lucide-react";
import { supabase, isSupabaseConnected } from "../lib/supabase";
import { mono, sans } from "../constants";

const URGENCY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#3B82F6",
};

export default function AIDigestCard({ lang }) {
  const vi = lang === "vi";
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch today's digest from DB
  const fetchDigest = useCallback(async () => {
    if (!isSupabaseConnected()) { setLoading(false); return; }
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("ai_digests")
        .select("content, created_at")
        .eq("digest_date", today)
        .maybeSingle();

      if (data) {
        setDigest({ ...data.content, generatedAt: data.created_at, cached: true });
      }
    } catch (err) {
      console.warn("[AIDigest] Fetch error:", err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDigest(); }, [fetchDigest]);

  // Generate new digest on demand
  const generateDigest = useCallback(async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-daily-digest", { body: {} });
      if (!error && data) {
        setDigest(data);
      }
    } catch (err) {
      console.warn("[AIDigest] Generate error:", err.message);
    }
    setGenerating(false);
  }, []);

  // Loading
  if (loading) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
        <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 3, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 40, width: "100%", borderRadius: 4 }} />
      </div>
    );
  }

  // No digest yet — show generate button
  if (!digest) {
    return (
      <div style={{ background: "linear-gradient(135deg, #8B5CF610, #3B82F610)", border: "1px solid #8B5CF630", borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={18} color="#8B5CF6" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
              {vi ? "AI Báo Cáo Hàng Ngày" : "AI Daily Briefing"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: sans }}>
              {vi ? "Tạo báo cáo AI tổng hợp tình hình hôm nay" : "Generate AI summary of today's status"}
            </div>
          </div>
        </div>
        <button onClick={generateDigest} disabled={generating} style={{
          background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", border: "none", borderRadius: 6,
          padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: generating ? "wait" : "pointer",
          display: "flex", alignItems: "center", gap: 6, fontFamily: sans, opacity: generating ? 0.7 : 1,
        }}>
          {generating ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={13} />}
          {generating ? (vi ? "Đang tạo..." : "Generating...") : (vi ? "Tạo Báo Cáo" : "Generate")}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const timeAgo = digest.generatedAt ? formatTimeAgo(digest.generatedAt, vi) : "";

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid #8B5CF630", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div onClick={() => setExpanded(!expanded)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", cursor: "pointer",
        background: "linear-gradient(135deg, #8B5CF608, #3B82F608)",
        borderBottom: expanded ? "1px solid var(--border)" : "none",
      }}>
        {expanded ? <ChevronDown size={13} color="#8B5CF6" /> : <ChevronRight size={13} color="#8B5CF6" />}
        <Brain size={14} color="#8B5CF6" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, flex: 1 }}>
          {vi ? "AI Báo Cáo Hàng Ngày" : "AI Daily Briefing"}
        </span>
        {timeAgo && <span style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: mono }}>{timeAgo}</span>}
        <button onClick={(e) => { e.stopPropagation(); generateDigest(); }} disabled={generating} title={vi ? "Tạo lại" : "Regenerate"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 2 }}>
          <RefreshCw size={11} style={generating ? { animation: "spin 1s linear infinite" } : {}} />
        </button>
      </div>

      {expanded && (
        <div style={{ padding: 16 }}>
          {/* Executive Summary */}
          {digest.executiveSummary && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14, fontFamily: sans, padding: "10px 14px", background: "var(--bg-input)", borderRadius: 6, borderLeft: "3px solid #8B5CF6" }}>
              {digest.executiveSummary}
            </div>
          )}

          {/* Critical Items */}
          {digest.criticalItems?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionHeader icon={Flame} label={vi ? "Cần chú ý" : "Critical Items"} color="#EF4444" />
              {digest.criticalItems.map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, padding: "8px 10px", marginBottom: 4,
                  borderLeft: `3px solid ${URGENCY_COLORS[item.urgency] || "#F59E0B"}`,
                  background: "var(--bg-input)", borderRadius: "0 4px 4px 0",
                }}>
                  <AlertTriangle size={12} color={URGENCY_COLORS[item.urgency] || "#F59E0B"} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: sans, lineHeight: 1.4 }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's Priorities */}
          {digest.todayPriorities?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionHeader icon={Target} label={vi ? "Ưu tiên hôm nay" : "Today's Priorities"} color="#3B82F6" />
              {digest.todayPriorities.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0", fontSize: 12, color: "var(--text-muted)", fontFamily: sans }}>
                  <span style={{ color: "#3B82F6", fontWeight: 700, fontFamily: mono, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* Patterns */}
          {digest.patterns?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionHeader icon={TrendingUp} label={vi ? "Xu hướng phát hiện" : "Patterns Detected"} color="#F59E0B" />
              {digest.patterns.map((p, i) => (
                <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border-a10)" }}>
                  <div style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: sans, fontWeight: 600 }}>{p.observation}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: sans }}>
                    {p.suggestion && <><Lightbulb size={9} style={{ display: "inline", verticalAlign: "middle" }} /> {p.suggestion}</>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team Insights */}
          {digest.teamInsights?.length > 0 && (
            <div>
              <SectionHeader icon={Users} label={vi ? "Nhận xét đội ngũ" : "Team Insights"} color="#8B5CF6" />
              {digest.teamInsights.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-a10)" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#8B5CF615", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#8B5CF6", flexShrink: 0, fontFamily: mono }}>
                    {t.person?.[0] || "?"}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: sans }}>{t.person}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: sans }}>{t.observation}</div>
                    {t.recommendation && <div style={{ fontSize: 11, color: "#8B5CF6", fontFamily: sans }}>{t.recommendation}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
      <Icon size={12} color={color} />
      <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: sans }}>{label}</span>
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
