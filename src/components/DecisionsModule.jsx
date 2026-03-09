import { useState, useMemo } from "react";
import {
  Scale, Check, X, ChevronRight, ExternalLink,
  Clock, User, Layers, AlertTriangle, GitBranch,
  ArrowRight, CircleDot
} from "lucide-react";
import {
  DECISION_STATUS_COLORS,
} from "../data/v2Data";
import { useDecisionData } from "../hooks/useV2Data";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const PHASE_COLORS = { CONCEPT: "#6B7280", EVT: "#F59E0B", DVT: "#3B82F6", PVT: "#8B5CF6", MP: "#10B981" };

function Badge({ label, color, size = "sm", icon: IconComp }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "1px 7px" : "3px 10px", borderRadius: 3, background: color + "15", color, fontSize: size === "sm" ? 9 : 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${color}25`, fontFamily: mono, whiteSpace: "nowrap" }}>
      {IconComp ? <IconComp size={size === "sm" ? 10 : 12} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

export default function DecisionsModule({ lang, t, project, issues, onViewIssue, perm }) {
  const readOnly = perm?.isReadOnly ? perm.isReadOnly() : false;
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Fetch from Supabase (or static fallback)
  const { data: allDecisions, loading: decLoading } = useDecisionData(project?.id);

  const decisions = useMemo(() =>
    allDecisions
      .filter(d => filterStatus === "ALL" || d.status === filterStatus)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [allDecisions, filterStatus]
  );

  if (decLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text-dim)", fontSize: 14 }}>
        <Scale size={16} style={{ marginRight: 8, opacity: 0.5 }} />
        {lang === "vi" ? "Đang tải quyết định..." : "Loading decisions..."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Scale size={16} color="#8B5CF6" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
            {lang === "vi" ? "Nhật Ký Quyết Định" : "Decision Records"}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>— {decisions.length} {lang === "vi" ? "quyết định" : "decisions"}</span>
          {readOnly && <span style={{ fontSize: 11, color: "var(--text-faint)", background: "var(--hover-bg)", padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>{lang === "vi" ? "Chỉ xem" : "Read-only"}</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", color: "var(--text-muted)", fontSize: 12, outline: "none" }}>
            <option value="ALL">{lang === "vi" ? "Tất cả trạng thái" : "All Statuses"}</option>
            {["PROPOSED", "APPROVED", "SUPERSEDED", "REJECTED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Decision cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {decisions.map(dec => {
          const isExpanded = expandedId === dec.id;
          const statusColor = DECISION_STATUS_COLORS[dec.status] || "var(--text-dim)";
          const phaseColor = PHASE_COLORS[dec.phase] || "var(--text-dim)";

          return (
            <div key={dec.id} style={{ background: "var(--bg-card)", border: `1px solid ${isExpanded ? "#3B82F640" : "var(--border)"}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}>
              {/* Card header */}
              <div onClick={() => setExpandedId(isExpanded ? null : dec.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", cursor: "pointer", borderBottom: isExpanded ? "1px solid var(--border)" : "none" }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "var(--border-a10)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <ChevronRight size={12} color="var(--text-dim)" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)", flexShrink: 0 }}>{dec.id}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
                  {lang === "vi" && dec.titleVi ? dec.titleVi : dec.title}
                </span>
                <Badge label={dec.phase} color={phaseColor} />
                <Badge label={dec.status} color={statusColor} />
                <span style={{ fontSize: 12, fontFamily: mono, color: "var(--text-dim)", flexShrink: 0 }}>{dec.date}</span>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: 16 }}>
                  {/* Meta info */}
                  <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={10} color="var(--text-faint)" />
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lang === "vi" ? "Người quyết định" : "Decision Maker"}:</span>
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{dec.decisionMaker}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} color="var(--text-faint)" />
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lang === "vi" ? "Ngày" : "Date"}:</span>
                      <span style={{ fontSize: 13, fontFamily: mono, color: "var(--text-muted)" }}>{dec.date}</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 6 }}>
                      {lang === "vi" ? "Phương án xem xét" : "Options Considered"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {dec.options.map((opt, i) => {
                        const isChosen = opt.label.startsWith(dec.chosenOption + ":");
                        return (
                          <div key={i} style={{
                            background: isChosen ? "#10B98108" : "var(--bg-input)",
                            border: `1px solid ${isChosen ? "#10B98130" : "var(--border)"}`,
                            borderRadius: 6, padding: "8px 12px",
                            borderLeft: `3px solid ${isChosen ? "#10B981" : "var(--text-disabled)"}`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              {isChosen ? <CircleDot size={12} color="#10B981" /> : <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--text-faint)" }} />}
                              <span style={{ fontSize: 13, fontWeight: 700, color: isChosen ? "#10B981" : "var(--text-secondary)" }}>{opt.label}</span>
                              {isChosen && <span style={{ fontSize: 10, background: "#10B98120", color: "#10B981", padding: "1px 5px", borderRadius: 2, fontWeight: 700, letterSpacing: "0.06em" }}>{lang === "vi" ? "CHỌN" : "CHOSEN"}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 12, paddingLeft: 18 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                                <Check size={9} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "vi" && opt.prosVi ? opt.prosVi : opt.pros}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                                <X size={9} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "vi" && opt.consVi ? opt.consVi : opt.cons}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rationale */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>
                      {lang === "vi" ? "Lý do" : "Rationale"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, padding: "8px 12px", background: "var(--bg-input)", borderRadius: 4, borderLeft: "3px solid #8B5CF6" }}>
                      {lang === "vi" && dec.rationaleVi ? dec.rationaleVi : dec.rationale}
                    </div>
                  </div>

                  {/* Impact */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, background: "var(--bg-input)", borderRadius: 4, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{lang === "vi" ? "Ảnh hưởng" : "Impact"}</div>
                      <div style={{ fontSize: 13, color: "#FDE68A" }}>
                        {lang === "vi" && dec.impactDescriptionVi ? dec.impactDescriptionVi : dec.impactDescription}
                      </div>
                    </div>
                    <div style={{ background: "var(--bg-input)", borderRadius: 4, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{lang === "vi" ? "Chi phí" : "Cost"}</div>
                      <div style={{ fontSize: 13, fontFamily: mono, color: "#F59E0B" }}>{dec.costImpact}</div>
                    </div>
                  </div>

                  {/* Links */}
                  {(dec.linkedIssueIds.length > 0 || dec.linkedFlightTestIds.length > 0 || dec.linkedGateConditions.length > 0) && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 6 }}>
                        {lang === "vi" ? "Liên kết" : "Linked Entities"}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {dec.linkedIssueIds.map(id => (
                          <button key={id} onClick={() => onViewIssue && onViewIssue(id)}
                            style={{ background: "#EF444410", border: "1px solid #EF444420", borderRadius: 4, padding: "3px 8px", color: "#FCA5A5", fontSize: 12, fontFamily: mono, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertTriangle size={9} /> {id}
                          </button>
                        ))}
                        {dec.linkedFlightTestIds.map(id => (
                          <span key={id} style={{ background: "#3B82F610", border: "1px solid #3B82F620", borderRadius: 4, padding: "3px 8px", color: "#60A5FA", fontSize: 12, fontFamily: mono, display: "flex", alignItems: "center", gap: 4 }}>
                            <GitBranch size={9} /> {id}
                          </span>
                        ))}
                        {dec.linkedGateConditions.map(id => (
                          <span key={id} style={{ background: "#8B5CF610", border: "1px solid #8B5CF620", borderRadius: 4, padding: "3px 8px", color: "#A78BFA", fontSize: 12, fontFamily: mono, display: "flex", alignItems: "center", gap: 4 }}>
                            <Layers size={9} /> Gate: {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {decisions.length === 0 && allDecisions.length === 0 && (
        <EmptyState icon={EMPTY_MESSAGES[lang].decisions.icon} title={EMPTY_MESSAGES[lang].decisions.title} description={EMPTY_MESSAGES[lang].decisions.desc} />
      )}
      {decisions.length === 0 && allDecisions.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 40, textAlign: "center" }}>
          <Scale size={24} color="var(--text-disabled)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: "var(--text-faint)" }}>{lang === "vi" ? "Không có quyết định khớp bộ lọc" : "No decisions match filter"}</div>
        </div>
      )}
    </div>
  );
}
