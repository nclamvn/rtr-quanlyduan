import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePermission } from "../../hooks/usePermission";

/**
 * Route guard for role-based access.
 * - requiredRole: "admin" | "pm" | ["admin", "pm"]
 * - requireAuth: true (default) — redirects guests to "/"
 * - requirePermission: function name from usePermission (e.g., "canViewReviewQueue")
 */
export default function ProtectedRoute({ children, requiredRole, requirePermission }) {
  const { user, isGuest } = useAuth();
  const perm = usePermission();

  if (isGuest || !user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  if (requirePermission && typeof perm[requirePermission] === "function") {
    if (!perm[requirePermission]()) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
