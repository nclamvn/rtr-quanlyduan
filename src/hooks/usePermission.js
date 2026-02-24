import { useAuth } from "../contexts/AuthContext";

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    canCreateIssue: () => ["admin", "pm", "engineer"].includes(role),
    canReviewIssue: () => ["admin", "pm"].includes(role),
    canEditIssue: (issue) => {
      if (["admin", "pm"].includes(role)) return true;
      if (role === "engineer") return issue.owner === user.name;
      return false;
    },
    canCloseIssue: (issue) => {
      if (["admin", "pm"].includes(role)) return true;
      if (role === "engineer") return issue.owner === user.name;
      return false;
    },
    canTransitionPhase: () => ["admin", "pm"].includes(role),
    canToggleGate: () => ["admin", "pm", "engineer"].includes(role),
    canViewReviewQueue: () => ["admin", "pm"].includes(role),
    isReadOnly: () => role === "viewer",
    // PM/Admin create as OPEN, Engineer creates as DRAFT
    getNewIssueStatus: () => ["admin", "pm"].includes(role) ? "OPEN" : "DRAFT",
  };
}
