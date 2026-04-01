// ═══════════════════════════════════════════════════════════
// RtR Control Tower — My Workspace (Personal Dashboard)
// Shows after login: user's projects, AI advisor, dependencies, team workload
// ═══════════════════════════════════════════════════════════
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Flame,
  Ban,
  Timer,
  Calendar,
  GitBranch,
  ChevronRight,
  Brain,
  Zap,
  Link2,
  ArrowRight,
  TrendingUp,
  BarChart3,
  User,
  Shield,
  Wrench,
  Eye,
  UserCog,
  RefreshCw,
  X,
} from "lucide-react";
import { PHASE_COLORS, mono, sans } from "../constants";
import { supabase, isSupabaseConnected } from "../lib/supabase";

const STATUS_COLORS_MAP = {
  CRITICAL: "#EF4444",
  OVERDUE: "#EF4444",
  BLOCKED: "#DC2626",
  AT_RISK: "#F59E0B",
  ON_TRACK: "#10B981",
  STALE: "#6B7280",
  DONE: "#3B82F6",
};

function getTaskStatus(issue) {
  if (issue.status === "CLOSED") return "DONE";
  if (issue.status === "BLOCKED") return "BLOCKED";
  if (issue.sev === "CRITICAL") return "CRITICAL";
  if (issue.due) {
    const daysLeft = Math.ceil((new Date(issue.due) - new Date()) / 86400000);
    if (daysLeft < 0) return "OVERDUE";
    if (daysLeft <= 14) return "AT_RISK";
  }
  const lastUpdate = issue.updates?.[0]?.date || issue.created;
  if (lastUpdate && Math.ceil((new Date() - new Date(lastUpdate)) / 86400000) > 7) return "STALE";
  return "ON_TRACK";
}

