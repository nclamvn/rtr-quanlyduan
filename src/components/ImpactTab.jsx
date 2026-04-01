// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Impact / Cascade Tab
// Extracted from App.jsx
// ═══════════════════════════════════════════════════════════
import { Zap, User, ArrowRight, MapPin, Milestone } from "lucide-react";
import { PHASES, PHASE_COLORS, SEV_COLORS, STATUS_COLORS, mono } from "../constants";
import { Badge, Section } from "./ui";

export default function ImpactTab({ project, selProject, issues, lang, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          marginBottom: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Zap size={16} color="#F59E0B" />
        {t.cascade.ripple} — {project.name}
      </div>

      {issues
        .filter((i) => i.pid === selProject && i.status !== "CLOSED" && i.impacts.length > 0)
        .map((issue) => (
          <div
            key={issue.id}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 14,
              borderLeft: `4px solid ${SEV_COLORS[issue.sev]}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <Badge label={issue.id} color="#3B82F6" />
              <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700 }}>
                {lang === "vi" ? issue.titleVi : issue.title}
              </span>
              <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
              <Badge label={t.status[issue.status]} color={STATUS_COLORS[issue.status]} />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <User size={9} /> {t.issue.owner}: {issue.owner}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div
                style={{
                  background: "var(--bg-input)",
                  borderRadius: 4,
                  padding: "5px 8px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  maxWidth: 200,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 4,
                }}
              >
                <MapPin size={10} style={{ flexShrink: 0, marginTop: 1 }} /> {issue.rootCause}
              </div>
              <ArrowRight size={14} color="var(--text-faint)" />
              {issue.impacts.map((imp, idx) => {
                const pidx = PHASES.indexOf(imp.phase);
                const downstream = PHASES.slice(pidx + 1);
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        background: `${PHASE_COLORS[imp.phase]}12`,
                        border: `1px solid ${PHASE_COLORS[imp.phase]}25`,
                        borderRadius: 4,
                        padding: "5px 8px",
                      }}
                    >
                      <div style={{ fontSize: 11, color: PHASE_COLORS[imp.phase], fontWeight: 700 }}>{imp.phase}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {lang === "vi" ? imp.descVi : imp.desc}
                      </div>
                    </div>
                    {downstream.map((ds) => (
                      <span key={ds} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <ArrowRight size={11} color="#EF4444" />
                        <span
                          style={{
                            background: `${PHASE_COLORS[ds]}10`,
                            border: `1px solid ${PHASE_COLORS[ds]}20`,
                            borderRadius: 3,
                            padding: "2px 6px",
                            fontSize: 11,
                            color: PHASE_COLORS[ds],
                            fontWeight: 600,
                          }}
                        >
                          {ds} {t.cascade.autoShift}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* Milestone Risk Summary */}
      <Section
        title={
          <>
            <Milestone size={13} /> {t.milestoneRisk}
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {PHASES.map((phase) => {
            const count = issues.filter(
              (i) => i.pid === selProject && i.status !== "CLOSED" && i.impacts.some((imp) => imp.phase === phase),
            ).length;
            return (
              <div
                key={phase}
                style={{
                  background: "var(--bg-modal)",
                  borderRadius: 6,
                  padding: 12,
                  border: `1px solid ${count > 0 ? PHASE_COLORS[phase] + "40" : "var(--border)"}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: PHASE_COLORS[phase], fontWeight: 700, marginBottom: 3 }}>
                  {phase}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: count > 0 ? "#EF4444" : "#10B981",
                    fontFamily: mono,
                  }}
                >
                  {count}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.blockingIssues}</div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
