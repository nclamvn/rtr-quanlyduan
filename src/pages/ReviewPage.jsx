import ReviewTab from "../components/ReviewTab";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import { usePermission } from "../hooks/usePermission";
import { useAuditLog } from "../contexts/AuditContext";
import { LANG } from "../constants";

export default function ReviewPage() {
  const { projects, issues, sbUpdateStatus, online, setIssues } = useData();
  const lang = useAppStore((s) => s.lang);
  const selProject = useProjectStore((s) => s.selectedProjectId);
  const _perm = usePermission();
  const audit = useAuditLog();
  const t = LANG[lang];
  const project = projects.find((p) => p.id === selProject);
  const draftIssues = issues.filter((i) => i.pid === selProject && i.status === "DRAFT");

  const updateIssueStatus = (issueId, newStatus) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;
    const oldStatus = issue.status;
    if (online) sbUpdateStatus(issueId, newStatus);
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)));
    const actionMap = { CLOSED: "ISSUE_CLOSED", OPEN: "ISSUE_REVIEWED" };
    audit.log(actionMap[newStatus] || "ISSUE_STATUS_CHANGED", "issue", issueId, issue.title, oldStatus, newStatus);
  };

  return (
    <ReviewTab project={project} draftIssues={draftIssues} lang={lang} t={t} updateIssueStatus={updateIssueStatus} />
  );
}
