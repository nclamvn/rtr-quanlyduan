import { useData } from "../contexts/DataContext";
import { useAuditLog } from "../contexts/AuditContext";
import { useAppStore } from "../stores/appStore";
import { useUIStore } from "../stores/uiStore";
import { LANG } from "../constants";
import { sendWebhook } from "../services/webhookService";

export function useIssueActions() {
  const { issues, setIssues, online, sbUpdateStatus, sbCreateIssue, intel } = useData();
  const audit = useAuditLog();
  const lang = useAppStore((s) => s.lang);
  const { showToast, clearToast } = useUIStore();
  const t = LANG[lang];

  const updateIssueStatus = (issueId, newStatus) => {
    const issue = issues.find((i) => i.id === issueId);
    const oldStatus = issue?.status;
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)));
    if (online) sbUpdateStatus(issueId, newStatus);
    const action =
      newStatus === "CLOSED"
        ? "ISSUE_CLOSED"
        : oldStatus === "DRAFT" && newStatus === "OPEN"
          ? "ISSUE_REVIEWED"
          : "ISSUE_STATUS_CHANGED";
    audit.log(action, "issue", issueId, issue?.title || issueId, oldStatus, newStatus);
    showToast({ type: "success", message: `${issueId} → ${t.status[newStatus]}` });
    setTimeout(() => clearToast(), 3000);
    const updatedIssue = { ...issue, status: newStatus };
    intel.ingestIssue(updatedIssue, newStatus === "CLOSED" ? "closed" : "updated");

    // Webhook: overdue or blocked
    if (newStatus === "BLOCKED") {
      sendWebhook(
        "CRITICAL_ISSUE_CREATED",
        `Issue ${issueId} Blocked`,
        `${issue?.title || issueId} has been blocked`,
        "high",
        {
          Issue: issueId,
          Status: `${oldStatus} → ${newStatus}`,
          Owner: issue?.owner || "Unassigned",
        },
      );
    }
  };

  const createIssue = (newIssue) => {
    if (online) {
      sbCreateIssue(newIssue);
    } else {
      setIssues((prev) => [newIssue, ...prev]);
    }
    audit.log("ISSUE_CREATED", "issue", newIssue.id, newIssue.title, null, newIssue.status);
    intel.ingestIssue(newIssue, "created");

    // Webhook: critical issue
    if (newIssue.sev === "CRITICAL") {
      sendWebhook("CRITICAL_ISSUE_CREATED", `Critical Issue: ${newIssue.id}`, newIssue.title, "critical", {
        Issue: newIssue.id,
        Severity: newIssue.sev,
        Phase: newIssue.phase,
        Owner: newIssue.owner || "Unassigned",
      });
    }
  };

  const deleteIssue = async (issueId) => {
    const issue = issues.find((i) => i.id === issueId);
    if (online) {
      const { remove } = await import("../services/supabaseService");
      await remove("issues", issueId);
    }
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    audit.log("ISSUE_DELETED", "issue", issueId, issue?.title || issueId);
  };

  return { updateIssueStatus, createIssue, deleteIssue };
}
