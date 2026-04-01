import { useMemo } from "react";
import { Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PHASES, PHASE_COLORS, mono, sans } from "../constants";

const DAY_MS = 86400000;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 32;
const LABEL_WIDTH = 180;

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  return Math.round((b - a) / DAY_MS);
}

function formatDate(d) {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

export default function GanttChart({ projects, issues, lang }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute time range across all projects
  const { rows, minDate, totalDays, months } = useMemo(() => {
    const allRows = [];
    let minD = new Date("2099-01-01");
    let maxD = new Date("2000-01-01");

    for (const proj of projects) {
      if (!proj.milestones) continue;

      const phases = PHASES.map((phase) => {
        const ms = proj.milestones[phase];
        if (!ms) return null;
        const target = parseDate(ms.target);
        const actual = parseDate(ms.actual);
        const adjusted = parseDate(ms.adjusted);
        const start = target || actual || adjusted;
        if (!start) return null;
        return { phase, target, actual, adjusted, status: ms.status, start };
      }).filter(Boolean);

      if (phases.length === 0) continue;

      // Build phase bars — each phase spans from its start to next phase start (or +90 days)
      const bars = phases.map((p, i) => {
        const nextStart = i < phases.length - 1 ? phases[i + 1].start : null;
        const end = p.actual || p.adjusted || nextStart || new Date(p.start.getTime() + 90 * DAY_MS);
        return { ...p, end };
      });

      for (const bar of bars) {
        if (bar.start < minD) minD = new Date(bar.start);
        if (bar.end > maxD) maxD = new Date(bar.end);
      }

      // Count open issues per phase for this project
      const phaseIssues = {};
      for (const phase of PHASES) {
        phaseIssues[phase] = (issues || []).filter(
          (i) => i.pid === proj.id && i.phase === phase && i.status !== "CLOSED",
        ).length;
      }

      allRows.push({ project: proj, bars, phaseIssues });
    }

    // Pad range
    if (minD > maxD) {
      minD = new Date(today.getTime() - 30 * DAY_MS);
      maxD = new Date(today.getTime() + 180 * DAY_MS);
    }
    minD = new Date(minD.getTime() - 14 * DAY_MS);
    maxD = new Date(maxD.getTime() + 30 * DAY_MS);
    const total = daysBetween(minD, maxD);

    // Month markers
    const monthMarkers = [];
    const cursor = new Date(minD.getFullYear(), minD.getMonth(), 1);
    while (cursor <= maxD) {
      monthMarkers.push({
        date: new Date(cursor),
        label: cursor.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { month: "short", year: "2-digit" }),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { rows: allRows, minDate: minD, maxDate: maxD, totalDays: total, months: monthMarkers };
  }, [projects, issues, lang]);

  const dayToX = (date) => {
    if (!date) return 0;
    return (daysBetween(minDate, date) / totalDays) * 100;
  };

  const chartWidth = Math.max(800, totalDays * 3);
  const todayX = dayToX(today);

  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
        <Calendar size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
        <div>{lang === "vi" ? "Chưa có dữ liệu timeline" : "No timeline data available"}</div>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
    >
      {/* Title */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Calendar size={14} />
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: sans }}>
          {lang === "vi" ? "Gantt — Lịch trình dự án" : "Gantt — Project Timeline"}
        </span>
      </div>

      {/* Scrollable chart area */}
      <div style={{ overflowX: "auto", position: "relative" }}>
        <div style={{ minWidth: LABEL_WIDTH + chartWidth, position: "relative" }}>
          {/* Month headers */}
          <div style={{ display: "flex", height: HEADER_HEIGHT, borderBottom: "1px solid var(--border)" }}>
            <div
              style={{
                width: LABEL_WIDTH,
                flexShrink: 0,
                background: "var(--bg-card)",
                zIndex: 2,
                borderRight: "1px solid var(--border)",
              }}
            />
            <div style={{ flex: 1, position: "relative" }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${dayToX(m.date)}%`,
                    top: 0,
                    height: "100%",
                    borderLeft: "1px solid var(--border-a20)",
                    padding: "6px 8px",
                    fontSize: 11,
                    color: "var(--text-faint)",
                    fontFamily: mono,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {rows.map(({ project: proj, bars, phaseIssues }) => (
            <div
              key={proj.id}
              style={{
                display: "flex",
                height: ROW_HEIGHT,
                borderBottom: "1px solid var(--border-a10)",
              }}
            >
              {/* Project label */}
              <div
                style={{
                  width: LABEL_WIDTH,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 12px",
                  background: "var(--bg-card)",
                  borderRight: "1px solid var(--border)",
                  zIndex: 2,
                  position: "sticky",
                  left: 0,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: PHASE_COLORS[proj.phase],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {proj.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>{proj.phase}</div>
                </div>
              </div>

              {/* Bars */}
              <div style={{ flex: 1, position: "relative" }}>
                {/* Today line */}
                <div
                  style={{
                    position: "absolute",
                    left: `${todayX}%`,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "#EF4444",
                    zIndex: 1,
                    opacity: 0.5,
                  }}
                />

                {bars.map((bar) => {
                  const left = dayToX(bar.start);
                  const right = dayToX(bar.end);
                  const width = Math.max(right - left, 1);
                  const issueCount = phaseIssues[bar.phase] || 0;
                  const isActive = bar.phase === proj.phase;
                  const isCompleted = bar.status === "COMPLETED";
                  const isDelayed = bar.adjusted && bar.target && bar.adjusted > bar.target;

                  return (
                    <div
                      key={bar.phase}
                      title={`${bar.phase}: ${formatDate(bar.start)} → ${formatDate(bar.end)}${issueCount > 0 ? ` (${issueCount} issues)` : ""}`}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${width}%`,
                        top: 8,
                        height: ROW_HEIGHT - 16,
                        background: isCompleted
                          ? `${PHASE_COLORS[bar.phase]}30`
                          : `linear-gradient(90deg, ${PHASE_COLORS[bar.phase]}${isActive ? "90" : "50"}, ${PHASE_COLORS[bar.phase]}${isActive ? "60" : "25"})`,
                        borderRadius: 4,
                        border: `1px solid ${PHASE_COLORS[bar.phase]}${isActive ? "80" : "30"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "0 6px",
                        overflow: "hidden",
                        fontSize: 10,
                        fontWeight: 700,
                        color: isActive ? "#fff" : PHASE_COLORS[bar.phase],
                        fontFamily: mono,
                        boxShadow: isActive ? `0 2px 8px ${PHASE_COLORS[bar.phase]}30` : "none",
                      }}
                    >
                      {isCompleted && <CheckCircle2 size={10} />}
                      {isDelayed && <AlertTriangle size={10} color="#F59E0B" />}
                      {bar.phase}
                      {issueCount > 0 && (
                        <span style={{ background: "#EF444440", borderRadius: 3, padding: "0 3px", fontSize: 9 }}>
                          {issueCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Today label */}
          <div
            style={{
              position: "absolute",
              top: 2,
              left: `calc(${LABEL_WIDTH}px + ${todayX}% * (100% - ${LABEL_WIDTH}px) / 100%)`,
              transform: "translateX(-50%)",
              fontSize: 9,
              color: "#EF4444",
              fontWeight: 700,
              fontFamily: mono,
              background: "var(--bg-card)",
              padding: "1px 4px",
              borderRadius: 2,
              zIndex: 3,
            }}
          >
            {lang === "vi" ? "Hôm nay" : "Today"}
          </div>
        </div>
      </div>
    </div>
  );
}
