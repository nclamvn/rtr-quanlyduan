import { useAuth } from "../contexts/AuthContext";

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role;

  const isOwner = (entity) => {
    if (!user) return false;
    return entity?.owner_id === user.id || entity?.created_by === user.id || entity?.owner === user.name;
  };

  return {
    canCreateIssue: () => ["admin", "pm", "engineer"].includes(role),
    canReviewIssue: () => ["admin", "pm"].includes(role),
    canEditIssue: (issue) => {
      if (["admin", "pm"].includes(role)) return true;
      if (role === "engineer") return isOwner(issue);
      return false;
    },
    canDeleteIssue: (issue) => {
      if (role === "admin") return true;
      if (role === "pm" && issue?.status === "DRAFT") return true;
      return false;
    },
    canCloseIssue: (issue) => {
      if (["admin", "pm"].includes(role)) return true;
      if (role === "engineer") return isOwner(issue);
      return false;
    },
    canEditBom: () => ["admin", "pm", "engineer"].includes(role),
    canEditSupplier: () => ["admin", "pm"].includes(role),
    canEditDecisions: () => ["admin", "pm"].includes(role),
    canEditFlightTest: () => ["admin", "pm", "engineer"].includes(role),
    canImport: () => ["admin", "pm"].includes(role),
    canViewCost: () => ["admin", "pm"].includes(role),
    canTransitionPhase: () => ["admin", "pm"].includes(role),
    canToggleGate: () => ["admin", "pm", "engineer"].includes(role),
    canViewReviewQueue: () => ["admin", "pm"].includes(role),
    isReadOnly: () => role === "viewer",
    getNewIssueStatus: () => ["admin", "pm"].includes(role) ? "OPEN" : "DRAFT",
  };
}