export default function MyWorkspace({
  currentUser,
  issues,
  projects,
  teamMembers: _teamMembers,
  lang,
  onNavigateToProject,
  onNavigateToIssue,
}) {
  const vi = lang === "vi";
  const userName = currentUser?.name || "";
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAllTeam, setShowAllTeam] = useState(false);

  // ── My Issues ──
  const myIssues = useMemo(
    () =>
      issues
        .filter((i) => i.owner === userName || i.owner_name === userName)
        .map((i) => ({ ...i, _status: getTaskStatus(i) })),
    [issues, userName],
  );

  // ── My Projects (projects where I have issues) ──
  const myProjects = useMemo(() => {
    const pids = new Set(myIssues.map((i) => i.pid));
    return projects
      .filter((p) => pids.has(p.id))
      .map((proj) => {
        const pIssues = myIssues.filter((i) => i.pid === proj.id);
        const open = pIssues.filter((i) => i._status !== "DONE");
        const critical = open.filter((i) => i._status === "CRITICAL" || i._status === "OVERDUE");
        const blocked = open.filter((i) => i._status === "BLOCKED");
        const done = pIssues.filter((i) => i._status === "DONE");
        const overdue = open.filter((i) => i.due && new Date(i.due) < new Date());
        return { ...proj, myIssues: pIssues, open, critical, blocked, done, overdue, total: pIssues.length };
      });
  }, [projects, myIssues]);

  // ── Cross-project dependencies ──
  const dependencies = useMemo(() => {
    const deps = [];
    for (const issue of myIssues) {
      if (issue.impacts?.length > 0) {
        for (const imp of issue.impacts) {
          deps.push({
            fromIssue: issue,
            toPhase: imp.phase,
            delayWeeks: Math.ceil((imp.days || 0) / 7),
            desc: imp.desc || imp.description,
          });
        }
      }
    }
    return deps;
  }, [myIssues]);

  // ── Team Workload ──
  const teamWorkload = useMemo(() => {
    const map = {};
    for (const issue of issues.filter((i) => i.status !== "CLOSED")) {
      const owner = issue.owner || issue.owner_name || (vi ? "Chưa phân công" : "Unassigned");
      if (!map[owner]) map[owner] = { name: owner, total: 0, critical: 0, blocked: 0, overdue: 0, projects: new Set() };
      map[owner].total++;
      if (issue.sev === "CRITICAL") map[owner].critical++;
      if (issue.status === "BLOCKED") map[owner].blocked++;
      if (issue.due && new Date(issue.due) < new Date()) map[owner].overdue++;
      if (issue.pid) map[owner].projects.add(issue.pid);
    }
    return Object.values(map)
      .map((m) => ({ ...m, projects: m.projects.size }))
      .sort((a, b) => b.total - a.total);
  }, [issues, vi]);

  const avgLoad =
    teamWorkload.length > 0 ? Math.round(teamWorkload.reduce((s, t) => s + t.total, 0) / teamWorkload.length) : 0;
  const overloaded = teamWorkload.filter((t) => t.total > avgLoad * 1.5 && t.total > 5);
  const underloaded = teamWorkload.filter(
    (t) => t.total < avgLoad * 0.5 && t.name !== (vi ? "Chưa phân công" : "Unassigned"),
  );

  // ── AI Personal Insight ──
  const fetchAIInsight = useCallback(async () => {
    if (!isSupabaseConnected() || !supabase?.functions) return;
    setAiLoading(true);
    try {
      const _context = {
        userName,
        role: currentUser?.role,
        myProjects: myProjects.map(
          (p) =>
            `${p.name} (${p.phase}): ${p.open.length} open, ${p.critical.length} critical, ${p.blocked.length} blocked`,
        ),
        myStats: {
          total: myIssues.length,
          open: myIssues.filter((i) => i._status !== "DONE").length,
          critical: myIssues.filter((i) => i._status === "CRITICAL").length,
          blocked: myIssues.filter((i) => i._status === "BLOCKED").length,
        },
        dependencies: dependencies.slice(0, 5).map((d) => `${d.fromIssue.id} → ${d.toPhase} +${d.delayWeeks}w`),
        overloadedPeople: overloaded.map((t) => `${t.name}: ${t.total} tasks`),
      };
      const { data } = await supabase.functions.invoke("ai-advisor", {
        body: {
          issue: {
            id: "PERSONAL",
            title: `Personal workspace for ${userName}`,
            status: "OPEN",
            severity: "MEDIUM",
            phase: "DVT",
            owner: userName,
            rootCause: `${userName} managing ${myProjects.length} projects`,
          },
          context: {
            projectName: "All Projects",
            projectPhase: "Mixed",
            totalOpenIssues: myIssues.filter((i) => i._status !== "DONE").length,
            totalBlockedIssues: myIssues.filter((i) => i._status === "BLOCKED").length,
            ownerWorkload: myIssues.length,
          },
          lang,
        },
      });
      if (data && !data.error) setAiInsight(data);
    } catch {
      /* ignore */
    }
    setAiLoading(false);
  }, [userName, myProjects.length, myIssues.length]);

  useEffect(() => {
    if (userName && myIssues.length > 0) fetchAIInsight();
  }, [userName, myIssues.length > 0]);

  // ── KPI for user ──
  const myOpen = myIssues.filter((i) => i._status !== "DONE").length;
  const myCrit = myIssues.filter((i) => i._status === "CRITICAL" || i._status === "OVERDUE").length;
  const myBlocked = myIssues.filter((i) => i._status === "BLOCKED").length;
  const myDone = myIssues.filter((i) => i._status === "DONE").length;
  const myOverdue = myIssues.filter((i) => i.due && new Date(i.due) < new Date() && i._status !== "DONE").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Header: Welcome ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            fontFamily: mono,
          }}
        >
          {userName[0] || "?"}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: sans }}>
            {vi ? `Xin chào, ${userName}` : `Hello, ${userName}`}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", fontFamily: sans }}>
            {vi
              ? `${myProjects.length} dự án · ${myOpen} việc đang mở · ${myDone} hoàn thành`
              : `${myProjects.length} projects · ${myOpen} open tasks · ${myDone} completed`}
          </div>
        </div>
      </div>

      {/* ── Personal KPI Row ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: vi ? "Dự án" : "Projects", value: myProjects.length, color: "#3B82F6", icon: LayoutDashboard },
          { label: vi ? "Đang mở" : "Open", value: myOpen, color: myOpen > 10 ? "#F59E0B" : "#3B82F6", icon: Clock },
          {
            label: vi ? "Nghiêm trọng" : "Critical",
            value: myCrit,
            color: myCrit > 0 ? "#EF4444" : "#10B981",
            icon: Flame,
          },
          {
            label: vi ? "Bị chặn" : "Blocked",
            value: myBlocked,
            color: myBlocked > 0 ? "#DC2626" : "#10B981",
            icon: Ban,
          },
          {
            label: vi ? "Quá hạn" : "Overdue",
            value: myOverdue,
            color: myOverdue > 0 ? "#EF4444" : "#10B981",
            icon: Timer,
          },
          { label: vi ? "Hoàn thành" : "Done", value: myDone, color: "#10B981", icon: CheckCircle2 },
        ].map((k, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 14px",
              flex: 1,
              minWidth: 85,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <k.icon size={11} color={k.color} />
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-dim)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: sans,
                }}
              >
                {k.label}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: mono, lineHeight: 1 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Personal Insight ── */}
      {(aiInsight || aiLoading) && (
        <div style={{ background: "#8B5CF608", border: "1px solid #8B5CF625", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Brain size={14} color="#8B5CF6" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#8B5CF6",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: sans,
              }}
            >
              {vi ? "AI Tư Vấn Cá Nhân" : "AI Personal Advisor"}
            </span>
            {aiLoading && <RefreshCw size={11} color="#8B5CF6" style={{ animation: "spin 1s linear infinite" }} />}
          </div>
          {aiInsight?.summary && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                marginBottom: 8,
                fontFamily: sans,
              }}
            >
              {aiInsight.summary}
            </div>
          )}
          {aiInsight?.recommendations?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {aiInsight.recommendations.map((r, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 5, fontSize: 12, color: "var(--text-muted)", fontFamily: sans }}
                >
                  <span style={{ color: "#8B5CF6", fontWeight: 700, fontFamily: mono }}>{i + 1}.</span> {r}
                </div>
              ))}
            </div>
          )}
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── My Projects ── */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
            fontFamily: sans,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <LayoutDashboard size={14} color="#3B82F6" />
          {vi ? "Dự án của tôi" : "My Projects"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
          {myProjects.map((proj) => {
            const healthColor = proj.critical.length > 0 ? "#EF4444" : proj.blocked.length > 0 ? "#F59E0B" : "#10B981";
            const completionPct = proj.total > 0 ? Math.round((proj.done.length / proj.total) * 100) : 0;
            return (
              <div
                key={proj.id}
                onClick={() => onNavigateToProject && onNavigateToProject(proj.id)}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${proj.critical.length > 0 ? "#EF444430" : "var(--border)"}`,
                  borderRadius: 8,
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3B82F640")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = proj.critical.length > 0 ? "#EF444430" : "var(--border)")
                }
              >
                {/* Project header */}
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: sans }}>
                      {proj.name}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: PHASE_COLORS[proj.phase] || "var(--text-dim)",
                        background: (PHASE_COLORS[proj.phase] || "#666") + "15",
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontFamily: mono,
                      }}
                    >
                      {proj.phase}
                    </span>
                  </div>
                  <ChevronRight size={12} color="var(--text-faint)" />
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    background: "var(--bg-input)",
                    borderRadius: 2,
                    marginBottom: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${completionPct}%`,
                      background: healthColor,
                      borderRadius: 2,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                {/* Stats row */}
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)", fontFamily: mono }}>
                  <span>
                    {proj.open.length}{" "}
                    <span style={{ color: "var(--text-faint)", fontFamily: sans }}>{vi ? "mở" : "open"}</span>
                  </span>
                  {proj.critical.length > 0 && (
                    <span style={{ color: "#EF4444" }}>
                      {proj.critical.length} <span style={{ fontFamily: sans }}>critical</span>
                    </span>
                  )}
                  {proj.blocked.length > 0 && (
                    <span style={{ color: "#DC2626" }}>
                      {proj.blocked.length} <span style={{ fontFamily: sans }}>blocked</span>
                    </span>
                  )}
                  {proj.overdue.length > 0 && (
                    <span style={{ color: "#F59E0B" }}>
                      {proj.overdue.length} <span style={{ fontFamily: sans }}>{vi ? "quá hạn" : "overdue"}</span>
                    </span>
                  )}
                  <span style={{ marginLeft: "auto", color: "#10B981" }}>{completionPct}%</span>
                </div>
              </div>
            );
          })}
          {myProjects.length === 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 32,
                textAlign: "center",
                gridColumn: "1 / -1",
              }}
            >
              <div style={{ fontSize: 14, color: "var(--text-faint)" }}>
                {vi ? "Chưa có task nào được gán cho bạn" : "No tasks assigned to you yet"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cross-Project Dependencies ── */}
      {dependencies.length > 0 && (
        <div
          style={{ background: "var(--bg-card)", border: "1px solid #F59E0B25", borderRadius: 8, padding: "12px 16px" }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#F59E0B",
              marginBottom: 8,
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Link2 size={13} /> {vi ? "Liên kết giữa các dự án" : "Cross-Project Dependencies"} ({dependencies.length})
          </div>
          {dependencies.slice(0, 5).map((dep, i) => (
            <div
              key={i}
              onClick={() => onNavigateToIssue && onNavigateToIssue(dep.fromIssue)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 0",
                borderBottom: i < Math.min(dependencies.length, 5) - 1 ? "1px solid var(--border-a10)" : "none",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <span style={{ fontFamily: mono, color: "#3B82F6", fontWeight: 600, flexShrink: 0 }}>
                {dep.fromIssue.id}
              </span>
              <span
                style={{
                  color: "var(--text-muted)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: sans,
                }}
              >
                {vi && dep.fromIssue.titleVi ? dep.fromIssue.titleVi : dep.fromIssue.title}
              </span>
              <ArrowRight size={10} color="#F59E0B" />
              <span style={{ fontFamily: mono, color: "#F59E0B", fontWeight: 700 }}>
                {dep.toPhase} +{dep.delayWeeks}w
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Team Workload & Rebalancing ── */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Users size={13} color="#8B5CF6" />
            {vi ? "Khối lượng công việc đội ngũ" : "Team Workload"}
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
              ({vi ? "TB" : "avg"}: {avgLoad})
            </span>
          </div>
          <button
            onClick={() => setShowAllTeam(!showAllTeam)}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "3px 8px",
              color: "var(--text-dim)",
              fontSize: 10,
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            {showAllTeam ? (vi ? "Thu gọn" : "Collapse") : vi ? "Xem tất cả" : "Show all"}
          </button>
        </div>

        {/* Rebalancing suggestions */}
        {(overloaded.length > 0 || underloaded.length > 0) && (
          <div
            style={{
              background: "#F59E0B08",
              border: "1px solid #F59E0B20",
              borderRadius: 6,
              padding: "8px 12px",
              marginBottom: 10,
              display: "flex",
              gap: 6,
              alignItems: "flex-start",
            }}
          >
            <Zap size={12} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#D97706", fontFamily: sans, lineHeight: 1.4 }}>
              {overloaded.length > 0 &&
                (vi
                  ? `${overloaded.map((t) => `${t.name} (${t.total} tasks)`).join(", ")} đang quá tải — cân nhắc phân bổ lại. `
                  : `${overloaded.map((t) => `${t.name} (${t.total} tasks)`).join(", ")} overloaded — consider rebalancing. `)}
              {underloaded.length > 0 &&
                (vi
                  ? `${underloaded.map((t) => t.name).join(", ")} có thể nhận thêm việc.`
                  : `${underloaded.map((t) => t.name).join(", ")} have capacity for more.`)}
            </div>
          </div>
        )}

        {/* Workload bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(showAllTeam ? teamWorkload : teamWorkload.slice(0, 8)).map((member) => {
            const isMe = member.name === userName;
            const isOverloaded = member.total > avgLoad * 1.5 && member.total > 5;
            const barPct = Math.min(100, avgLoad > 0 ? (member.total / (avgLoad * 2)) * 100 : 0);
            const barColor = isOverloaded ? "#EF4444" : member.total > avgLoad ? "#F59E0B" : "#10B981";
            return (
              <div key={member.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                <div style={{ width: 100, minWidth: 100, display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isMe ? 700 : 400,
                      color: isMe ? "#3B82F6" : "var(--text-muted)",
                      fontFamily: sans,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.name} {isMe && "★"}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 14,
                    background: "var(--bg-input)",
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barPct}%`,
                      background: barColor,
                      borderRadius: 3,
                      transition: "width 0.3s",
                    }}
                  />
                  {/* Average line */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "var(--text-faint)",
                      opacity: 0.3,
                    }}
                  />
                </div>
                <div style={{ width: 50, minWidth: 50, textAlign: "right" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: barColor, fontFamily: mono }}>
                    {member.total}
                  </span>
                  {member.blocked > 0 && (
                    <span style={{ fontSize: 9, color: "#EF4444", marginLeft: 3, fontFamily: mono }}>
                      {member.blocked}B
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
