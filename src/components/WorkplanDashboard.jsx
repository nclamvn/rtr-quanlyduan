// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Workplan Dashboard v2
// Linear-style task table + detail panel
// Replaces the old project-cards dashboard
// ═══════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import {
  LayoutDashboard, CheckCircle2, AlertTriangle, Clock, Users,
  ChevronRight, ChevronDown, X, Circle, CircleDot,
  Flame, Ban, Timer, Calendar, User, GitBranch,
  Search, Filter, ArrowUpDown, ExternalLink, Activity,
  TrendingUp, Zap, Eye, FileText,
} from "lucide-react";
import { PHASES, PHASE_COLORS, STATUS_COLORS, SEV_COLORS, mono, sans } from "../constants";
import { useAIAdvisor } from "../hooks/useAIAdvisor";
import AIAdvisoryCard from "./AIAdvisoryCard";
import { useCrossAppData } from "../hooks/useCrossAppData";
import CrossAppWidget from "./CrossAppWidget";
import AIDigestCard from "./AIDigestCard";

// ── Status logic ──────────────────────────────────────────
function getTaskStatus(issue) {
  if (issue.status === "CLOSED") return "DONE";
  if (issue.status === "BLOCKED") return "BLOCKED";
  if (issue.sev === "CRITICAL") return "CRITICAL";

  if (issue.due) {
    const now = new Date();
    const due = new Date(issue.due);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "OVERDUE";
    if (daysLeft <= 14) return "AT_RISK";
  }

  // Stale: no updates in last 7 days
  const lastUpdate = issue.updates?.[0]?.date || issue.created;
  if (lastUpdate) {
    const daysSince = Math.ceil((new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) return "STALE";
  }

  return "ON_TRACK";
}

const STATUS_CONFIG = {
  CRITICAL: { color: "#EF4444", label: "Critical", labelVi: "Nghiêm trọng", icon: Flame, order: 0 },
  OVERDUE:  { color: "#EF4444", label: "Overdue", labelVi: "Quá hạn", icon: Timer, order: 1 },
  BLOCKED:  { color: "#DC2626", label: "Blocked", labelVi: "Bị chặn", icon: Ban, order: 2 },
  AT_RISK:  { color: "#F59E0B", label: "At Risk", labelVi: "Có rủi ro", icon: AlertTriangle, order: 3 },
  ON_TRACK: { color: "#10B981", label: "On Track", labelVi: "Đúng tiến độ", icon: CheckCircle2, order: 4 },
  STALE:    { color: "#6B7280", label: "Stale", labelVi: "Không cập nhật", icon: Clock, order: 5 },
  DONE:     { color: "#3B82F6", label: "Done", labelVi: "Hoàn thành", icon: CheckCircle2, order: 6 },
};

function getDaysLeft(due) {
  if (!due) return null;
  return Math.ceil((new Date(due) - new Date()) / (1000 * 60 * 60 * 24));
}

function getLastUpdateDate(issue) {
  if (issue.updates?.length > 0) return issue.updates[0].date;
  return issue.created;
}

// ── Main Component ────────────────────────────────────────
export default function WorkplanDashboard({ issues, projects, lang, onNavigateIssue, teamMembers }) {
  const vi = lang === "vi";
  const [selectedIssue, setSelectedIssue] = useState(null);
  const { data: crossAppData, summary: crossAppSummary, loading: crossAppLoading } = useCrossAppData("MRP");
  const { advisory: aiAdvisory, isLoading: aiLoading, error: aiError, refresh: aiRefresh } = useAIAdvisor(
    selectedIssue,
    selectedIssue ? {
      projectName: projects.find(p => p.id === selectedIssue.pid)?.name || selectedIssue.pid,
      projectPhase: projects.find(p => p.id === selectedIssue.pid)?.phase || "—",
      totalOpenIssues: issues.filter(i => i.status !== "CLOSED").length,
      totalBlockedIssues: issues.filter(i => i.status === "BLOCKED").length,
      ownerWorkload: issues.filter(i => i.owner === selectedIssue.owner && i.status !== "CLOSED").length,
      // Cross-app MRP context
      mrpWorkOrders: crossAppData.filter(d => d.entity_type === "work_order" && d.project_link === selectedIssue.pid).map(d => `${d.data?.woNumber}: ${d.data?.productName} ×${d.data?.quantity} (${d.status})`).slice(0, 3),
      mrpInventoryAlerts: crossAppData.filter(d => d.entity_type === "inventory_alert" && d.priority === "urgent").map(d => `${d.data?.partName}: ${d.data?.availableQty} left (reorder: ${d.data?.reorderPoint})`).slice(0, 3),
    } : null,
    lang
  );
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortCol, setSortCol] = useState("status"); // status | owner | due | updated
  const [sortDir, setSortDir] = useState("asc");

  // ── Normalize search for Vietnamese ──
  const normalizeVN = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

  // ── Enrich issues with computed status ──
  const enrichedIssues = useMemo(() =>
    issues.map(issue => ({
      ...issue,
      _status: getTaskStatus(issue),
      _daysLeft: getDaysLeft(issue.due),
      _lastUpdate: getLastUpdateDate(issue),
      _projectName: projects.find(p => p.id === issue.pid)?.name || issue.pid,
    })),
    [issues, projects]
  );

  // ── Filter ──
  const filtered = useMemo(() => {
    let result = enrichedIssues;
    if (statusFilter !== "ALL") {
      result = result.filter(i => i._status === statusFilter);
    }
    if (searchTerm) {
      const q = normalizeVN(searchTerm);
      result = result.filter(i =>
        normalizeVN(i.title || "").includes(q) ||
        normalizeVN(i.titleVi || "").includes(q) ||
        normalizeVN(i.owner || "").includes(q) ||
        normalizeVN(i.id || "").includes(q) ||
        normalizeVN(i._projectName || "").includes(q)
      );
    }
    return result;
  }, [enrichedIssues, statusFilter, searchTerm]);

  // ── Sort ──
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortCol === "status") return dir * ((STATUS_CONFIG[a._status]?.order ?? 9) - (STATUS_CONFIG[b._status]?.order ?? 9));
      if (sortCol === "owner") return dir * (a.owner || "").localeCompare(b.owner || "");
      if (sortCol === "due") return dir * ((a.due || "9999").localeCompare(b.due || "9999"));
      if (sortCol === "updated") return dir * ((b._lastUpdate || "").localeCompare(a._lastUpdate || ""));
      return 0;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  // ── Group by project ──
  const grouped = useMemo(() => {
    const groups = {};
    for (const issue of sorted) {
      const key = issue.pid || "UNKNOWN";
      if (!groups[key]) {
        const proj = projects.find(p => p.id === key);
        groups[key] = {
          id: key,
          name: proj?.name || key,
          phase: proj?.phase || "—",
          issues: [],
        };
      }
      groups[key].issues.push(issue);
    }
    // Sort groups by project order (matching projects array order)
    return Object.values(groups).sort((a, b) => {
      const ai = projects.findIndex(p => p.id === a.id);
      const bi = projects.findIndex(p => p.id === b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [sorted, projects]);

  // ── KPI Stats ──
  const kpi = useMemo(() => {
    const all = enrichedIssues;
    return {
      total: all.length,
      active: all.filter(i => i._status !== "DONE").length,
      atRisk: all.filter(i => ["CRITICAL", "OVERDUE", "BLOCKED", "AT_RISK"].includes(i._status)).length,
      stale: all.filter(i => i._status === "STALE").length,
      done: all.filter(i => i._status === "DONE").length,
      owners: new Set(all.map(i => i.owner).filter(Boolean)).size,
    };
  }, [enrichedIssues]);

  // ── Handlers ──
  const toggleGroup = (id) => setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── KPI Card ──
  const KpiCard = ({ label, value, color, icon: Icon, active, onClick }) => (
    <div onClick={onClick} style={{
      background: active ? `${color}10` : "var(--bg-card)",
      border: `1px solid ${active ? color + "40" : "var(--border)"}`,
      borderRadius: 8, padding: "10px 14px", flex: 1, minWidth: 100,
      cursor: onClick ? "pointer" : "default", transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: sans }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: mono, lineHeight: 1 }}>{value}</div>
    </div>
  );

  // ── Column Header ──
  const ColHeader = ({ label, col, width, align }) => (
    <div onClick={() => toggleSort(col)} style={{
      width, minWidth: width, flex: col === "name" ? 1 : undefined,
      fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase",
      letterSpacing: "0.08em", cursor: "pointer", userSelect: "none", padding: "8px 6px",
      display: "flex", alignItems: "center", gap: 3, justifyContent: align === "right" ? "flex-end" : "flex-start",
      fontFamily: sans,
    }}>
      {label}
      {sortCol === col && <ArrowUpDown size={9} color="var(--text-muted)" />}
    </div>
  );

  // ── Status Dot ──
  const StatusDot = ({ status }) => {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }} title={vi ? cfg.labelVi : cfg.label}>
        <Icon size={12} color={cfg.color} />
        <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600, fontFamily: sans }}>{vi ? cfg.labelVi : cfg.label}</span>
      </div>
    );
  };

  // ── Issue Row ──
  const IssueRow = ({ issue }) => {
    const isSelected = selectedIssue?.id === issue.id;
    const cfg = STATUS_CONFIG[issue._status] || STATUS_CONFIG.ON_TRACK;
    return (
      <div
        onClick={() => setSelectedIssue(isSelected ? null : issue)}
        style={{
          display: "flex", alignItems: "center", gap: 0, padding: "0 6px",
          borderLeft: `3px solid ${cfg.color}`,
          background: isSelected ? "var(--hover-bg)" : "transparent",
          cursor: "pointer", transition: "background 0.1s",
          borderBottom: "1px solid var(--border-a10)",
          minHeight: 42,
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--hover-bg-subtle)"; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Task name */}
        <div style={{ flex: 1, padding: "8px 6px", minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: sans }}>
            {vi && issue.titleVi ? issue.titleVi : issue.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono }}>{issue.id}</div>
        </div>

        {/* Owner */}
        <div style={{ width: 100, minWidth: 100, padding: "8px 6px" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: sans }}>{issue.owner || "—"}</span>
        </div>

        {/* Phase */}
        <div style={{ width: 60, minWidth: 60, padding: "8px 6px" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: PHASE_COLORS[issue.phase] || "var(--text-dim)",
            background: (PHASE_COLORS[issue.phase] || "#666") + "15",
            padding: "1px 6px", borderRadius: 3, fontFamily: mono,
          }}>
            {issue.phase}
          </span>
        </div>

        {/* Due date */}
        <div style={{ width: 80, minWidth: 80, padding: "8px 6px", textAlign: "right" }}>
          {issue.due ? (
            <span style={{ fontSize: 12, fontFamily: mono, color: issue._daysLeft < 0 ? "#EF4444" : issue._daysLeft <= 14 ? "#F59E0B" : "var(--text-muted)" }}>
              {issue.due.slice(5)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>—</span>
          )}
        </div>

        {/* Days left */}
        <div style={{ width: 55, minWidth: 55, padding: "8px 6px", textAlign: "right" }}>
          {issue._daysLeft !== null ? (
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: mono,
              color: issue._daysLeft < 0 ? "#EF4444" : issue._daysLeft <= 7 ? "#F59E0B" : "var(--text-muted)",
            }}>
              {issue._daysLeft < 0 ? `${Math.abs(issue._daysLeft)}d` : `${issue._daysLeft}d`}
              {issue._daysLeft < 0 && <span style={{ fontSize: 9, color: "#EF4444" }}> late</span>}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>—</span>
          )}
        </div>

        {/* Status */}
        <div style={{ width: 110, minWidth: 110, padding: "8px 6px" }}>
          <StatusDot status={issue._status} />
        </div>

        {/* Last update */}
        <div style={{ width: 70, minWidth: 70, padding: "8px 6px", textAlign: "right" }}>
          <span style={{ fontSize: 11, fontFamily: mono, color: "var(--text-faint)" }}>
            {issue._lastUpdate?.slice(5) || "—"}
          </span>
        </div>
      </div>
    );
  };

  // ── Group Header ──
  const GroupHeader = ({ group }) => {
    const isCollapsed = collapsedGroups[group.id];
    const atRisk = group.issues.filter(i => ["CRITICAL", "OVERDUE", "BLOCKED"].includes(i._status)).length;
    const done = group.issues.filter(i => i._status === "DONE").length;
    return (
      <div
        onClick={() => toggleGroup(group.id)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          background: "var(--bg-input)", cursor: "pointer", userSelect: "none",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 2,
        }}
      >
        {isCollapsed ? <ChevronRight size={13} color="var(--text-dim)" /> : <ChevronDown size={13} color="var(--text-dim)" />}
        <span style={{ fontSize: 12, fontWeight: 700, color: PHASE_COLORS[group.phase] || "var(--text-primary)", fontFamily: sans }}>
          {group.name}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: PHASE_COLORS[group.phase] || "var(--text-dim)",
          background: (PHASE_COLORS[group.phase] || "#666") + "15",
          padding: "1px 6px", borderRadius: 3, fontFamily: mono,
        }}>
          {group.phase}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: sans }}>
          {group.issues.length} {vi ? "mục" : "items"}
        </span>
        {atRisk > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#EF444415", padding: "1px 6px", borderRadius: 3, fontFamily: mono, display: "flex", alignItems: "center", gap: 3 }}>
            <Flame size={9} /> {atRisk}
          </span>
        )}
        {done > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", background: "#10B98115", padding: "1px 6px", borderRadius: 3, fontFamily: mono, display: "flex", alignItems: "center", gap: 3 }}>
            <CheckCircle2 size={9} /> {done}
          </span>
        )}
      </div>
    );
  };

  // ── Detail Panel ──
  const DetailPanel = ({ issue }) => {
    if (!issue) return null;
    const cfg = STATUS_CONFIG[issue._status] || STATUS_CONFIG.ON_TRACK;
    return (
      <div style={{
        width: 360, minWidth: 360, borderLeft: "1px solid var(--border)",
        background: "var(--bg-card)", overflowY: "auto", height: "100%",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: mono, color: "var(--text-faint)", marginBottom: 4 }}>{issue.id}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, lineHeight: 1.3 }}>
              {vi && issue.titleVi ? issue.titleVi : issue.title}
            </div>
          </div>
          <button onClick={() => setSelectedIssue(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}>
            <X size={14} />
          </button>
        </div>

        {/* Meta */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid var(--border)" }}>
          <MetaRow icon={cfg.icon} iconColor={cfg.color} label={vi ? "Trạng thái" : "Status"} value={<StatusDot status={issue._status} />} />
          <MetaRow icon={User} label={vi ? "Phụ trách" : "Owner"} value={issue.owner || "—"} />
          <MetaRow icon={GitBranch} label="Phase" value={<span style={{ color: PHASE_COLORS[issue.phase], fontWeight: 700, fontFamily: mono }}>{issue.phase}</span>} />
          <MetaRow icon={Calendar} label={vi ? "Hạn" : "Due"} value={issue.due || "—"} valueColor={issue._daysLeft < 0 ? "#EF4444" : undefined} />
          {issue._daysLeft !== null && (
            <MetaRow icon={Timer} label={vi ? "Còn lại" : "Days left"} value={`${issue._daysLeft}d`} valueColor={issue._daysLeft < 0 ? "#EF4444" : issue._daysLeft <= 7 ? "#F59E0B" : undefined} />
          )}
          <MetaRow icon={AlertTriangle} label={vi ? "Mức độ" : "Severity"} value={<span style={{ color: SEV_COLORS[issue.sev], fontWeight: 700 }}>{issue.sev}</span>} />
          <MetaRow icon={LayoutDashboard} label={vi ? "Dự án" : "Project"} value={issue._projectName} />
        </div>

        {/* AI Advisory */}
        <AIAdvisoryCard advisory={aiAdvisory} isLoading={aiLoading} error={aiError} onRefresh={aiRefresh} lang={lang} />

        {/* Root Cause */}
        {issue.rootCause && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: sans }}>{vi ? "Nguyên nhân gốc" : "Root Cause"}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: sans }}>{issue.rootCause}</div>
          </div>
        )}

        {/* Description */}
        {issue.desc && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: sans }}>{vi ? "Mô tả" : "Description"}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: sans, whiteSpace: "pre-wrap" }}>{issue.desc}</div>
          </div>
        )}

        {/* Cascade Impacts */}
        {issue.impacts?.length > 0 && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: sans, display: "flex", alignItems: "center", gap: 4 }}>
              <Zap size={10} /> {vi ? "Ảnh hưởng Cascade" : "Cascade Impact"}
            </div>
            {issue.impacts.map((imp, i) => (
              <div key={i} style={{ fontSize: 12, color: "#FDE68A", fontFamily: mono, marginBottom: 2 }}>
                {imp.phase} +{Math.ceil(imp.days / 7)}w
              </div>
            ))}
          </div>
        )}

        {/* Activity Log */}
        <div style={{ padding: "12px 16px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: sans, display: "flex", alignItems: "center", gap: 4 }}>
            <Activity size={10} /> {vi ? "Lịch sử cập nhật" : "Update History"} ({issue.updates?.length || 0})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(issue.updates || []).slice(0, 10).map((upd, i) => (
              <div key={i} style={{ borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontFamily: mono, color: "var(--text-faint)" }}>{upd.date}</span>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 600 }}>{upd.author}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, fontFamily: sans }}>{upd.text}</div>
              </div>
            ))}
            {(!issue.updates || issue.updates.length === 0) && (
              <div style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic" }}>{vi ? "Chưa có cập nhật" : "No updates yet"}</div>
            )}
          </div>
        </div>

        {/* View full detail */}
        {onNavigateIssue && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <button onClick={() => onNavigateIssue(issue)} style={{
              width: "100%", background: "#1D4ED8", border: "none", borderRadius: 6,
              padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: sans, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
            }}>
              <ExternalLink size={13} /> {vi ? "Xem chi tiết đầy đủ" : "View Full Details"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Meta Row (for detail panel) ──
  const MetaRow = ({ icon: Icon, iconColor, label, value, valueColor }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={12} color={iconColor || "var(--text-faint)"} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "var(--text-faint)", width: 70, flexShrink: 0, fontFamily: sans }}>{label}</span>
      <span style={{ fontSize: 13, color: valueColor || "var(--text-primary)", fontFamily: sans, flex: 1 }}>{typeof value === "string" ? value : value}</span>
    </div>
  );

  // ── Empty State ──
  if (issues.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "60px 40px", textAlign: "center" }}>
        <LayoutDashboard size={36} color="var(--text-disabled)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: sans }}>
          {vi ? "Chào mừng đến RtR Control Tower" : "Welcome to RtR Control Tower"}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", fontFamily: sans }}>
          {vi ? "Chưa có dữ liệu. Tải file Excel master lên để AI tự động phân bổ dữ liệu vào hệ thống." : "No data yet. Upload an Excel master file to let AI auto-distribute data."}
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* AI Daily Digest */}
      <AIDigestCard lang={lang} />

      {/* KPI Bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <KpiCard label={vi ? "Đang hoạt động" : "Active"} value={kpi.active} color="#3B82F6" icon={Activity}
          active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
        <KpiCard label={vi ? "Có rủi ro" : "At Risk"} value={kpi.atRisk} color="#EF4444" icon={AlertTriangle}
          active={statusFilter === "AT_RISK"} onClick={() => setStatusFilter(statusFilter === "AT_RISK" ? "ALL" : "AT_RISK")} />
        <KpiCard label={vi ? "Không cập nhật" : "Stale"} value={kpi.stale} color="#6B7280" icon={Clock}
          active={statusFilter === "STALE"} onClick={() => setStatusFilter(statusFilter === "STALE" ? "ALL" : "STALE")} />
        <KpiCard label={vi ? "Hoàn thành" : "Done"} value={kpi.done} color="#10B981" icon={CheckCircle2}
          active={statusFilter === "DONE"} onClick={() => setStatusFilter(statusFilter === "DONE" ? "ALL" : "DONE")} />
        <KpiCard label={vi ? "Thành viên" : "Team"} value={kpi.owners} color="#8B5CF6" icon={Users} />
      </div>

      {/* Cross-App MRP Widget */}
      <CrossAppWidget data={crossAppData} summary={crossAppSummary} loading={crossAppLoading} lang={lang} />

      {/* Search + Filter Bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} color="var(--text-faint)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={vi ? "Tìm task, người phụ trách, dự án..." : "Search tasks, owners, projects..."}
            style={{
              width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "7px 10px 7px 32px", color: "var(--text-primary)",
              fontSize: 13, outline: "none", fontFamily: sans,
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "7px 10px", color: "var(--text-muted)",
            fontSize: 12, outline: "none", fontFamily: sans, cursor: "pointer",
          }}
        >
          <option value="ALL">{vi ? "Tất cả trạng thái" : "All Status"}</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{vi ? cfg.labelVi : cfg.label}</option>
          ))}
        </select>
        <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono, whiteSpace: "nowrap" }}>
          {filtered.length}/{enrichedIssues.length}
        </div>
      </div>

      {/* Main Content: Table + Detail Panel */}
      <div style={{ display: "flex", gap: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", height: "calc(100vh - 280px)", minHeight: 400 }}>
        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", minWidth: 0 }}>
          {/* Column Headers */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", position: "sticky", top: 0, zIndex: 3, padding: "0 6px" }}>
            <div style={{ width: 3 }} />
            <ColHeader label={vi ? "Task" : "Task"} col="name" />
            <ColHeader label={vi ? "Phụ trách" : "Owner"} col="owner" width={100} />
            <ColHeader label="Phase" col="phase" width={60} />
            <ColHeader label={vi ? "Hạn" : "Due"} col="due" width={80} align="right" />
            <ColHeader label={vi ? "Còn" : "Left"} col="due" width={55} align="right" />
            <ColHeader label={vi ? "Trạng thái" : "Status"} col="status" width={110} />
            <ColHeader label={vi ? "Cập nhật" : "Updated"} col="updated" width={70} align="right" />
          </div>

          {/* Grouped Rows */}
          {grouped.map(group => (
            <div key={group.id}>
              <GroupHeader group={group} />
              {!collapsedGroups[group.id] && group.issues.map(issue => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          ))}

          {/* No results */}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-faint)", fontSize: 14, fontFamily: sans }}>
              {vi ? "Không tìm thấy task nào khớp bộ lọc" : "No tasks match current filters"}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedIssue && <DetailPanel issue={selectedIssue} />}
      </div>
    </div>
  );
}
