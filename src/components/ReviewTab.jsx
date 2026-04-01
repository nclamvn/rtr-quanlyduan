// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Review Queue Tab
// Extracted from App.jsx
// ═══════════════════════════════════════════════════════════
import { ClipboardCheck, Check, X, FileText, GitBranch, User } from "lucide-react";
import { STATUS_COLORS, SEV_COLORS } from "../constants";
import { Badge, Btn, Section } from "./ui";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

export default function ReviewTab({ project, draftIssues, lang, t, updateIssueStatus }) {
  return (
    <Section
      title={
        <>
          <ClipboardCheck size={14} /> {t.review.queue} — {project?.name}
        </>
      }
    >
      {draftIssues.length === 0 ? (
        <EmptyState
          icon={(EMPTY_MESSAGES[lang]?.review || EMPTY_MESSAGES.vi.review).icon}
          title={(EMPTY_MESSAGES[lang]?.review || EMPTY_MESSAGES.vi.review).title}
          description={(EMPTY_MESSAGES[lang]?.review || EMPTY_MESSAGES.vi.review).desc}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {draftIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                background: "var(--bg-modal)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 12,
                borderLeft: "4px solid #6B7280",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Badge label={issue.id} color="#3B82F6" />
                    <Badge label={t.status.DRAFT} color={STATUS_COLORS.DRAFT} icon={FileText} />
                    <Badge label={t.severity[issue.sev]} color={SEV_COLORS[issue.sev]} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                    {lang === "vi" ? issue.titleVi : issue.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-dim)",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <GitBranch size={9} /> {t.issue.rootCause}: {issue.rootCause}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-faint)",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <User size={9} /> {t.issue.owner}: {issue.owner} • Created: {issue.created}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="success" small onClick={() => updateIssueStatus(issue.id, "OPEN")}>
                    <Check size={11} /> {t.review.approve}
                  </Btn>
                  <Btn variant="danger" small onClick={() => updateIssueStatus(issue.id, "DRAFT")}>
                    <X size={11} /> {t.review.reject}
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
