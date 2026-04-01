// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Workplan Dashboard v2
// Linear-style task table + detail panel
// Replaces the old project-cards dashboard
// ═══════════════════════════════════════════════════════════
import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  X,
  Circle,
  CircleDot,
  Flame,
  Ban,
  Timer,
  Calendar,
  User,
  GitBranch,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Activity,
  TrendingUp,
  Zap,
  Eye,
  FileText,
  BarChart3,
  Play,
  Pause,
  SkipForward,
  Table2,
  GanttChart,
  Mic,
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
  OVERDUE: { color: "#EF4444", label: "Overdue", labelVi: "Quá hạn", icon: Timer, order: 1 },
  BLOCKED: { color: "#DC2626", label: "Blocked", labelVi: "Bị chặn", icon: Ban, order: 2 },
  AT_RISK: { color: "#F59E0B", label: "At Risk", labelVi: "Có rủi ro", icon: AlertTriangle, order: 3 },
  ON_TRACK: { color: "#10B981", label: "On Track", labelVi: "Đúng tiến độ", icon: CheckCircle2, order: 4 },
  STALE: { color: "#6B7280", label: "Stale", labelVi: "Không cập nhật", icon: Clock, order: 5 },
  DONE: { color: "#3B82F6", label: "Done", labelVi: "Hoàn thành", icon: CheckCircle2, order: 6 },
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
export default function WorkplanDashboard({
  issues,
  projects,
  lang,
  onNavigateIssue,
  teamMembers,
  onUpdateStatus,
  onRefreshIssues: _onRefreshIssues,
  perm: _perm,
  online: _online,
}) {
  const vi = lang === "vi";
  const [selectedIssue, setSelectedIssue] = useState(null);
  const { data: crossAppData, summary: crossAppSummary, loading: crossAppLoading } = useCrossAppData("MRP");
  const {
    advisory: aiAdvisory,
    isLoading: aiLoading,
    error: aiError,
    refresh: aiRefresh,
  } = useAIAdvisor(
    selectedIssue,
    selectedIssue
      ? {
          projectName: projects.find((p) => p.id === selectedIssue.pid)?.name || selectedIssue.pid,
          projectPhase: projects.find((p) => p.id === selectedIssue.pid)?.phase || "—",
          totalOpenIssues: issues.filter((i) => i.status !== "CLOSED").length,
          totalBlockedIssues: issues.filter((i) => i.status === "BLOCKED").length,
          ownerWorkload: issues.filter((i) => i.owner === selectedIssue.owner && i.status !== "CLOSED").length,
          // Cross-app MRP context
          mrpWorkOrders: crossAppData
            .filter((d) => d.entity_type === "work_order" && d.project_link === selectedIssue.pid)
            .map((d) => `${d.data?.woNumber}: ${d.data?.productName} ×${d.data?.quantity} (${d.status})`)
            .slice(0, 3),
          mrpInventoryAlerts: crossAppData
            .filter((d) => d.entity_type === "inventory_alert" && d.priority === "urgent")
            .map((d) => `${d.data?.partName}: ${d.data?.availableQty} left (reorder: ${d.data?.reorderPoint})`)
            .slice(0, 3),
        }
      : null,
    lang,
  );
  const [viewMode, setViewMode] = useState("table"); // table | timeline | standup
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortCol, setSortCol] = useState("status");
  const [sortDir, setSortDir] = useState("asc");

  // ── Normalize search for Vietnamese ──
  const normalizeVN = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();

  // ── Enrich issues with computed status ──
  const enrichedIssues = useMemo(
    () =>
      issues.map((issue) => ({
        ...issue,
        _status: getTaskStatus(issue),
        _daysLeft: getDaysLeft(issue.due),
        _lastUpdate: getLastUpdateDate(issue),
        _projectName: projects.find((p) => p.id === issue.pid)?.name || issue.pid,
      })),
    [issues, projects],
  );

  // ── Filter ──
  const filtered = useMemo(() => {
    let result = enrichedIssues;
    if (statusFilter !== "ALL") {
      result = result.filter((i) => i._status === statusFilter);
    }
    if (searchTerm) {
      const q = normalizeVN(searchTerm);
      result = result.filter(
        (i) =>
          normalizeVN(i.title || "").includes(q) ||
          normalizeVN(i.titleVi || "").includes(q) ||
          normalizeVN(i.owner || "").includes(q) ||
          normalizeVN(i.id || "").includes(q) ||
          normalizeVN(i._projectName || "").includes(q),
      );
    }
    return result;
  }, [enrichedIssues, statusFilter, searchTerm]);

  // ── Sort ──
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortCol === "status")
        return dir * ((STATUS_CONFIG[a._status]?.order ?? 9) - (STATUS_CONFIG[b._status]?.order ?? 9));
      if (sortCol === "owner") return dir * (a.owner || "").localeCompare(b.owner || "");
      if (sortCol === "due") return dir * (a.due || "9999").localeCompare(b.due || "9999");
      if (sortCol === "updated") return dir * (b._lastUpdate || "").localeCompare(a._lastUpdate || "");
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
        const proj = projects.find((p) => p.id === key);
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
      const ai = projects.findIndex((p) => p.id === a.id);
      const bi = projects.findIndex((p) => p.id === b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [sorted, projects]);

  // ── KPI Stats ──
  const kpi = useMemo(() => {
    const all = enrichedIssues;
    return {
      total: all.length,
      active: all.filter((i) => i._status !== "DONE").length,
      atRisk: all.filter((i) => ["CRITICAL", "OVERDUE", "BLOCKED", "AT_RISK"].includes(i._status)).length,
      stale: all.filter((i) => i._status === "STALE").length,
      done: all.filter((i) => i._status === "DONE").length,
      owners: new Set(all.map((i) => i.owner).filter(Boolean)).size,
    };
  }, [enrichedIssues]);

  // ── Weekly trend (from ai_snapshots) ──
  const [prevSnapshot, setPrevSnapshot] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("../lib/supabase");
        if (!supabase) return;
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const { data } = await supabase
          .from("ai_snapshots")
          .select("data")
          .eq("snapshot_type", "daily_counts")
          .lte("snapshot_date", yesterday)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.data) setPrevSnapshot(data.data);
      } catch {
        /* ignore — snapshots are optional */
      }
    })();
  }, []);

  const trend = useMemo(() => {
    if (!prevSnapshot) return {};
    return {
      active:
        kpi.active -
        (kpi.total - (prevSnapshot.closed || 0) - (prevSnapshot.totalOpen || prevSnapshot.totalOpen || kpi.active)),
      atRisk:
        prevSnapshot.critical !== undefined
          ? kpi.atRisk - ((prevSnapshot.critical || 0) + (prevSnapshot.blocked || 0))
          : null,
      done: prevSnapshot.closed !== undefined ? kpi.done - (prevSnapshot.closed || 0) : null,
    };
  }, [kpi, prevSnapshot]);

  // ── Handlers ──
  const toggleGroup = (id) => setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  // ── KPI Card with trend ──
  const KpiCard = ({ label, value, color, icon: Icon, active, onClick, delta, deltaGoodDir }) => (
    <div
      onClick={onClick}
      style={{
        background: active ? `${color}10` : "var(--bg-card)",
        border: `1px solid ${active ? color + "40" : "var(--border)"}`,
        borderRadius: 8,
        padding: "10px 14px",
        flex: 1,
        minWidth: 100,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <Icon size={12} color={color} />
        <span
          style={{
            fontSize: 11,
            color: "var(--text-dim)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: sans,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: mono, lineHeight: 1 }}>{value}</div>
        {delta != null &&
          delta !== 0 &&
          (() => {
            const isGood = deltaGoodDir === "down" ? delta < 0 : deltaGoodDir === "up" ? delta > 0 : null;
            const trendColor = isGood === null ? "var(--text-faint)" : isGood ? "#10B981" : "#EF4444";
            return (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: trendColor,
                  fontFamily: mono,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {delta > 0 ? "▲" : "▼"}
                {Math.abs(delta)}
              </span>
            );
          })()}
      </div>
    </div>
  );

  // ── Column Header ──
  const ColHeader = ({ label, col, width, align }) => (
    <div
      onClick={() => toggleSort(col)}
      style={{
        width,
        minWidth: width,
        flex: col === "name" ? 1 : undefined,
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-dim)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        cursor: "pointer",
        userSelect: "none",
        padding: "8px 6px",
        display: "flex",
        alignItems: "center",
        gap: 3,
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        fontFamily: sans,
      }}
    >
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
        <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600, fontFamily: sans }}>
          {vi ? cfg.labelVi : cfg.label}
        </span>
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
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "0 6px",
          borderLeft: `3px solid ${cfg.color}`,
          background: isSelected ? "var(--hover-bg)" : "transparent",
          cursor: "pointer",
          transition: "background 0.1s",
          borderBottom: "1px solid var(--border-a10)",
          minHeight: 42,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = "var(--hover-bg-subtle)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Task name */}
        <div style={{ flex: 1, padding: "8px 6px", minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: sans,
            }}
          >
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
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: PHASE_COLORS[issue.phase] || "var(--text-dim)",
              background: (PHASE_COLORS[issue.phase] || "#666") + "15",
              padding: "1px 6px",
              borderRadius: 3,
              fontFamily: mono,
            }}
          >
            {issue.phase}
          </span>
        </div>

        {/* Due date */}
        <div style={{ width: 80, minWidth: 80, padding: "8px 6px", textAlign: "right" }}>
          {issue.due ? (
            <span
              style={{
                fontSize: 12,
                fontFamily: mono,
                color: issue._daysLeft < 0 ? "#EF4444" : issue._daysLeft <= 14 ? "#F59E0B" : "var(--text-muted)",
              }}
            >
              {issue.due.slice(5)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>—</span>
          )}
        </div>

        {/* Days left */}
        <div style={{ width: 55, minWidth: 55, padding: "8px 6px", textAlign: "right" }}>
          {issue._daysLeft !== null ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: mono,
                color: issue._daysLeft < 0 ? "#EF4444" : issue._daysLeft <= 7 ? "#F59E0B" : "var(--text-muted)",
              }}
            >
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
    const atRisk = group.issues.filter((i) => ["CRITICAL", "OVERDUE", "BLOCKED"].includes(i._status)).length;
    const done = group.issues.filter((i) => i._status === "DONE").length;
    return (
      <div
        onClick={() => toggleGroup(group.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "var(--bg-input)",
          cursor: "pointer",
          userSelect: "none",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        {isCollapsed ? (
          <ChevronRight size={13} color="var(--text-dim)" />
        ) : (
          <ChevronDown size={13} color="var(--text-dim)" />
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: PHASE_COLORS[group.phase] || "var(--text-primary)",
            fontFamily: sans,
          }}
        >
          {group.name}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: PHASE_COLORS[group.phase] || "var(--text-dim)",
            background: (PHASE_COLORS[group.phase] || "#666") + "15",
            padding: "1px 6px",
            borderRadius: 3,
            fontFamily: mono,
          }}
        >
          {group.phase}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: sans }}>
          {group.issues.length} {vi ? "mục" : "items"}
        </span>
        {atRisk > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#EF4444",
              background: "#EF444415",
              padding: "1px 6px",
              borderRadius: 3,
              fontFamily: mono,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Flame size={9} /> {atRisk}
          </span>
        )}
        {done > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#10B981",
              background: "#10B98115",
              padding: "1px 6px",
              borderRadius: 3,
              fontFamily: mono,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
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
      <div
        style={{
          width: 360,
          minWidth: 360,
          borderLeft: "1px solid var(--border)",
          background: "var(--bg-card)",
          overflowY: "auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: mono, color: "var(--text-faint)", marginBottom: 4 }}>
              {issue.id}
            </div>
            <div
              style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans, lineHeight: 1.3 }}
            >
              {vi && issue.titleVi ? issue.titleVi : issue.title}
            </div>
          </div>
          <button
            onClick={() => setSelectedIssue(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Meta */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <MetaRow
            icon={cfg.icon}
            iconColor={cfg.color}
            label={vi ? "Trạng thái" : "Status"}
            value={<StatusDot status={issue._status} />}
          />
          <MetaRow icon={User} label={vi ? "Phụ trách" : "Owner"} value={issue.owner || "—"} />
          <MetaRow
            icon={GitBranch}
            label="Phase"
            value={
              <span style={{ color: PHASE_COLORS[issue.phase], fontWeight: 700, fontFamily: mono }}>{issue.phase}</span>
            }
          />
          <MetaRow
            icon={Calendar}
            label={vi ? "Hạn" : "Due"}
            value={issue.due || "—"}
            valueColor={issue._daysLeft < 0 ? "#EF4444" : undefined}
          />
          {issue._daysLeft !== null && (
            <MetaRow
              icon={Timer}
              label={vi ? "Còn lại" : "Days left"}
              value={`${issue._daysLeft}d`}
              valueColor={issue._daysLeft < 0 ? "#EF4444" : issue._daysLeft <= 7 ? "#F59E0B" : undefined}
            />
          )}
          <MetaRow
            icon={AlertTriangle}
            label={vi ? "Mức độ" : "Severity"}
            value={<span style={{ color: SEV_COLORS[issue.sev], fontWeight: 700 }}>{issue.sev}</span>}
          />
          <MetaRow icon={LayoutDashboard} label={vi ? "Dự án" : "Project"} value={issue._projectName} />
        </div>

        {/* AI Advisory */}
        <AIAdvisoryCard advisory={aiAdvisory} isLoading={aiLoading} error={aiError} onRefresh={aiRefresh} lang={lang} />

        {/* Root Cause */}
        {issue.rootCause && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
                fontFamily: sans,
              }}
            >
              {vi ? "Nguyên nhân gốc" : "Root Cause"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: sans }}>
              {issue.rootCause}
            </div>
          </div>
        )}

        {/* Description */}
        {issue.desc && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
                fontFamily: sans,
              }}
            >
              {vi ? "Mô tả" : "Description"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                fontFamily: sans,
                whiteSpace: "pre-wrap",
              }}
            >
              {issue.desc}
            </div>
          </div>
        )}

        {/* Cascade Impacts */}
        {issue.impacts?.length > 0 && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#F59E0B",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
                fontFamily: sans,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Zap size={10} /> {vi ? "Ảnh hưởng Cascade" : "Cascade Impact"}
            </div>
            {issue.impacts.map((imp, i) => (
              <div key={i} style={{ fontSize: 12, color: "#D97706", fontFamily: mono, marginBottom: 2 }}>
                {imp.phase} +{Math.ceil(imp.days / 7)}w
              </div>
            ))}
          </div>
        )}

        {/* Activity Log */}
        <div style={{ padding: "12px 16px", flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Activity size={10} /> {vi ? "Lịch sử cập nhật" : "Update History"} ({issue.updates?.length || 0})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(issue.updates || []).slice(0, 10).map((upd, i) => (
              <div key={i} style={{ borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontFamily: mono, color: "var(--text-faint)" }}>{upd.date}</span>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 600 }}>{upd.author}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, fontFamily: sans }}>
                  {upd.text}
                </div>
              </div>
            ))}
            {(!issue.updates || issue.updates.length === 0) && (
              <div style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic" }}>
                {vi ? "Chưa có cập nhật" : "No updates yet"}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {onUpdateStatus && issue.status !== "CLOSED" && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: sans,
              }}
            >
              {vi ? "Hành động nhanh" : "Quick Actions"}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {issue.status === "DRAFT" && (
                <ActionBtn
                  label={vi ? "Duyệt" : "Approve"}
                  color="#065F46"
                  borderColor="#047857"
                  textColor="#6EE7B7"
                  icon={CheckCircle2}
                  onClick={() => {
                    onUpdateStatus(issue.id, "OPEN");
                    setSelectedIssue({ ...issue, status: "OPEN", _status: "ON_TRACK" });
                  }}
                />
              )}
              {issue.status === "OPEN" && (
                <ActionBtn
                  label={vi ? "Bắt đầu" : "Start"}
                  color="#1D4ED8"
                  borderColor="#2563EB"
                  textColor="#93C5FD"
                  icon={Activity}
                  onClick={() => {
                    onUpdateStatus(issue.id, "IN_PROGRESS");
                    setSelectedIssue({ ...issue, status: "IN_PROGRESS", _status: "ON_TRACK" });
                  }}
                />
              )}
              {issue.status === "IN_PROGRESS" && (
                <ActionBtn
                  label={vi ? "Chặn" : "Block"}
                  color="#7F1D1D"
                  borderColor="#991B1B"
                  textColor="#FCA5A5"
                  icon={Ban}
                  onClick={() => {
                    onUpdateStatus(issue.id, "BLOCKED");
                    setSelectedIssue({ ...issue, status: "BLOCKED", _status: "BLOCKED" });
                  }}
                />
              )}
              {issue.status !== "CLOSED" && (
                <ActionBtn
                  label={vi ? "Hoàn thành" : "Done"}
                  color="#065F46"
                  borderColor="#047857"
                  textColor="#6EE7B7"
                  icon={CheckCircle2}
                  onClick={() => {
                    onUpdateStatus(issue.id, "CLOSED");
                    setSelectedIssue({ ...issue, status: "CLOSED", _status: "DONE" });
                  }}
                />
              )}
              {issue.sev !== "CRITICAL" && (
                <ActionBtn
                  label={vi ? "Nâng cấp" : "Escalate"}
                  color="#7F1D1D"
                  borderColor="#991B1B"
                  textColor="#FCA5A5"
                  icon={Flame}
                  onClick={() => {
                    /* Escalate = change severity to CRITICAL — needs issueService update */
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* View full detail */}
        {onNavigateIssue && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => onNavigateIssue(issue)}
              style={{
                width: "100%",
                background: "#1D4ED8",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: sans,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ExternalLink size={13} /> {vi ? "Xem chi tiết đầy đủ" : "View Full Details"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Meta Row (for detail panel) ──
  const ActionBtn = ({ label, color, borderColor, textColor, icon: Icon, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: color,
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        padding: "5px 10px",
        color: textColor,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontFamily: sans,
      }}
    >
      <Icon size={11} /> {label}
    </button>
  );

  const MetaRow = ({ icon: Icon, iconColor, label, value, valueColor }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={12} color={iconColor || "var(--text-faint)"} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "var(--text-faint)", width: 70, flexShrink: 0, fontFamily: sans }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: valueColor || "var(--text-primary)", fontFamily: sans, flex: 1 }}>
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );

  // ── Empty State ──
  if (issues.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <LayoutDashboard size={36} color="var(--text-disabled)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: sans }}>
          {vi ? "Chào mừng đến RtR Control Tower" : "Welcome to RtR Control Tower"}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", fontFamily: sans }}>
          {vi
            ? "Chưa có dữ liệu. Tải file Excel master lên để AI tự động phân bổ dữ liệu vào hệ thống."
            : "No data yet. Upload an Excel master file to let AI auto-distribute data."}
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
        <KpiCard
          label={vi ? "Đang hoạt động" : "Active"}
          value={kpi.active}
          color="#3B82F6"
          icon={Activity}
          active={statusFilter === "ALL"}
          onClick={() => setStatusFilter("ALL")}
          delta={trend.active}
          deltaGoodDir="down"
        />
        <KpiCard
          label={vi ? "Có rủi ro" : "At Risk"}
          value={kpi.atRisk}
          color="#EF4444"
          icon={AlertTriangle}
          active={statusFilter === "AT_RISK"}
          onClick={() => setStatusFilter(statusFilter === "AT_RISK" ? "ALL" : "AT_RISK")}
          delta={trend.atRisk}
          deltaGoodDir="down"
        />
        <KpiCard
          label={vi ? "Không cập nhật" : "Stale"}
          value={kpi.stale}
          color="#6B7280"
          icon={Clock}
          active={statusFilter === "STALE"}
          onClick={() => setStatusFilter(statusFilter === "STALE" ? "ALL" : "STALE")}
        />
        <KpiCard
          label={vi ? "Hoàn thành" : "Done"}
          value={kpi.done}
          color="#10B981"
          icon={CheckCircle2}
          active={statusFilter === "DONE"}
          onClick={() => setStatusFilter(statusFilter === "DONE" ? "ALL" : "DONE")}
          delta={trend.done}
          deltaGoodDir="up"
        />
        <KpiCard label={vi ? "Thành viên" : "Team"} value={kpi.owners} color="#8B5CF6" icon={Users} />
      </div>

      {/* Cross-App MRP Widget */}
      <CrossAppWidget data={crossAppData} summary={crossAppSummary} loading={crossAppLoading} lang={lang} />

      {/* View Toggle + Search + Filter Bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* View Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "var(--bg-input)",
            borderRadius: 6,
            padding: 2,
            border: "1px solid var(--border)",
          }}
        >
          {[
            { id: "table", icon: Table2, label: vi ? "Bảng" : "Table" },
            { id: "timeline", icon: GanttChart, label: vi ? "Timeline" : "Timeline" },
            { id: "standup", icon: Mic, label: "Standup" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              style={{
                background: viewMode === v.id ? "var(--bg-card)" : "transparent",
                border: viewMode === v.id ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: viewMode === v.id ? "var(--text-primary)" : "var(--text-faint)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: sans,
                boxShadow: viewMode === v.id ? "0 1px 2px var(--shadow-color)" : "none",
              }}
            >
              <v.icon size={12} /> {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={14}
            color="var(--text-faint)"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={vi ? "Tìm task, người phụ trách, dự án..." : "Search tasks, owners, projects..."}
            style={{
              width: "100%",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "7px 10px 7px 32px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
              fontFamily: sans,
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "7px 10px",
            color: "var(--text-muted)",
            fontSize: 12,
            outline: "none",
            fontFamily: sans,
            cursor: "pointer",
          }}
        >
          <option value="ALL">{vi ? "Tất cả trạng thái" : "All Status"}</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {vi ? cfg.labelVi : cfg.label}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono, whiteSpace: "nowrap" }}>
          {filtered.length}/{enrichedIssues.length}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "timeline" && (
        <TimelineView grouped={grouped} projects={projects} vi={vi} onSelect={setSelectedIssue} />
      )}
      {viewMode === "standup" && (
        <StandupView
          issues={filtered}
          enrichedIssues={enrichedIssues}
          teamMembers={teamMembers}
          vi={vi}
          lang={lang}
          onSelect={setSelectedIssue}
        />
      )}
      {viewMode === "table" && (
        <div
          style={{
            display: "flex",
            gap: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
            height: "calc(100vh - 320px)",
            minHeight: 400,
          }}
        >
          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", minWidth: 0 }}>
            {/* Column Headers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-card)",
                position: "sticky",
                top: 0,
                zIndex: 3,
                padding: "0 6px",
              }}
            >
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
            {grouped.map((group) => (
              <div key={group.id}>
                <GroupHeader group={group} />
                {!collapsedGroups[group.id] && group.issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
              </div>
            ))}

            {/* No results */}
            {filtered.length === 0 && (
              <div
                style={{ padding: 40, textAlign: "center", color: "var(--text-faint)", fontSize: 14, fontFamily: sans }}
              >
                {vi ? "Không tìm thấy task nào khớp bộ lọc" : "No tasks match current filters"}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedIssue && <DetailPanel issue={selectedIssue} />}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TIMELINE / GANTT VIEW
// ═══════════════════════════════════════════════════════════
function TimelineView({ grouped, projects: _projects, vi, onSelect }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 5);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  const dayToX = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diff = Math.ceil((d - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (diff / totalDays) * 100));
  };

  const todayX = dayToX(today.toISOString().split("T")[0]);

  // Generate month labels
  const months = [];
  const d = new Date(startDate);
  d.setDate(1);
  while (d <= endDate) {
    const x = dayToX(d.toISOString().split("T")[0]);
    months.push({ label: d.toLocaleDateString(vi ? "vi-VN" : "en-US", { month: "short", year: "2-digit" }), x });
    d.setMonth(d.getMonth() + 1);
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        height: "calc(100vh - 320px)",
        minHeight: 400,
      }}
    >
      {/* Month header */}
      <div
        style={{
          position: "relative",
          height: 28,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-input)",
        }}
      >
        {months.map((m, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${m.x}%`,
              fontSize: 10,
              color: "var(--text-dim)",
              fontFamily: mono,
              fontWeight: 600,
              top: 6,
              transform: "translateX(-50%)",
            }}
          >
            {m.label}
          </span>
        ))}
        {/* Today line */}
        <div
          style={{
            position: "absolute",
            left: `${todayX}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: "#EF4444",
            zIndex: 2,
          }}
        />
      </div>

      {/* Rows */}
      <div style={{ overflowY: "auto", height: "calc(100% - 28px)" }}>
        {grouped.map((group) => (
          <div key={group.id}>
            {/* Group header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                background: "var(--bg-input)",
                borderBottom: "1px solid var(--border)",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: PHASE_COLORS[group.phase] || "var(--text-primary)",
                  fontFamily: sans,
                }}
              >
                {group.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: PHASE_COLORS[group.phase] || "var(--text-dim)",
                  background: (PHASE_COLORS[group.phase] || "#666") + "15",
                  padding: "1px 5px",
                  borderRadius: 3,
                  fontFamily: mono,
                }}
              >
                {group.phase}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{group.issues.length}</span>
            </div>

            {/* Task bars */}
            {group.issues.map((issue) => {
              const cfg = STATUS_CONFIG[issue._status] || STATUS_CONFIG.ON_TRACK;
              const createdX = dayToX(issue.created);
              const dueX = issue.due ? dayToX(issue.due) : dayToX(today.toISOString().split("T")[0]);
              const barLeft = createdX != null ? createdX : 0;
              const barWidth = Math.max(2, (dueX || barLeft + 5) - barLeft);

              return (
                <div
                  key={issue.id}
                  onClick={() => onSelect(issue)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 32,
                    borderBottom: "1px solid var(--border-a10)",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Label */}
                  <div
                    style={{
                      width: 180,
                      minWidth: 180,
                      padding: "0 8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: sans,
                    }}
                  >
                    {vi && issue.titleVi ? issue.titleVi : issue.title}
                  </div>
                  {/* Bar area */}
                  <div style={{ flex: 1, position: "relative", height: "100%" }}>
                    {/* Today line */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${todayX}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: "#EF444440",
                      }}
                    />
                    {/* Bar */}
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        height: 18,
                        borderRadius: 4,
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                        minWidth: 8,
                        background: `${cfg.color}30`,
                        border: `1px solid ${cfg.color}50`,
                      }}
                    >
                      {/* Progress fill */}
                      {issue.status === "CLOSED" && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: "100%",
                            background: `${cfg.color}50`,
                            borderRadius: 3,
                          }}
                        />
                      )}
                      {/* Owner label inside bar */}
                      <span
                        style={{
                          position: "absolute",
                          left: 4,
                          top: 1,
                          fontSize: 9,
                          color: cfg.color,
                          fontWeight: 600,
                          fontFamily: sans,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {issue.owner?.split(" ").pop() || ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STANDUP MEETING MODE
// ═══════════════════════════════════════════════════════════
function StandupView({ issues: _issues, enrichedIssues, teamMembers: _teamMembers, vi, lang: _lang, onSelect }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerSec, setTimerSec] = useState(900); // 15 min
  const [running, setRunning] = useState(false);

  // Timer
  useEffect(() => {
    if (!running || timerSec <= 0) return;
    const t = setInterval(() => setTimerSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, timerSec]);

  // Group by owner
  const owners = useMemo(() => {
    const map = {};
    for (const issue of enrichedIssues) {
      const owner = issue.owner || (vi ? "Chưa phân công" : "Unassigned");
      if (!map[owner]) map[owner] = { name: owner, issues: [], active: 0, blocked: 0, newThisWeek: 0 };
      map[owner].issues.push(issue);
      if (issue._status !== "DONE") map[owner].active++;
      if (issue._status === "BLOCKED" || issue._status === "CRITICAL") map[owner].blocked++;
      const created = new Date(issue.created);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (created > weekAgo) map[owner].newThisWeek++;
    }
    return Object.values(map).sort((a, b) => b.active - a.active);
  }, [enrichedIssues, vi]);

  const currentOwner = owners[currentIdx] || owners[0];
  const timerMin = Math.floor(timerSec / 60);
  const timerS = timerSec % 60;
  const timerColor = timerSec < 60 ? "#EF4444" : timerSec < 180 ? "#F59E0B" : "var(--text-muted)";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        height: "calc(100vh - 320px)",
        minHeight: 400,
        display: "flex",
      }}
    >
      {/* Left: Owner list */}
      <div style={{ width: 220, minWidth: 220, borderRight: "1px solid var(--border)", overflowY: "auto" }}>
        {/* Timer bar */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() => setRunning(!running)}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "4px 8px",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              fontFamily: sans,
            }}
          >
            {running ? <Pause size={10} /> : <Play size={10} />}
            {running ? "Pause" : "Start"}
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: timerColor, fontFamily: mono }}>
            {String(timerMin).padStart(2, "0")}:{String(timerS).padStart(2, "0")}
          </span>
          <button
            onClick={() => {
              setCurrentIdx((i) => Math.min(i + 1, owners.length - 1));
            }}
            style={{
              marginLeft: "auto",
              background: "#1D4ED8",
              border: "none",
              borderRadius: 4,
              padding: "4px 8px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              fontFamily: sans,
              fontWeight: 600,
            }}
          >
            <SkipForward size={10} /> Next
          </button>
        </div>

        {/* Owner cards */}
        {owners.map((o, i) => (
          <div
            key={o.name}
            onClick={() => setCurrentIdx(i)}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              borderBottom: "1px solid var(--border-a10)",
              background: i === currentIdx ? "var(--hover-bg)" : "transparent",
              borderLeft: i === currentIdx ? "3px solid #3B82F6" : "3px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: i === currentIdx ? 700 : 500,
                  color: i === currentIdx ? "var(--text-primary)" : "var(--text-muted)",
                  fontFamily: sans,
                }}
              >
                {o.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: o.blocked > 0 ? "#EF4444" : "var(--text-faint)",
                  fontFamily: mono,
                }}
              >
                {o.active}
              </span>
            </div>
            {o.blocked > 0 && (
              <span style={{ fontSize: 9, color: "#EF4444", fontFamily: mono }}>{o.blocked} blocked</span>
            )}
            {o.newThisWeek > 0 && (
              <span style={{ fontSize: 9, color: "#3B82F6", fontFamily: mono, marginLeft: 6 }}>
                +{o.newThisWeek} new
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Right: Current person's tasks */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {currentOwner && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#3B82F615",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#3B82F6",
                  fontFamily: mono,
                }}
              >
                {currentOwner.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: sans }}>
                  {currentOwner.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: sans }}>
                  {currentOwner.active} {vi ? "đang mở" : "active"} · {currentOwner.blocked}{" "}
                  {vi ? "bị chặn" : "blocked"} · {currentOwner.newThisWeek} {vi ? "mới tuần này" : "new this week"}
                </div>
              </div>
            </div>

            {/* AI suggestion */}
            {(currentOwner.blocked > 0 || currentOwner.active > 8 || currentOwner.newThisWeek > 3) && (
              <div
                style={{
                  background: "#8B5CF608",
                  border: "1px solid #8B5CF625",
                  borderRadius: 6,
                  padding: "8px 12px",
                  marginBottom: 12,
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-start",
                }}
              >
                <Zap size={12} color="#8B5CF6" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#7C3AED", fontFamily: sans, lineHeight: 1.4 }}>
                  {currentOwner.blocked > 0 &&
                    (vi
                      ? `${currentOwner.blocked} task bị chặn — hỏi cần hỗ trợ gì để unblock. `
                      : `${currentOwner.blocked} blocked tasks — ask what's needed to unblock. `)}
                  {currentOwner.active > 8 &&
                    (vi
                      ? `Đang giữ ${currentOwner.active} tasks — xem xét phân bổ lại. `
                      : `Holding ${currentOwner.active} tasks — consider rebalancing. `)}
                  {currentOwner.newThisWeek > 3 &&
                    (vi
                      ? `${currentOwner.newThisWeek} task mới tuần này — check ưu tiên. `
                      : `${currentOwner.newThisWeek} new this week — check prioritization. `)}
                </span>
              </div>
            )}

            {/* Task list grouped by status */}
            {["BLOCKED", "CRITICAL", "IN_PROGRESS", "OPEN", "DRAFT"].map((status) => {
              const items = currentOwner.issues.filter((i) => i.status === status);
              if (items.length === 0) return null;
              const statusCfg =
                STATUS_CONFIG[status === "CRITICAL" ? "CRITICAL" : status === "BLOCKED" ? "BLOCKED" : "ON_TRACK"] ||
                STATUS_CONFIG.ON_TRACK;
              return (
                <div key={status} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: statusCfg.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 4,
                      fontFamily: sans,
                    }}
                  >
                    {status.replace("_", " ")} ({items.length})
                  </div>
                  {items.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => onSelect(issue)}
                      style={{
                        padding: "6px 10px",
                        borderLeft: `3px solid ${statusCfg.color}`,
                        marginBottom: 3,
                        borderRadius: "0 4px 4px 0",
                        background: "var(--bg-input)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-input)")}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: sans }}>
                        {vi && issue.titleVi ? issue.titleVi : issue.title}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
                        {issue.id} · {issue.phase} · {issue.due || "no due"}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Done tasks (collapsed) */}
            {currentOwner.issues.filter((i) => i.status === "CLOSED").length > 0 && (
              <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: sans, marginTop: 8 }}>
                ✓ {currentOwner.issues.filter((i) => i.status === "CLOSED").length} {vi ? "đã hoàn thành" : "completed"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
