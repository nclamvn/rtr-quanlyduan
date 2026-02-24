import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "rtr_audit_log";
const MAX_ENTRIES = 500;

const AuditContext = createContext(null);

function loadLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // localStorage full — trim older entries
    const trimmed = logs.slice(0, Math.floor(MAX_ENTRIES / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

let logCounter = 0;

export function AuditProvider({ children }) {
  const [logs, setLogs] = useState(loadLogs);
  const { user } = useAuth();

  // Persist on change
  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  const log = useCallback((action, entityType, entityId, entityTitle, oldValue = null, newValue = null, metadata = {}) => {
    // Allow caller to override user info (e.g. during login before context updates)
    const asUser = metadata._asUser;
    const entry = {
      id: `AUD-${Date.now()}-${++logCounter}`,
      timestamp: new Date().toISOString(),
      userId: asUser?.id || user?.id || "system",
      userName: asUser?.name || user?.name || "System",
      userRole: asUser?.role || user?.role || "system",
      action,
      entityType,
      entityId,
      entityTitle,
      oldValue,
      newValue,
      metadata,
    };

    setLogs((prev) => {
      const next = [entry, ...prev];
      // FIFO: keep max entries
      return next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next;
    });

    return entry;
  }, [user]);

  const getLogs = useCallback((filters = {}) => {
    let result = logs;
    if (filters.action) result = result.filter((l) => l.action === filters.action);
    if (filters.userId) result = result.filter((l) => l.userId === filters.userId);
    if (filters.entityType) result = result.filter((l) => l.entityType === filters.entityType);
    if (filters.entityId) result = result.filter((l) => l.entityId === filters.entityId);
    return result;
  }, [logs]);

  const getLogsByEntity = useCallback((entityType, entityId) => {
    return logs.filter((l) => l.entityType === entityType && l.entityId === entityId);
  }, [logs]);

  const getLogsByUser = useCallback((userId) => {
    return logs.filter((l) => l.userId === userId);
  }, [logs]);

  const exportCSV = useCallback(() => {
    const BOM = "\uFEFF";
    const headers = ["ID", "Timestamp", "User", "Role", "Action", "Entity Type", "Entity ID", "Entity Title", "Old Value", "New Value"];
    const rows = logs.map((l) => [
      l.id, l.timestamp, l.userName, l.userRole, l.action,
      l.entityType, l.entityId, l.entityTitle,
      l.oldValue || "", l.newValue || "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    return BOM + [headers.join(","), ...rows].join("\n");
  }, [logs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuditContext.Provider value={{ logs, log, getLogs, getLogsByEntity, getLogsByUser, exportCSV, clearLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAuditLog must be used within AuditProvider");
  return ctx;
}
