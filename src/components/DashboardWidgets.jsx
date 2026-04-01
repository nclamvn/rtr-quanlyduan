import { useState, useEffect } from "react";
import {
  GripVertical,
  X,
  Plus,
  RotateCcw,
  AlertTriangle,
  Users,
  DoorOpen,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import { Badge, Btn } from "./ui";
import { PHASES, PHASE_COLORS, STATUS_COLORS, SEV_COLORS, mono } from "../constants";

const STORAGE_KEY = "rtr-dashboard-layout";

const WIDGET_REGISTRY = {
  kpi_overview: {
    id: "kpi_overview",
    label: "KPI Overview",
    labelVi: "Tổng quan KPI",
    Icon: BarChart3,
    size: "wide",
    render: ({ issues, projects, lang }) => {
      const open = issues.filter((i) => i.status !== "CLOSED").length;
      const critical = issues.filter((i) => i.sev === "CRITICAL" && i.status !== "CLOSED").length;
      const closedPct =
        issues.length > 0 ? Math.round((issues.filter((i) => i.status === "CLOSED").length / issues.length) * 100) : 0;
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <KpiCard label={lang === "vi" ? "Dự án" : "Projects"} value={projects.length} color="#3B82F6" />
          <KpiCard label={lang === "vi" ? "Vấn đề mở" : "Open Issues"} value={open} color="#EF4444" />
          <KpiCard label="Critical" value={critical} color="#F59E0B" />
          <KpiCard label={lang === "vi" ? "Tỷ lệ đóng" : "Closure"} value={`${closedPct}%`} color="#10B981" />
        </div>
      );
    },
  },
  recent_issues: {
    id: "recent_issues",
    label: "Recent Issues",
    labelVi: "Vấn đề gần đây",
    Icon: AlertTriangle,
    size: "normal",
    render: ({ issues, lang }) => {
      const recent = [...issues].sort((a, b) => (b.created || "").localeCompare(a.created || "")).slice(0, 5);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {recent.map((i) => (
            <div
              key={i.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 0",
                borderBottom: "1px solid var(--border-a10)",
              }}
            >
              <Badge label={i.id} color="#3B82F6" />
              <Badge label={i.sev} color={SEV_COLORS[i.sev]} />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-primary)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lang === "vi" ? i.titleVi || i.title : i.title}
              </span>
              <Badge label={i.status} color={STATUS_COLORS[i.status]} />
            </div>
          ))}
          {recent.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-disabled)", padding: 8 }}>No issues</div>
          )}
        </div>
      );
    },
  },
  team_workload: {
    id: "team_workload",
    label: "Team Workload",
    labelVi: "Tải công việc",
    Icon: Users,
    size: "normal",
    render: ({ issues, teamMembers, lang: _lang }) => {
      const members = (teamMembers || [])
        .map((m) => {
          const count = issues.filter((i) => i.owner === m.name && i.status !== "CLOSED").length;
          return { ...m, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {members.map((m) => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--hover-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                {m.name.split(" ").pop()[0]}
              </div>
              <span style={{ fontSize: 12, color: "var(--text-primary)", flex: 1 }}>{m.name}</span>
              <div style={{ width: 60, height: 6, background: "var(--hover-bg)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(m.count * 15, 100)}%`,
                    height: "100%",
                    background: m.count > 5 ? "#EF4444" : m.count > 2 ? "#F59E0B" : "#10B981",
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  fontFamily: mono,
                  minWidth: 20,
                  textAlign: "right",
                }}
              >
                {m.count}
              </span>
            </div>
          ))}
        </div>
      );
    },
  },
  phase_progress: {
    id: "phase_progress",
    label: "Phase Progress",
    labelVi: "Tiến độ giai đoạn",
    Icon: DoorOpen,
    size: "normal",
    render: ({ projects, lang: _lang }) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {projects.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-primary)",
                fontWeight: 600,
                width: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.name}
            </span>
            <div style={{ flex: 1, display: "flex", gap: 2 }}>
              {PHASES.map((ph) => {
                const isCurrent = ph === p.phase;
                const idx = PHASES.indexOf(ph);
                const currentIdx = PHASES.indexOf(p.phase);
                const isPast = idx < currentIdx;
                return (
                  <div
                    key={ph}
                    style={{
                      flex: 1,
                      height: 16,
                      borderRadius: 2,
                      background: isPast ? `${PHASE_COLORS[ph]}80` : isCurrent ? PHASE_COLORS[ph] : "var(--hover-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 700,
                      color: isPast || isCurrent ? "#fff" : "var(--text-disabled)",
                    }}
                  >
                    {ph}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  severity_breakdown: {
    id: "severity_breakdown",
    label: "Severity Breakdown",
    labelVi: "Phân bổ mức độ",
    Icon: Activity,
    size: "small",
    render: ({ issues }) => {
      const sevs = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      const total = issues.filter((i) => i.status !== "CLOSED").length || 1;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sevs.map((sev) => {
            const count = issues.filter((i) => i.sev === sev && i.status !== "CLOSED").length;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={sev} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLORS[sev], width: 55, fontFamily: mono }}>
                  {sev}
                </span>
                <div style={{ flex: 1, height: 8, background: "var(--hover-bg)", borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: SEV_COLORS[sev],
                      borderRadius: 4,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontFamily: mono,
                    minWidth: 24,
                    textAlign: "right",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      );
    },
  },
  cascade_alerts: {
    id: "cascade_alerts",
    label: "Cascade Alerts",
    labelVi: "Cảnh báo lan truyền",
    Icon: Zap,
    size: "small",
    render: ({ issues, lang }) => {
      const cascade = issues.filter((i) => i.status !== "CLOSED" && i.impacts?.length > 0);
      return (
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: cascade.length > 0 ? "#EF4444" : "#10B981",
              fontFamily: mono,
            }}
          >
            {cascade.length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
            {lang === "vi" ? "vấn đề có tác động lan truyền" : "issues with cascade impact"}
          </div>
          {cascade.slice(0, 3).map((i) => (
            <div key={i.id} style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", gap: 4 }}>
              <Badge label={i.id} color="#3B82F6" /> → {i.impacts.length} {lang === "vi" ? "phase" : "phases"}
            </div>
          ))}
        </div>
      );
    },
  },
};

function KpiCard({ label, value, color }) {
  return (
    <div
      style={{ background: "var(--bg-input)", borderRadius: 6, padding: "10px 12px", borderLeft: `3px solid ${color}` }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: mono }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

const DEFAULT_LAYOUT = [
  "kpi_overview",
  "recent_issues",
  "team_workload",
  "phase_progress",
  "severity_breakdown",
  "cascade_alerts",
];

export default function DashboardWidgets({ projects, issues, teamMembers, lang }) {
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
    } catch {
      return DEFAULT_LAYOUT;
    }
  });
  const [editing, setEditing] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const addWidget = (id) => {
    if (!layout.includes(id)) setLayout((prev) => [...prev, id]);
  };

  const removeWidget = (id) => {
    setLayout((prev) => prev.filter((w) => w !== id));
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  const handleDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (idx) => (e) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setLayout((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };

  const handleDragEnd = () => setDragIdx(null);

  const availableWidgets = Object.keys(WIDGET_REGISTRY).filter((id) => !layout.includes(id));
  const data = { projects, issues, teamMembers, lang };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Btn small variant={editing ? "primary" : "default"} onClick={() => setEditing(!editing)}>
          {editing ? (lang === "vi" ? "Xong" : "Done") : lang === "vi" ? "Tùy chỉnh" : "Customize"}
        </Btn>
        {editing && (
          <Btn small onClick={resetLayout}>
            <RotateCcw size={11} /> {lang === "vi" ? "Mặc định" : "Reset"}
          </Btn>
        )}
      </div>

      {/* Add widget row */}
      {editing && availableWidgets.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 0" }}>
          {availableWidgets.map((id) => {
            const w = WIDGET_REGISTRY[id];
            return (
              <Btn key={id} small onClick={() => addWidget(id)}>
                <Plus size={10} /> {lang === "vi" ? w.labelVi : w.label}
              </Btn>
            );
          })}
        </div>
      )}

      {/* Widget grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {layout.map((widgetId, idx) => {
          const widget = WIDGET_REGISTRY[widgetId];
          if (!widget) return null;
          const isWide = widget.size === "wide";
          return (
            <div
              key={widgetId}
              draggable={editing}
              onDragStart={editing ? handleDragStart(idx) : undefined}
              onDragOver={editing ? handleDragOver(idx) : undefined}
              onDragEnd={editing ? handleDragEnd : undefined}
              style={{
                gridColumn: isWide ? "1 / -1" : undefined,
                background: "var(--bg-card)",
                border: `1px solid ${editing && dragIdx === idx ? "#3B82F6" : "var(--border)"}`,
                borderRadius: 8,
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {editing && (
                  <span style={{ cursor: "grab", color: "var(--text-disabled)" }}>
                    <GripVertical size={12} />
                  </span>
                )}
                <widget.Icon size={13} color="var(--text-dim)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
                  {lang === "vi" ? widget.labelVi : widget.label}
                </span>
                {editing && (
                  <button
                    onClick={() => removeWidget(widgetId)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#EF4444",
                      display: "flex",
                      opacity: 0.5,
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div style={{ padding: 12 }}>{widget.render(data)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
