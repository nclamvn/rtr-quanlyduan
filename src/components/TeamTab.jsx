// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Team Tab (extracted from App.jsx)
// ═══════════════════════════════════════════════════════════
import { Users, Flame, Ban } from "lucide-react";
import { mono } from "../constants";
import { Badge, Section, RoleIcon } from "./ui";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

export default function TeamTab({ teamMembers, issues, projects, lang, t }) {
  return (
    <Section
      title={
        <>
          <Users size={14} /> {t.team.workload}
        </>
      }
    >
      {teamMembers.length === 0 ? (
        <EmptyState
          icon={
            (
              EMPTY_MESSAGES[lang]?.team || {
                icon: Users,
                title: lang === "vi" ? "Chưa có dữ liệu đội ngũ" : "No team data",
                desc:
                  lang === "vi"
                    ? "Kết nối Supabase để xem thành viên dự án"
                    : "Connect to Supabase to view project members",
              }
            ).icon
          }
          title={lang === "vi" ? "Chưa có dữ liệu đội ngũ" : "No team data"}
          description={
            lang === "vi" ? "Kết nối Supabase để xem thành viên dự án" : "Connect to Supabase to view project members"
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {teamMembers.map((m) => {
            const memberIssues = issues.filter((i) => i.owner === m.name && i.status !== "CLOSED");
            const crit = memberIssues.filter((i) => i.sev === "CRITICAL").length;
            const blocked = memberIssues.filter((i) => i.status === "BLOCKED").length;
            const projectNames = m.projects.map((pid) => projects.find((p) => p.id === pid)?.name || pid).join(", ");
            return (
              <div
                key={m.name}
                style={{
                  background: "var(--bg-modal)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  border: `1px solid ${crit > 0 ? "#EF444430" : "var(--border)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--hover-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}
                  >
                    {m.name.split(" ").pop()[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-dim)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <RoleIcon role={m.role} />
                      {t.role[m.role]} {projectNames && <>• {projectNames}</>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {crit > 0 && <Badge label={`${crit} CRIT`} color="#EF4444" icon={Flame} />}
                  {blocked > 0 && <Badge label={`${blocked} BLOCK`} color="#DC2626" icon={Ban} />}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: memberIssues.length > 0 ? "#F59E0B" : "#10B981",
                        fontFamily: mono,
                      }}
                    >
                      {memberIssues.length}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase" }}>
                      {t.team.openTasks}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
